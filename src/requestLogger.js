const stringify = require('json-stringify-safe');

class RequestLogger {
  /**
   * Constructor
   * @param {Object}   configuration configuration object
   * @param {Function} configuration.loggerFunction optional logger function, by default RequestLogger uses console.log
   * @param {Boolean}  configuration.extendErrorObjects extends Error object globally in order to provide proper JSON
   *                   representation of Error objects.
   */
  constructor(configuration = {}) {
    this.loggerFunction = configuration.loggerFunction || console.log;
    if (configuration.extendErrorObjects) {
      require('error-object-polyfill');
    }
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
      message: messageAsObject
    };

    let truncateToken = innerPayload => {
      return innerPayload.replace(/(eyJ[a-zA-Z0-9_-]{5,}\.eyJ[a-zA-Z0-9_-]{5,})\.[a-zA-Z0-9_-]*/gi, (m, p1) => `${p1}.<sig>`);
    };

    this.loggerFunction(truncateToken(stringify(payload, null, 2)));
  }
}

module.exports = RequestLogger;
