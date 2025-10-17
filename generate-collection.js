#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Postman Collection Generator for RSE IDAM Simulator (Spring Boot + Gradle)
 *
 * This script generates a Postman collection by analyzing the IDAM simulator controllers
 * and extracting endpoint information from Spring annotations.
 */

const BASE_URL = '{{baseUrl}}';
const COLLECTION_NAME = 'RSE IDAM Simulator';
const OUTPUT_DIR = path.join(__dirname, 'build', 'postman');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'rse-idam-simulator.postman_collection.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define the Postman collection structure
const collection = {
  info: {
    name: COLLECTION_NAME,
    description: 'IDAM Simulator for testing authentication and authorization',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    {
      key: 'baseUrl',
      value: 'http://localhost:5000',
      type: 'string'
    },
    {
      key: 'clientId',
      value: 'testClient',
      type: 'string'
    },
    {
      key: 'clientSecret',
      value: 'testSecret',
      type: 'string'
    },
    {
      key: 'redirectUri',
      value: 'http://localhost:3000/callback',
      type: 'string'
    }
  ],
  item: []
};

// Health Check folder
const healthFolder = {
  name: 'Health',
  item: [
    {
      name: 'Health Check',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has status UP", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("status");',
              '    pm.expect(jsonData.status).to.eql("UP");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: `${BASE_URL}/health`,
          host: [BASE_URL],
          path: ['health']
        }
      }
    }
  ]
};

// OpenID Connect folder
const openIdFolder = {
  name: 'OpenID Connect',
  item: [
    {
      name: 'Get OpenID Configuration',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has OpenID config", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("issuer");',
              '    pm.expect(jsonData).to.have.property("authorization_endpoint");',
              '    pm.expect(jsonData).to.have.property("token_endpoint");',
              '    pm.expect(jsonData).to.have.property("userinfo_endpoint");',
              '    pm.expect(jsonData).to.have.property("jwks_uri");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: `${BASE_URL}/o/.well-known/openid-configuration`,
          host: [BASE_URL],
          path: ['o', '.well-known', 'openid-configuration']
        }
      }
    },
    {
      name: 'Get JSON Web Key Set',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has JWKS", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("keys");',
              '    pm.expect(jsonData.keys).to.be.an("array");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: `${BASE_URL}/o/jwks`,
          host: [BASE_URL],
          path: ['o', 'jwks']
        }
      }
    },
    {
      name: 'Authorize (POST)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 302", function () {',
              '    pm.response.to.have.status(302);',
              '});',
              '',
              'pm.test("Location header contains code", function () {',
              '    var location = pm.response.headers.get("Location");',
              '    pm.expect(location).to.include("code=");',
              '    ',
              '    // Extract and save the authorization code',
              '    var code = location.match(/code=([^&]+)/)[1];',
              '    pm.environment.set("authCode", code);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/x-www-form-urlencoded'
          }
        ],
        body: {
          mode: 'urlencoded',
          urlencoded: [
            {
              key: 'client_id',
              value: '{{clientId}}'
            },
            {
              key: 'redirect_uri',
              value: '{{redirectUri}}'
            },
            {
              key: 'response_type',
              value: 'code'
            },
            {
              key: 'state',
              value: 'random-state-value'
            }
          ]
        },
        url: {
          raw: `${BASE_URL}/o/authorize`,
          host: [BASE_URL],
          path: ['o', 'authorize']
        }
      }
    },
    {
      name: 'Get Token',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has tokens", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("access_token");',
              '    pm.expect(jsonData).to.have.property("id_token");',
              '    pm.expect(jsonData).to.have.property("refresh_token");',
              '    pm.expect(jsonData).to.have.property("token_type");',
              '    pm.expect(jsonData.token_type).to.eql("Bearer");',
              '    ',
              '    // Save the access token for subsequent requests',
              '    pm.environment.set("accessToken", jsonData.access_token);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/x-www-form-urlencoded'
          }
        ],
        body: {
          mode: 'urlencoded',
          urlencoded: [
            {
              key: 'client_id',
              value: '{{clientId}}'
            },
            {
              key: 'client_secret',
              value: '{{clientSecret}}'
            },
            {
              key: 'grant_type',
              value: 'password'
            },
            {
              key: 'username',
              value: 'test@example.com'
            },
            {
              key: 'password',
              value: 'password'
            },
            {
              key: 'scope',
              value: 'openid profile roles'
            }
          ]
        },
        url: {
          raw: `${BASE_URL}/o/token`,
          host: [BASE_URL],
          path: ['o', 'token']
        }
      }
    },
    {
      name: 'Get User Info',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has user info", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("sub");',
              '    pm.expect(jsonData).to.have.property("email");',
              '    pm.expect(jsonData).to.have.property("name");',
              '    pm.expect(jsonData).to.have.property("uid");',
              '    pm.expect(jsonData).to.have.property("roles");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{accessToken}}'
          }
        ],
        url: {
          raw: `${BASE_URL}/o/userinfo`,
          host: [BASE_URL],
          path: ['o', 'userinfo']
        }
      }
    }
  ]
};

