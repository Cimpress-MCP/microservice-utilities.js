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
    let publicKeyError = new Error('unit-test-error while calling GetPublicKey');
    let jwtVerifyError = new Error('unit-test-error while verifying JWT');
    let publicKeyId = 'unit-test-kid';
    let errorlevel = 'ERROR';
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
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'Invalid token', method: methodArn },
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
        name: 'fails to get public key',
        request: { headers: { authorization: `Bearer ${token}`, kid: publicKeyId }, methodArn },
        errorLog: { level: errorlevel, title: 'Unauthorized', details: 'Failed to get public key', method: methodArn, error: publicKeyError },
        token,
        unverifiedToken: { header: { kid: publicKeyId } },
        publicKeyError,
        publicKeyId,
        publicKey: 'unit-test-public-key',
        expectedErrorResult: 'Unauthorized',
        expectedResult: null
      },
      {
        name: 'fails when jwt verification fails',
        request: { headers: { authorization: `Bearer ${token}`, kid: publicKeyId }, methodArn },
        errorLog: { level: warnlevel, title: 'Unauthorized', details: 'Error verifying token', method: methodArn, error: jwtVerifyError },
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
        resolvedToken: { sub: 'unit-test-public-key' },
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
          }
        }
      }
    ];
    testCases.forEach(testCase => {
      it(testCase.name, function() {
        let logger = { log() { } };
        let loggerMock = sandbox.mock(logger);
        let requestLog = { level: 'INFO', title: 'Authorizer.getPolicy()', data: testCase.request };
        loggerMock.expects('log').withExactArgs(requestLog).once();
        if (testCase.errorLog) {
          loggerMock.expects('log').withExactArgs(testCase.errorLog).once();
        }

        let authorizer = new Authorizer(logger.log, testConfiguration);
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

        return authorizer.getPolicy(testCase.request)
          .then(() => {
            expect(testCase.expectedErrorResult).to.be.null;
          })
          .catch(err => {
            expect(err.message).to.eql(testCase.expectedErrorResult);
            expect(testCase.expectedResult).to.be.null;
          })
          .then(() => {
            loggerMock.verify();
            jwtManagerMock.verify();
            authorizerMock.verify();
          });
      });
    });
  });
});
