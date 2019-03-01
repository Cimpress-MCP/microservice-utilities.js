const stringify = require('json-stringify-safe');
const uuid = require('uuid');

class RequestLogger {
  /**
   * Constructor
   * @param {Object}   configuration configuration object
   * @param {Function} configuration.logFunction optional log function, by default RequestLogger uses console.log
   * @param {Boolean}  configuration.extendErrorObjects extends Error object globally in order to provide proper JSON
   *                   representation of Error objects.
   * @param {Number}   configuration.jsonSpace the number of spaces that are used then stringifying the message.
   */
  constructor(configuration = { logFunction: console.log, extendErrorObjects: true, jsonSpace: 2 }) {
    this.logFunction = configuration.logFunction;
    this.jsonSpace = configuration.jsonSpace === null || configuration.jsonSpace === undefined ? 2 : configuration.jsonSpace;
    if (configuration.extendErrorObjects) {
      require('error-object-polyfill');
    }

    this.invocationId = null;
  }

  /**
   * Create a new invocation which will end up setting the additional invocation metadata for the request, which will be used when logging.
   */
  startInvocation() {
    this.invocationId = uuid.v4();
  }

  log(message) {
    let type = typeof message;
    let messageAsObject = message;
    if (type === 'undefined' || (type === 'string' && message === '')) {
      console.error('Empty message string.');
      return;
    } else if (type === 'string') {
      messageAsObject = {
        title: message
      };
    } else if (type === 'object' && Object.keys(message).length === 0) {
      console.error('Empty message object.');
      return;
    }

    let payload = {
      invocationId: this.invocationId,
      message: messageAsObject
    };

    let truncateToken = innerPayload => {
      return innerPayload.replace(/(eyJ[a-zA-Z0-9_-]{5,}\.eyJ[a-zA-Z0-9_-]{5,})\.[a-zA-Z0-9_-]*/gi, (m, p1) => `${p1}.<sig>`);
    };

    let stringifiedPayload = truncateToken(stringify(payload, null, this.jsonSpace));
    // https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/cloudwatch_limits_cwl.html 256KB => 32768 characters
    if (stringifiedPayload.length >= 32768) {
      let replacementPayload = {
        invocationId: this.invocationId,
        message: {
          title: 'Payload too large',
          fields: Object.keys(payload),
          truncatedPayload: stringifiedPayload.substring(0, 10000)
        }
      };
      stringifiedPayload = stringify(replacementPayload, null, this.jsonSpace);
    }
    this.logFunction(stringifiedPayload);
  }
}

module.exports = RequestLogger;
