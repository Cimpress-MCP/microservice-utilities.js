// disabling some eslint hints since expect wants them, and we have a vm we don't really access, but need for creation
/* eslint no-unused-expressions: "off" */

const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const expect = require('chai').expect;
const PlatformClient = require('../src/platformClient');

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
});
