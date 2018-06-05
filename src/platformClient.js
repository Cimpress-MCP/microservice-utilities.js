const axios = require('axios');
const uuid = require('uuid');

const invalidToken = 'Invalid token';

class PlatformClient {
  /**
   * Constructor
   * @param {Function} logFunction log function, defaults to console.log
   * @param {Function} tokenResolverFunction optional token resolver function, if provided it will extend the request headers with Bearer token
   */
  constructor(logFunction, tokenResolverFunction = null) {
    this.logFunction = logFunction || console.log;
    this.tokenResolverFunction = tokenResolverFunction;
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
      let newError = error && error.response && {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      } || error.request || error.message || error;
      this.logFunction({
        title: 'Platform Request Error',
        level: 'WARN',
        requestId: error && error.config && error.config.requestId,
        exception: newError
      });

      throw newError;
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

  async createHeadersWithResolvedToken(headers = {}) {
    if (this.tokenResolverFunction) {
      if (headers.Authorization) {
        throw new Error('Authorization header already specified, please create a new PlatformClient with a different (or without a) tokenResolver');
      } else {
        let token = await this.tokenResolverFunction();
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Get from the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   * @param {String} url to send the request to
   * @param {Object} headers request headers
   * @param {String} type accepted response type
   * @return {Promise<Object>}
   */
  async get(url, headers, type = 'json') {
    return this.client.get(url, {
      headers: await this.createHeadersWithResolvedToken(headers),
      responseType: type
    });
  }

  /**
   * Post data to the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   * @param {String} url to send the request to
   * @param {Object} data request data
   * @param {Object} headers request headers
   * @return {Promise<Object>}
   */
  async post(url, data, headers) {
    return this.client.post(url, data, {
      headers: await this.createHeadersWithResolvedToken(headers)
    });
  }

  /**
   * Put data to the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   * @param {String} url to send the request to
   * @param {Object} data request data
   * @param {Object} headers request headers
   * @return {Promise<Object>}
   */
  async put(url, data, headers) {
    return this.client.put(url, data, {
      headers: await this.createHeadersWithResolvedToken(headers)
    });
  }

  /**
   * Patch data on the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   * @param {String} url to send the request to
   * @param {Object} data request data
   * @param {Object} headers request headers
   * @return {Promise<Object>}
   */
  async patch(url, data, headers) {
    return this.client.patch(url, data, {
      headers: await this.createHeadersWithResolvedToken(headers)
    });
  }

  /**
   * Delete the resource on the given url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   * @param {String} url to send the request to
   * @param {Object} headers request headers
   * @return {Promise<Object>}
   */
  async delete(url, headers) {
    return this.client.delete(url, {
      headers: await this.createHeadersWithResolvedToken(headers)
    });
  }

  /**
   * Makes a head call to the provided url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   * @param {String} url to send the request to
   * @param {Object} headers request headers
   * @return {Promise<Object>}
   */
  async head(url, headers) {
    return this.client.head(url, {
      headers: await this.createHeadersWithResolvedToken(headers)
    });
  }

  /**
   * Makes an options call to the provided url. Bearer token is automatically injected if tokenResolverFunction was provided to the constructor.
   * @param {String} url to send the request to
   * @param {Object} headers request headers
   * @return {Promise<Object>}
   */
  async options(url, headers) {
    return this.client.options(url, {
      headers: await this.createHeadersWithResolvedToken(headers)
    });
  }
}

module.exports = PlatformClient;
