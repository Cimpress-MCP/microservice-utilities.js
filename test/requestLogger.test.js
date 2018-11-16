// disabling some eslint hints since expect wants them, and we have a vm we don't really access, but need for creation
/* eslint no-unused-expressions: "off" */

const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const RequestLogger = require('../src/requestLogger');

describe('RequestLogger', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('log()', () => {
    let expectedErrorMessage = 'this is a unit test error';
    let expectedException = new Error(expectedErrorMessage);
    let testCases = [
      {
        name: 'logs an object',
        message: {
          title: 'My title'
        },
        expectedMessage: {
          title: 'My title'
        }
      },
      {
        name: 'uses specified spaces when overridden with 0',
        jsonSpace: 0,
        message: {
          title: 'My title'
        },
        expectedMessage: {
          title: 'My title'
        }
      },
      {
        name: 'logs an exception',
        message: {
          title: 'Exception',
          exception: JSON.stringify({ message: 'error-message' })
        },
        expectedMessage: {
          title: 'Exception',
          exception: JSON.stringify({ message: 'error-message' })
        }
      },
      {
        name: 'Converts strings to objects',
        message: 'this is a string message',
        expectedMessage: {
          title: 'this is a string message'
        }
      },
      {
        name: 'truncates JWT token in exception',
        message: {
          title: 'JWT',
          exception: JSON.stringify({ message: '"Authorization":"Bearer eyJ111111.eyJ222222.333333"' })
        },
        expectedMessage: {
          title: 'JWT',
          exception: JSON.stringify({ message: '"Authorization":"Bearer eyJ111111.eyJ222222.<sig>"' })
        }
      },
      {
        name: 'truncates JWT token in message when object',
        message: {
          title: 'Platform Request Error',
          exception: {
            config: {
              headers: {
                Authorization: 'Bearer eyJ111111.eyJ222222.333333'
              }
            }
          }
        },
        expectedMessage: {
          title: 'Platform Request Error',
          exception: {
            config: {
              headers: {
                Authorization: 'Bearer eyJ111111.eyJ222222.<sig>'
              }
            }
          }
        }
      },
      {
        name: 'truncates when found token anywhere',
        message: {
          title: 'Token in message',
          jwt: 'This was my token eyJ111111.eyJ222222.333333, simon says'
        },
        expectedMessage: {
          title: 'Token in message',
          jwt: 'This was my token eyJ111111.eyJ222222.<sig>, simon says'
        }
      },
      {
        name: 'truncates any oauth token in message when object',
        message: {
          title: 'Platform Request Error',
          exception: {
            message: '"Authorization":"Bearer eyJ111111.eyJ222222.333333"'
          }
        },
        expectedMessage: {
          title: 'Platform Request Error',
          exception: {
            message: '"Authorization":"Bearer eyJ111111.eyJ222222.<sig>"'
          }
        }
      },
      {
        name: 'truncates too large payloads',
        message: {
          title: 'Platform Request Error',
          exception: {
            message: [...Array(100000)].map(() => 1).join('')
          }
        },
        expectedMessage: {
          title: 'Payload too large',
          fields: ['message'],
          truncatedPayload: `{\n  "message": {\n    "title": "Platform Request Error",\n    "exception": {\n      "message": "${[...Array(9907)].map(() => 1).join('')}`
        }
      },
      {
        name: 'errors are serialized correctly',
        message: {
          messageType: 'Platform Request Error',
          exception: expectedException
        },
        expectedMessage: {
          messageType: 'Platform Request Error',
          exception: {
            stack: expectedException.stack,
            message: expectedErrorMessage
          }
        }
      }
    ];
    testCases.map(testCase => {
      it(testCase.name, () => {
        let jsonSpace = testCase.jsonSpace === undefined ? 2 : testCase.jsonSpace;
        let logObj = { message: testCase.expectedMessage };
        let expectedLogString = JSON.stringify(logObj, null, jsonSpace);

        let logger = { log() { } };
        let loggerMock = sandbox.mock(logger);
        loggerMock.expects('log').withExactArgs(expectedLogString);

        let requestLogger = new RequestLogger({ logFunction: logger.log, extendErrorObjects: true, jsonSpace });
        requestLogger.log(testCase.message);

        loggerMock.verify();
      });
    });
  });
});
