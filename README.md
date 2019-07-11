# Microservice Utilities

[![Build Status](https://travis-ci.org/Cimpress-MCP/microservice-utilities.js.svg?branch=master)](https://travis-ci.org/Cimpress-MCP/microservice-utilities.js)
[![npm version](https://badge.fury.io/js/microservice-utilities.svg)](https://www.npmjs.com/package/microservice-utilities)

Utilities supporting authorization, request logging and other often required parts of microservices.

## Using this library

Install the library.

```bash
npm install microservice-utilities
```

### Request Logger
Logger which takes care of truncating Bearer tokens and safe JSON stringification. While it logs to console by default,
it also supports a custom logging function. By default it is also configured to extend the `Error` object using
[error-object-polyfill.js](https://github.com/wparad/error-object-polyfill.js), which enables stringification of `Error`
objects to JSON. That enables the error message and stack traces to appear in logs.

```javascript
const { RequestLogger } = require('microservice-utilities');
const defaultConfiguration = { logFunction: console.log, extendErrorObjects: true };

let requestLogger = new RequestLogger(defaultConfiguration);
requestLogger.log({ title: 'Message title', level: 'WARN', error: 'Error'});
```

### Authorizer
Authorizer to be used with AWS API Gateway. It also adds the caller's JWT to the API Gateway authorizer request context.


Example usage with [OpenAPI Factory](https://github.com/wparad/openapi-factory.js).
```bash
npm install openapi-factory
```

```javascript
const Api = require('openapi-factory');
const { Authorizer, RequestLogger } = require('microservice-utilities');
const configuration = {
  // URL to get jwk keys to verify token
  jwkKeyListUrl: 'https://example.com/.well-known/jwks.json',
  // custom resolver that returns additional context form the AWS Lambda authorizer
  authorizerContextResolver: (identity, token) => ({
    authorizerContextResult: 'my context'
  }),
  // optional AWS API Gateway usage plan
  // See details at https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html
  usagePlan: 'usage-plan-id',
  // jwtVerifyOptions that are passed into jsonwebtoken
  // see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
  // defaults to { algorithms: ['RS256'] }
  jwtVerifyOptions: { algorithms: ['RS256'], audience: 'my-audience' }
};

let requestLogger = new RequestLogger();
let authorizer = new Authorizer(msg => requestLogger.log(msg), configuration);
let api = new Api();

api.setAuthorizer(async request => {
  return await authorizer.getPolicy(request);
});

api.get('/v1/item', async request => {
  // JWT added by authorizer
  let jwt = request.requestContext.authorizer.jwt;

  // JWT included in the request will be automatically truncated by the RequestLogger
  requestLogger.log({ title: 'GET /v1/item', level: 'INFO', request: request });
});
````

### Service Token Provider
Token provider which can be used to retrieve service access tokens. These can be used to call other services on behalf
of the `clientId` specified in the configuration. It uses AWS KMS to decrypt the client secret.

```javascript
const axios = require('axios');
const { ServiceTokenProvider } = require('microservice-utilities');
const configuration = {
  clientId: 'CLIENT_ID',
  encryptedClientSecret: 'BASE64_KMS_ENCRYPTED_CLIENT_SECRET',
  audience: 'https://example.com/',
  tokenEndpoint: 'https://example.com/oauth/token'
};

let kmsClient = new aws.KMS({ region: 'eu-west-1' });
let serviceTokenProvider = new ServiceTokenProvider(axios.create(), kmsClient, configuration);

// recommended way to retrieve token (utilizes caching and takes care of token expiration)
let accessToken = await serviceTokenProvider.getToken();

// or bypass caching and get new token
accessToken = await serviceTokenProvider.getTokenWithoutCache();
```

### Platform Client
Http client wrapper providing convenient `get`, `post`, `put` methods with extended logging. It supports custom Bearer
token resolvers and uses them to set the Authorization header properly.

```javascript
const { PlatformClient, RequestLogger } = require('microservice-utilities');

let requestLogger = new RequestLogger();
let tokenResolver = () => "exampleAccessToken";
let platformClient = new PlatformClient(msg => requestLogger.log(msg), tokenResolver);

let headers = {};
let dataObject = { exampleProperty: 'exampleValue' };

let getResponse = await platformClient.get('VALID_URL', headers);
let postResponse = await platformClient.post('VALID_URL', dataObject, headers);
let putResponse = await platformClient.put('VALID_URL', dataObject, headers);
```

If you wish to override [Http client defaults](https://github.com/axios/axios#config-defaults) and/or add your [own interceptors](https://github.com/axios/axios#interceptors), provide an options object containing an [axios client](https://github.com/axios/axios) as the third parameter when creating `PlatformClient`.

```javascript
const axios = require('axios');
let axiosClient = axios.create({ timeout: 3000 });
new PlatformClient(msg => requestLogger.log(msg), tokenResolver, { client: axiosClient });
```

# Contribution

We value your input as part of direct feedback to us, by filing issues, or preferably by directly contributing improvements:

1. Fork this repository
1. Create a branch
1. Contribute
1. Pull request
