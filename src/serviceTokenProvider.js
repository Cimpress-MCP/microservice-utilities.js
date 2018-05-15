const jwtManager = require('jsonwebtoken');

class ServiceTokenProvider {
  /**
   * Constructor
   * @param {Object} httpClient used to perform http calls
   * @param {Object} kmsClient used to decrypt the encrypted secret
   * @param {Object} configuration configuration object
   * @param {String} configuration.clientId client ID
   * @param {String} configuration.encryptedClientSecret base64 encoded encrypted secret
   * @param {String} configuration.audience jwt audience
   * @param {String} configuration.tokenEndpoint endpoint to resolve token from
   */
  constructor(httpClient, kmsClient, configuration = {}) {
    this.httpClient = httpClient;
    this.kmsClient = kmsClient;
    if (!configuration.clientId) {
      throw new Error('Configuration error: missing required property "clientId"');
    }
    if (!configuration.encryptedClientSecret) {
      throw new Error('Configuration error: missing required property "encryptedClientSecret"');
    }
    if (!configuration.audience) {
      throw new Error('Configuration error: missing required property "audience"');
    }
    if (!configuration.tokenEndpoint) {
      throw new Error('Configuration error: missing required property "tokenEndpoint"');
    }
    this.configuration = configuration;
    this.currentTokenPromise = null;
  }

  /**
   * Get access token. Subsequent calls are cached and the token is renewed only if it is expired.
   * @returns {Promise<String>} access token
   */
  async getToken() {
    if (!this.currentTokenPromise) {
      return (this.currentTokenPromise = this.getTokenWithoutCache());
    }

    try {
      let credentials = await this.currentTokenPromise;
      if (!credentials || jwtManager.decode(credentials).exp < Date.now() / 1000) {
        this.currentTokenPromise = this.getTokenWithoutCache();
      }
      return this.currentTokenPromise;
    } catch (error) {
      return (this.currentTokenPromise = this.getTokenWithoutCache());
    }
  }

  /**
   * Get access token.
   * @returns {Promise<String>} access token
   */
  async getTokenWithoutCache() {
    let secret = await this.kmsClient.decrypt({ CiphertextBlob: Buffer.from(this.configuration.encryptedClientSecret, 'base64') }).promise().then(data => data.Plaintext.toString());
    let headers = { 'Content-Type': 'application/json' };
    let body = {
      client_id: this.configuration.clientId,
      client_secret: secret,
      audience: this.configuration.audience,
      grant_type: 'client_credentials'
    };
    let response = await this.httpClient.post(this.configuration.tokenEndpoint, body, headers);
    return response.data.access_token;
  }
}

module.exports = ServiceTokenProvider;
