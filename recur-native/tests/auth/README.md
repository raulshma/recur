# Authentication Flow Testing

This directory contains tests for the authentication flow integration. The tests verify that:

1. Login flow correctly authenticates users and stores authentication data
2. Logout flow clears authentication data
3. Token refresh mechanism works correctly
4. Session persistence restores authentication state on app restart
5. Expired tokens are automatically refreshed

## Running the Tests

To run the authentication flow tests:

```bash
cd recur-native
npm test -- --testPathPattern=tests/auth
```

## Manual Testing

To manually test the authentication flow:

1. **Login Flow**:
   - Launch the app
   - Enter valid credentials on the login screen
   - Verify you are redirected to the main app screen
   - Verify the authentication token is stored securely

2. **Protected Routes**:
   - Try to access a protected route without authentication
   - Verify you are redirected to the login screen
   - Login and verify you can access the protected route

3. **Session Persistence**:
   - Login to the app
   - Close and reopen the app
   - Verify you are still authenticated and don't need to login again

4. **Token Refresh**:
   - Login to the app
   - Wait for the token to expire (or manually expire it)
   - Perform an API request
   - Verify the token is refreshed automatically and the request succeeds

5. **Logout Flow**:
   - Login to the app
   - Logout
   - Verify you are redirected to the login screen
   - Verify authentication data is cleared
   - Close and reopen the app
   - Verify you are still logged out

## Authentication Guards

The authentication flow uses the `AuthGuard` component to protect routes that require authentication. The guard:

1. Checks if the user is authenticated
2. Redirects to the login screen if not authenticated
3. Allows access to protected routes if authenticated
4. Redirects to the main app if trying to access auth screens while authenticated

## Token Refresh Mechanism

The token refresh mechanism:

1. Automatically refreshes tokens before they expire
2. Handles 401 errors by attempting to refresh the token
3. Redirects to login if token refresh fails
4. Ensures a smooth user experience without interruptions due to token expiration