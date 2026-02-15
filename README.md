# Microservice Utilities

[![CI](https://github.com/Cimpress-MCP/microservice-utilities.js/actions/workflows/ci.yml/badge.svg)](https://github.com/Cimpress-MCP/microservice-utilities.js/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/microservice-utilities.svg)](https://www.npmjs.com/package/microservice-utilities)

Utilities supporting authorization, request logging and other often required parts of microservices.

## Using this library

Install the library.


```bash
nvm use 20
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

# Changelog

## Major Upgrade: Node 20+ Support & AWS SDK v3 Migration

### Breaking Changes
- **Node.js Requirement**: Updated minimum Node.js version from `>=10.0.0` to `>=20.0.0`
- **AWS SDK Migration**: Migrated from AWS SDK v2 to v3
  - `aws-sdk` → `@aws-sdk/client-api-gateway` and `@aws-sdk/client-kms`
  - Updated API calls to use command-based approach instead of promise-based
  - Improved performance and reduced bundle size

### Dependencies Updated
#### Production Dependencies
- `axios`: `^0.21.1` → `^1.13.2`
- `jsonwebtoken`: `^8.5.1` → `^9.0.3`
- `uuid`: `^7.0.3` → `^9.0.1`
- `jwk-to-pem`: `^2.0.3` → `^2.0.7`
- `error-object-polyfill`: `^1.0.13` → `^1.2.49`
- `json-stringify-safe`: `^5.0.1` → `^5.0.1`

#### Development Dependencies
- `mocha`: `^7.1.1` → `^11.7.5`
- `commander`: `^5.0.0` → `^12.1.0`
- `eslint`: `^6.8.0` → `^8.57.0`
- `sinon`: `^9.0.2` → `^21.0.1`
- `chai`: `^4.2.0` → `^4.5.0`
- `sinon-chai`: `^3.5.0` → `^3.7.0`
- `fs-extra`: `^9.0.0` → `^11.3.3`
- Updated ESLint plugins and configurations

### Build & Development
- Fixed `make.js` build script for Commander v12 compatibility
- Updated build process to work with new dependency versions
- All tests pass (35/35) and code lints cleanly
- Improved package security with updated dependencies

### Migration Guide
If you're upgrading from a previous version:

1. **Node.js**: Ensure you're running Node.js 20.0.0 or higher
2. **AWS SDK**: Update your AWS service initialization:
   ```javascript
   // Old (v2)
   const aws = require('aws-sdk');
   const kms = new aws.KMS();

   // New (v3)
   const { KMSClient } = require('@aws-sdk/client-kms');
   const kms = new KMSClient();
   ```
3. **Test your application** thoroughly as some dependencies may have breaking changes

# Contribution

We value your input as part of direct feedback to us, by filing issues, or preferably by directly contributing improvements:

1. Fork this repository
1. Create a branch
1. Contribute
1. Pull request
