// disabling some eslint hints since expect wants them, and we have a vm we don't really access, but need for creation
/* eslint no-unused-expressions: "off" */

const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const expect = require('chai').expect;
const PlatformClient = require('../src/platformClient');
const axios = require('axios');

describe('PlatformClient', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('get()', () => {
    it('injects the resolved token into Authorization header', async () => {
      const testUrl = 'unit-test-url';
      const testType = 'unit-test-type';
      const testToken = 'unit-test-token';
      const testHeaders = { UnitTestHeader: 'unit-test-header-value' };
      const expectedHeaders = { UnitTestHeader: 'unit-test-header-value', Authorization: `Bearer ${testToken}` };
      const expectedResponse = 'unit-test-response';

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let httpClient = { get() {} };
      let httpClientMock = sandbox.mock(httpClient);
      httpClientMock.expects('get').withExactArgs(testUrl, { headers: expectedHeaders, responseType: testType }).resolves(expectedResponse);

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = httpClient;

      let response = await platformClient.get(testUrl, testHeaders, testType);

      expect(response).to.equal(expectedResponse);
      expect(tokenResolverFunctionMock.calledOnce).to.equal(true);
      httpClientMock.verify();
    });
  });

  describe('post()', () => {
    it('injects the resolved token into Authorization header', async () => {
      const testUrl = 'unit-test-url';
      const testData = 'unit-test-data';
      const testToken = 'unit-test-token';
      const testHeaders = { UnitTestHeader: 'unit-test-header-value' };
      const expectedHeaders = { UnitTestHeader: 'unit-test-header-value', Authorization: `Bearer ${testToken}` };

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let httpClient = { post() {} };
      let httpClientMock = sandbox.mock(httpClient);
      httpClientMock.expects('post').withExactArgs(testUrl, testData, { headers: expectedHeaders }).resolves();

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = httpClient;

      await platformClient.post(testUrl, testData, testHeaders);

      expect(tokenResolverFunctionMock.calledOnce).to.equal(true);
      httpClientMock.verify();
    });
  });

  describe('put()', () => {
    it('injects the resolved token into Authorization header', async () => {
      const testUrl = 'unit-test-url';
      const testData = 'unit-test-data';
      const testToken = 'unit-test-token';
      const testHeaders = { UnitTestHeader: 'unit-test-header-value' };
      const expectedHeaders = { UnitTestHeader: 'unit-test-header-value', Authorization: `Bearer ${testToken}` };

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let httpClient = { put() {} };
      let httpClientMock = sandbox.mock(httpClient);
      httpClientMock.expects('put').withExactArgs(testUrl, testData, { headers: expectedHeaders }).resolves();

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = httpClient;

      await platformClient.put(testUrl, testData, testHeaders);

      expect(tokenResolverFunctionMock.calledOnce).to.equal(true);
      httpClientMock.verify();
    });
  });

  describe('patch()', () => {
    it('injects the resolved token into Authorization header', async () => {
      const testUrl = 'unit-test-url';
      const testData = 'unit-test-data';
      const testToken = 'unit-test-token';
      const testHeaders = { UnitTestHeader: 'unit-test-header-value' };
      const expectedHeaders = { UnitTestHeader: 'unit-test-header-value', Authorization: `Bearer ${testToken}` };

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let httpClient = { patch() {} };
      let httpClientMock = sandbox.mock(httpClient);
      httpClientMock.expects('patch').withExactArgs(testUrl, testData, { headers: expectedHeaders }).resolves();

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = httpClient;

      await platformClient.patch(testUrl, testData, testHeaders);

      expect(tokenResolverFunctionMock.calledOnce).to.equal(true);
      httpClientMock.verify();
    });
  });

  describe('delete()', () => {
    it('injects the resolved token into Authorization header', async () => {
      const testUrl = 'unit-test-url';
      const testToken = 'unit-test-token';
      const testHeaders = { UnitTestHeader: 'unit-test-header-value' };
      const expectedHeaders = { UnitTestHeader: 'unit-test-header-value', Authorization: `Bearer ${testToken}` };

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let httpClient = { delete() {} };
      let httpClientMock = sandbox.mock(httpClient);
      httpClientMock.expects('delete').withExactArgs(testUrl, { headers: expectedHeaders }).resolves();

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = httpClient;

      await platformClient.delete(testUrl, testHeaders);

      expect(tokenResolverFunctionMock.calledOnce).to.equal(true);
      httpClientMock.verify();
    });
  });

  describe('head()', () => {
    it('injects the resolved token into Authorization header', async () => {
      const testUrl = 'unit-test-url';
      const testToken = 'unit-test-token';
      const testHeaders = { UnitTestHeader: 'unit-test-header-value' };
      const expectedHeaders = { UnitTestHeader: 'unit-test-header-value', Authorization: `Bearer ${testToken}` };

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let httpClient = { head() {} };
      let httpClientMock = sandbox.mock(httpClient);
      httpClientMock.expects('head').withExactArgs(testUrl, { headers: expectedHeaders }).resolves();

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = httpClient;

      await platformClient.head(testUrl, testHeaders);

      expect(tokenResolverFunctionMock.calledOnce).to.equal(true);
      httpClientMock.verify();
    });
  });

  describe('options()', () => {
    it('injects the resolved token into Authorization header', async () => {
      const testUrl = 'unit-test-url';
      const testToken = 'unit-test-token';
      const testHeaders = { UnitTestHeader: 'unit-test-header-value' };
      const expectedHeaders = { UnitTestHeader: 'unit-test-header-value', Authorization: `Bearer ${testToken}` };

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let httpClient = { options() {} };
      let httpClientMock = sandbox.mock(httpClient);
      httpClientMock.expects('options').withExactArgs(testUrl, { headers: expectedHeaders }).resolves();

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = httpClient;

      await platformClient.options(testUrl, testHeaders);

      expect(tokenResolverFunctionMock.calledOnce).to.equal(true);
      httpClientMock.verify();
    });
  });

  describe('createHeadersWithResolvedToken()', () => {
    it('adds the platform token', async () => {
      const testToken = 'unit-test-token';

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = {};

      let headers = {};

      let generatedHeader = await platformClient.createHeadersWithResolvedToken(headers);

      expect(generatedHeader.Authorization).to.equal(`Bearer ${testToken}`);
    });

    it('errors when there is an auth header set', async () => {
      const testToken = 'unit-test-token';

      let tokenResolverFunctionMock = sandbox.stub();
      tokenResolverFunctionMock.resolves(testToken);

      let platformClient = new PlatformClient(null, tokenResolverFunctionMock);
      platformClient.client = {};

      let headers = {
        Authorization: 'Bearer abc'
      };

      let error = null;
      try {
        await platformClient.createHeadersWithResolvedToken(headers);
      } catch (e) {
        error = e;
      }
      // fails with null exception if no error is thrown
      expect(error.message).to.equal('Authorization header already specified, please create a new PlatformClient with a different (or without a) tokenResolver');
    });

    it('doesn\'t do anything if the tokenResolver is not present', async () => {
      let platformClient = new PlatformClient(null, null);
      platformClient.client = {};

      let headers = {};

      let generatedHeader = await platformClient.createHeadersWithResolvedToken(headers);

      expect(generatedHeader).to.equal(headers);
    });
  });

  describe('axios client with custom defaults', () => {
    let testCases = [
      {
        name: 'no defaults provided',
        options: undefined,
        defaults: undefined
      },
      {
        name: 'changing default timeout',
        options: { client: axios.create({ timeout: 3000 }) },
        defaults: { timeout: 3000 }
      }
    ];

    testCases.forEach(test => {
      it(test.name, () => {
        let platformClientWithoutDefaultsChanged = new PlatformClient(null, null, null);
        let platformClientWithDefaultsChanged = new PlatformClient(null, null, test.options);

        if (test.defaults) {
          Object.keys(test.defaults).forEach(key => {
            expect(platformClientWithDefaultsChanged.client.defaults[key]).to.deep.equal(test.defaults[key]);
            delete platformClientWithDefaultsChanged.client.defaults[key];
            delete platformClientWithoutDefaultsChanged.client.defaults[key];
          });
        }

        expect(platformClientWithoutDefaultsChanged.client.defaults).to.deep.equal(platformClientWithDefaultsChanged.client.defaults);
      });
    });
  });
});