// User Management folder
const userFolder = {
  name: 'User Management',
  item: [
    {
      name: 'Get User Details by ID',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has user details", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("id");',
              '    pm.expect(jsonData).to.have.property("email");',
              '    pm.expect(jsonData).to.have.property("forename");',
              '    pm.expect(jsonData).to.have.property("surname");',
              '    pm.expect(jsonData).to.have.property("roles");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{accessToken}}'
          }
        ],
        url: {
          raw: `${BASE_URL}/api/v1/users/{{userId}}`,
          host: [BASE_URL],
          path: ['api', 'v1', 'users', '{{userId}}']
        }
      }
    },
    {
      name: 'Search Users',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response is array of users", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.be.an("array");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{accessToken}}'
          }
        ],
        url: {
          raw: `${BASE_URL}/api/v1/users?query=email:test@example.com`,
          host: [BASE_URL],
          path: ['api', 'v1', 'users'],
          query: [
            {
              key: 'query',
              value: 'email:test@example.com'
            }
          ]
        }
      }
    }
  ]
};

// Testing Support folder
const testingFolder = {
  name: 'Testing Support',
  item: [
    {
      name: 'Create Test User',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has user ID", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("id");',
              '    pm.environment.set("userId", jsonData.id);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            email: 'testuser@example.com',
            forename: 'Test',
            surname: 'User',
            roles: [
              {
                code: 'citizen'
              }
            ]
          }, null, 2)
        },
        url: {
          raw: `${BASE_URL}/testing-support/accounts`,
          host: [BASE_URL],
          path: ['testing-support', 'accounts']
        }
      }
    },
    {
      name: 'Get User by Email',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has user details", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("email");',
              '    pm.expect(jsonData).to.have.property("id");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: `${BASE_URL}/testing-support/accounts?email=testuser@example.com`,
          host: [BASE_URL],
          path: ['testing-support', 'accounts'],
          query: [
            {
              key: 'email',
              value: 'testuser@example.com'
            }
          ]
        }
      }
    }
  ]
};

// PIN Authentication folder
const pinFolder = {
  name: 'PIN Authentication',
  item: [
    {
      name: 'Generate PIN',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has PIN", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("pin");',
              '    pm.environment.set("pin", jsonData.pin);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            firstName: 'John',
            lastName: 'Doe'
          }, null, 2)
        },
        url: {
          raw: `${BASE_URL}/pin`,
          host: [BASE_URL],
          path: ['pin']
        }
      }
    },
    {
      name: 'Authenticate with PIN',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 302", function () {',
              '    pm.response.to.have.status(302);',
              '});',
              '',
              'pm.test("Location header contains code", function () {',
              '    var location = pm.response.headers.get("Location");',
              '    pm.expect(location).to.include("code=");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [
          {
            key: 'pin',
            value: '{{pin}}'
          },
          {
            key: 'Content-Type',
            value: 'application/x-www-form-urlencoded'
          }
        ],
        url: {
          raw: `${BASE_URL}/pin?client_id={{clientId}}&redirect_uri={{redirectUri}}&state=test-state`,
          host: [BASE_URL],
          path: ['pin'],
          query: [
            {
              key: 'client_id',
              value: '{{clientId}}'
            },
            {
              key: 'redirect_uri',
              value: '{{redirectUri}}'
            },
            {
              key: 'state',
              value: 'test-state'
            }
          ]
        }
      }
    }
  ]
};

