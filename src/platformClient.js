const axios = require('axios');
const uuid = require('uuid');

const invalidToken = 'Invalid token';

class PlatformClient {
  /**
   * Constructor
   * @param {Function} logFunction log function, defaults to console.log
   */
  constructor(logFunction) {
    this.logFunction = logFunction || console.log;
    let client = axios.create();

    client.interceptors.request.use(config => {
      config.requestId = uuid.v4();
      this.logFunction({
        title: 'Platform Request',
        level: 'INFO',
        requestId: config.requestId,
        method: config.method,
        url: config.url
      }, false);

      if (!config.url) {
        return Promise.reject({ response: { status: 400, data: { description: 'PlatformClient Error: "url" must be defined', errorCode: 'BadRequest' } } });
      }
      return config;
    }, error => {
      this.logFunction({
        title: 'Platform Request Error',
        level: 'WARN',
        requestId: error && error.config && error.config.requestId,
        exception: error
      });

      throw error;
    });

    client.interceptors.response.use(response => response, error => {
      if (error.message === invalidToken) {
        this.logFunction({
          title: 'Platform call skipped due to a token error',
          level: 'INFO',
          requestId: error && error.config && error.config.requestId,
          exception: error
        });
      } else {
        this.logFunction({
          title: 'Platform Response Error',
          level: 'INFO',
          requestId: error && error.config && error.config.requestId,
          exception: error
        });
      }
      throw error;
    });

    this.client = client;
  }

  get(url, headers, type = 'json') {
    return this.client.get(url, {
      headers: headers,
      responseType: type
    });
  }

  post(url, data, headers) {
    return this.client.post(url, data, {
      headers: headers
    });
  }

  put(url, data, headers) {
    return this.client.put(url, data, {
      headers: headers
    });
  }
}

module.exports = PlatformClient;
