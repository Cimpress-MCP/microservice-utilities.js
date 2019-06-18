/* eslint-disable no-unused-expressions */
'use strict';
const describe = require('mocha').describe;
const it = require('mocha').it;
const beforeEach = require('mocha').beforeEach;
const afterEach = require('mocha').afterEach;
const sinon = require('sinon');
const expect = require('chai').expect;
const Authorizer = require('../src/authorizer');
const jwtManager = require('jsonwebtoken');

describe('authorizer.js', function() {
  let sandbox;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });
  afterEach(function() {
    sandbox.restore();
  });
  describe('getPolicy()', function() {
    let testConfiguration = { jwkKeyListUrl: 'unit-test-url' };
    let methodArn = 'unit-test-arn';
    let token = 'some-unit-test-token';
    let testAuthorizerContextResult = 'authorizerContextResult';
    let publicKeyError = new Error('unit-test-error while calling GetPublicKey');
    let jwtVerifyError = new Error('unit-test-error while verifying JWT');
    let publicKeyId = 'unit-test-kid';
    let warnlevel = 'WARN';

    let testCases = [
      {
        name: 'fails when header not available in request',
        request: { methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'No token specified', method: methodArn },
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'fails when no authorization header available',
        request: { headers: {}, methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'No token specified', method: methodArn },
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'fails when invalid authorization header specified (single word)',
        request: { headers: { authorization: 'only-single-word' }, methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'No token specified', method: methodArn },
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'fails when invalid authorization header specified (more than two words)',
        request: { headers: { authorization: 'more than two words' }, methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'No token specified', method: methodArn },
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'fails when invalid token specified',
        request: { headers: { authorization: `Bearer ${token}` }, methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'Invalid token', method: methodArn, token },
        token,
        unverifiedToken: null,
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'no kid specified',
        request: { headers: { authorization: `Bearer ${token}`, kid: publicKeyId }, methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'Token did no provide a KID', method: methodArn, token },
        token,
        unverifiedToken: { header: { kid: null } },
        publicKeyError,
        publicKeyId,
        publicKey: 'unit-test-public-key',
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'fails when jwt verification fails',
        request: { headers: { authorization: `Bearer ${token}`, kid: publicKeyId }, methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'Error verifying token', method: methodArn, error: jwtVerifyError, token },
        token,
        unverifiedToken: { header: { kid: publicKeyId } },
        jwtVerifyError,
        publicKeyId,
        publicKey: 'unit-test-public-key',
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'resolves principal',
        request: { headers: { authorization: `Bearer ${token}` }, methodArn },
        token,
        unverifiedToken: { header: { kid: publicKeyId } },
        publicKeyId,
        resolvedToken: { sub: 'unit-test-sub', azp: 'unit-test-azp' },
        publicKey: 'unit-test-public-key',
        expectedErrorResult: null,
        expectedResult: {
          principalId: 'unit-test-sub',
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
        }
      },
      {
        name: 'resolves principal with client token',
        request: { headers: { authorization: `Bearer ${token}` }, methodArn },
        token,
        unverifiedToken: { header: { kid: publicKeyId } },
        publicKeyId,
        resolvedToken: { sub: 'unit-test-sub@clients', azp: 'unit-test-azp' },
        publicKey: 'unit-test-public-key',
        expectedErrorResult: null,
        expectedResult: {
          principalId: 'unit-test-sub@clients',
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
        }
      },
      {
        name: 'use custom context resolver',
        request: { headers: { authorization: `Bearer ${token}` }, methodArn },
        token,
        unverifiedToken: { header: { kid: publicKeyId } },
        publicKeyId,
        resolvedToken: { sub: 'unit-test-sub', azp: 'unit-test-azp' },
        publicKey: 'unit-test-public-key',
        expectedErrorResult: null,
        expectedResult: {
          principalId: 'unit-test-sub',
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
            authorizerContextResult: testAuthorizerContextResult
          }
        },
        configuration: {
          jwkKeyListUrl: 'unit-test-url',
          authorizerContextResolver: () => ({
            authorizerContextResult: testAuthorizerContextResult
          })
        }
      }
    ];
    testCases.forEach(testCase => {
      it(testCase.name, async () => {
        let logger = { log() { } };
        let loggerMock = sandbox.mock(logger);
        let requestLog = { level: 'INFO', title: 'Authorizer.getPolicy()', data: testCase.request };
        loggerMock.expects('log').withExactArgs(requestLog).once();
        if (testCase.errorLog) {
          loggerMock.expects('log').withExactArgs(testCase.errorLog).once();
        }

        let authorizer = new Authorizer(logger.log, testCase.configuration || testConfiguration);
        let authorizerMock = sandbox.mock(authorizer);

        let jwtManagerMock = sandbox.mock(jwtManager);
        if (testCase.token) {
          jwtManagerMock.expects('decode').withExactArgs(testCase.token, { complete: true }).once().returns(testCase.unverifiedToken);
          let expectation = authorizerMock.expects('getPublicKeyPromise')
            .withExactArgs(testCase.publicKeyId)
            .atMost(1);
          if (testCase.publicKeyError) {
            expectation.rejects(testCase.publicKeyError);
          } else if (testCase.unverifiedToken) {
            expectation.resolves(testCase.publicKey);
            let jwtExpectation = jwtManagerMock.expects('verify').withExactArgs(testCase.token, testCase.publicKey, { algorithms: ['RS256'] });
            if (testCase.jwtVerifyError) {
              jwtExpectation.throws(jwtVerifyError);
            } else {
              jwtExpectation.returns(testCase.resolvedToken);
            }
          }
        }

        let result = null;
        let error = null;
        try {
          result = await authorizer.getPolicy(testCase.request);
        } catch (err) {
          error = err;
        }
        expect(result).to.eql(testCase.expectedResult);
        expect(error && error.message || null).to.eql(testCase.expectedErrorResult);
        loggerMock.verify();
        jwtManagerMock.verify();
        authorizerMock.verify();
      });
    });
  });
});
