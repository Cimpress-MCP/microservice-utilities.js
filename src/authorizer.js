const axios = require('axios');
const jwtManager = require('jsonwebtoken');
const jwkConverter = require('jwk-to-pem');

class Authorizer {
  /**
   * Constructor
   * @param {Object} logger function
   * @param {Object} configuration configuration object
   * @param {String} configuration.jwkKeyListUrl url used to retrieve the jwk public keys
   */
  constructor(logger, configuration = {}) {
    this.logger = logger;
    if (!logger) {
      throw new Error('Authorizer configuration error: missing required parameter "logger"');
    }
    if (!configuration.jwkKeyListUrl) {
      throw new Error('Authorizer configuration error: missing required property "jwkKeyListUrl"');
    }
    this.configuration = configuration;
    this.publicKeysPromise = null;
  }

  async getPublicKeyPromise(kid) {
    if (!this.publicKeysPromise) {
      this.publicKeysPromise = axios.get(this.configuration.jwkKeyListUrl);
    }
    let result = await this.publicKeysPromise;
    let jwk = result.data.keys.find(key => key.kid === kid);
    if (jwk) {
      return jwkConverter(jwk);
    }
    this.publicKeysPromise = null;
    this.logger({ level: 'ERROR', title: 'Unauthorized', details: 'PublicKey-Resolution-Failure', kid: kid || 'NO_KID_SPECIFIED', keys: result.data.keys });
    throw new Error('Unauthorized');
  }

  async getPolicy(request) {
    let methodArn = request.methodArn;
    let token = this.getTokenFromAuthorizationHeader(request);
    if (!token) {
      this.logger({ level: 'WARN', title: 'Unauthorized', details: 'No token specified', method: methodArn });
      throw new Error('Unauthorized');
    }

    let unverifiedToken = jwtManager.decode(token, { complete: true });
    if (!unverifiedToken) {
      this.logger({ level: 'WARN', title: 'Unauthorized', details: 'Invalid token', method: methodArn });
      throw new Error('Unauthorized');
    }

    let kid = unverifiedToken && unverifiedToken.header && unverifiedToken.header.kid;

    let key = null;
    try {
      key = await this.getPublicKeyPromise(kid);
    } catch (error) {
      this.logger({ level: 'ERROR', title: 'Unauthorized', details: 'Failed to get public key', error: error, method: methodArn });
      throw new Error('Unauthorized');
    }

    try {
      let identity = await jwtManager.verify(token, key, { algorithms: ['RS256'] });
      return {
        principalId: identity.sub,
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'execute-api:Invoke'
              ],
              Resource: [
                'arn:aws:execute-api:*:*:*'
              ]
            }
          ]
        },
        context: {
          jwt: token
        }
      };
    } catch (exception) {
      this.logger({ level: 'ERROR', title: 'Unauthorized', details: 'Error verifying token', error: exception, method: methodArn });
      throw new Error('Unauthorized');
    }
  }

  getTokenFromAuthorizationHeader(request) {
    let authorizationHeaderKey = Object.keys(request.headers || {})
      .find(headerKey => headerKey.toLowerCase() === 'authorization') || null;
    let authorizationHeader = authorizationHeaderKey ? request.headers[authorizationHeaderKey] : null;
    let authorizationHeaderFragments = authorizationHeader ? authorizationHeader.split(' ') : [];
    return authorizationHeaderFragments.length === 2 ? authorizationHeaderFragments[1] : null;
  }
}

module.exports = Authorizer;