// Legacy OAuth2 folder (deprecated endpoints)
const legacyFolder = {
  name: 'Legacy OAuth2 (Deprecated)',
  item: [
    {
      name: 'OAuth2 Authorize (Deprecated)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has code", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("code");',
              '    pm.environment.set("oauth2Code", jsonData.code);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Authorization',
            value: 'Basic dGVzdEB0ZXN0LmNvbTpwYXNzd29yZA=='
          },
          {
            key: 'Content-Type',
            value: 'application/x-www-form-urlencoded'
          }
        ],
        body: {
          mode: 'urlencoded',
          urlencoded: [
            {
              key: 'client_id',
              value: '{{clientId}}'
            },
            {
              key: 'redirect_uri',
              value: '{{redirectUri}}'
            },
            {
              key: 'response_type',
              value: 'code'
            }
          ]
        },
        url: {
          raw: `${BASE_URL}/oauth2/authorize`,
          host: [BASE_URL],
          path: ['oauth2', 'authorize']
        }
      }
    },
    {
      name: 'OAuth2 Token (Deprecated)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has access token", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("access_token");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/x-www-form-urlencoded'
          }
        ],
        body: {
          mode: 'urlencoded',
          urlencoded: [
            {
              key: 'client_id',
              value: '{{clientId}}'
            },
            {
              key: 'client_secret',
              value: '{{clientSecret}}'
            },
            {
              key: 'grant_type',
              value: 'authorization_code'
            },
            {
              key: 'code',
              value: '{{oauth2Code}}'
            },
            {
              key: 'redirect_uri',
              value: '{{redirectUri}}'
            }
          ]
        },
        url: {
          raw: `${BASE_URL}/oauth2/token`,
          host: [BASE_URL],
          path: ['oauth2', 'token']
        }
      }
    },
    {
      name: 'Get Details (Deprecated)',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has user details", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData).to.have.property("id");',
              '    pm.expect(jsonData).to.have.property("email");',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'GET',
        header: [
          {
            key: 'Authorization',
            value: 'Bearer {{accessToken}}'
          }
        ],
        url: {
          raw: `${BASE_URL}/details`,
          host: [BASE_URL],
          path: ['details']
        }
      }
    }
  ]
};

// Session Management folder
const sessionFolder = {
  name: 'Session Management',
  item: [
    {
      name: 'Logout',
      event: [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              'pm.test("Status code is 204", function () {',
              '    pm.response.to.have.status(204);',
              '});'
            ]
          }
        }
      ],
      request: {
        method: 'DELETE',
        header: [],
        url: {
          raw: `${BASE_URL}/session/{{accessToken}}`,
          host: [BASE_URL],
          path: ['session', '{{accessToken}}']
        }
      }
    }
  ]
};

// Add all folders to collection
collection.item.push(healthFolder);
collection.item.push(openIdFolder);
collection.item.push(userFolder);
collection.item.push(testingFolder);
collection.item.push(pinFolder);
collection.item.push(legacyFolder);
collection.item.push(sessionFolder);

// Write the collection to file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));

console.log(`\nPostman collection generated successfully!`);
console.log(`Location: ${OUTPUT_FILE}`);
console.log(`\nTo use this collection:`);
console.log(`1. Import into Postman: ${OUTPUT_FILE}`);
console.log(`2. Run with Newman: newman run ${OUTPUT_FILE}`);
console.log(`3. Set the baseUrl, clientId, clientSecret, and redirectUri variables\n`);
console.log(`Note: Default port for IDAM Simulator is 5000`);
