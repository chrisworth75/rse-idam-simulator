# Postman Collection Generation

This project automatically generates a Postman collection during the Gradle build process.

## How it Works

The `generate-collection.js` Node.js script analyzes the IDAM simulator endpoints and creates a comprehensive Postman collection with:
- All API endpoints organized into logical folders
- Test assertions for each endpoint
- Variable placeholders for dynamic values (accessToken, userId, pin, etc.)
- Proper HTTP methods and request bodies
- Support for OpenID Connect, OAuth2, PIN authentication, and testing endpoints

## Generated Collection Location

The collection is generated at: `build/postman/rse-idam-simulator.postman_collection.json`

## Manual Generation

To manually generate the collection without building the entire project:

```bash
node generate-collection.js
```

Or using Gradle:

```bash
./gradlew generatePostmanCollection
```

## Automatic Generation

The collection is automatically generated during the Gradle build:

```bash
./gradlew clean build
```

## Using the Collection

### Import into Postman
1. Open Postman
2. Click "Import"
3. Select the generated file: `build/postman/rse-idam-simulator.postman_collection.json`
4. Configure the collection variables:
   - `baseUrl`: API URL (default: `http://localhost:5000`)
   - `clientId`: OAuth2 client ID (default: `testClient`)
   - `clientSecret`: OAuth2 client secret (default: `testSecret`)
   - `redirectUri`: OAuth2 redirect URI (default: `http://localhost:3000/callback`)

### Run with Newman
```bash
# Install Newman (if not already installed)
npm install -g newman

# Run the collection
newman run build/postman/rse-idam-simulator.postman_collection.json \
  --env-var "baseUrl=http://localhost:5000" \
  --env-var "clientId=testClient" \
  --env-var "clientSecret=testSecret" \
  --env-var "redirectUri=http://localhost:3000/callback"
```

### CI/CD Integration

The collection generation is integrated into the Gradle build, so it will automatically run in Jenkins or any CI/CD pipeline that builds the project with Gradle.

## Collection Contents

### Health
- Health check endpoint

### OpenID Connect
- Get OpenID Configuration (`.well-known/openid-configuration`)
- Get JSON Web Key Set (JWKS)
- Authorization endpoint (POST `/o/authorize`)
- Token endpoint (POST `/o/token`)
- UserInfo endpoint (GET `/o/userinfo`)

### User Management
- Get user details by ID
- Search users with Elasticsearch query

### Testing Support
- Create test user (`/testing-support/accounts`)
- Get user by email

### PIN Authentication
- Generate PIN
- Authenticate with PIN

### Legacy OAuth2 (Deprecated)
- OAuth2 authorize endpoint (deprecated)
- OAuth2 token endpoint (deprecated)
- Get details endpoint (deprecated)

### Session Management
- Logout (DELETE session)

## Test Flow

The collection includes environment variable management to support a complete authentication flow:

1. **Create Test User** - Creates a user and saves the `userId`
2. **Get Token** - Authenticates and saves the `accessToken`
3. **Get User Info** - Uses the `accessToken` to retrieve user information
4. **Logout** - Ends the session

Each endpoint includes test assertions to verify:
- Status codes
- Response structure
- Required fields
- Token extraction and storage

## Notes

- Default port for IDAM Simulator is **5000** (not 8080 like the other projects)
- The simulator supports both modern OpenID Connect endpoints and legacy OAuth2 endpoints
- Testing support endpoints are available for creating test users dynamically
- PIN authentication is a special authentication flow for letter-based authentication
