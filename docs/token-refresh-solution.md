# Token Refresh Solution

This document outlines the token refresh solution implemented in the Etanzeem Diary App to handle authentication token expiration and refresh.

## Problem

The app was experiencing issues with token expiration, particularly in the following scenarios:

1. When multiple API calls were made concurrently, multiple token refresh attempts would occur simultaneously
2. Race conditions would occur when different components tried to refresh the token at the same time
3. Token refresh failures weren't properly handled, leading to inconsistent app state
4. Screens that required fresh tokens for API calls would sometimes fail due to token expiration

## Solution

We implemented a comprehensive token refresh solution with the following components:

### 1. Centralized Token Refresh Mechanism

The `apiClient.ts` file now includes a centralized token refresh mechanism that:

- Uses a queue system to prevent multiple simultaneous refresh attempts
- Ensures all pending requests receive the new token once refresh is complete
- Properly handles refresh failures by logging the user out
- Adds detailed logging to track token refresh operations

### 2. Enhanced API Request Functions

Both `apiRequest` and `directApiRequest` functions now:

- Check token expiration before making requests
- Use the centralized refresh mechanism when needed
- Retry failed requests with the new token
- Handle authentication errors consistently

### 3. Custom Hook for Components

A new `useTokenRefresh` hook provides components with:

- A way to check and refresh tokens when needed
- Functions to ensure fresh tokens before critical operations
- Consistent error handling for token-related issues

### 4. Screen-Level Implementation

All report-related screens now:

- Check for token freshness on mount
- Refresh tokens when the screen comes into focus
- Ensure fresh tokens before navigation
- Handle retry operations with proper token refresh

## Key Files

1. **`app/services/apiClient.ts`**: Contains the core token refresh logic and API request functions
2. **`app/utils/tokenRefresh.ts`**: Provides the custom hook for components
3. **`app/features/auth/authSlice.ts`**: Contains the updated `checkAndRefreshTokenIfNeeded` function
4. **`app/features/persons/personSlice.ts`**: Uses the improved token refresh mechanism
5. **Report-related screens**: Implement the token refresh hook for consistent behavior

## Usage

### In API Services

```typescript
import apiRequest from '../../services/apiClient';

// The token will be automatically refreshed if needed
const response = await apiRequest<DataType>(() => ({
  path: '/some/api/endpoint',
  method: 'GET',
}));
```

### In Components

```typescript
import { useTokenRefresh } from '@/app/utils/tokenRefresh';

const MyComponent = () => {
  const { refreshTokenIfNeeded, ensureFreshTokenBeforeOperation } = useTokenRefresh();
  
  // Refresh token on component mount
  useEffect(() => {
    refreshTokenIfNeeded();
  }, []);
  
  // Ensure fresh token before critical operations
  const handleImportantAction = async () => {
    try {
      // This will refresh the token if needed
      await ensureFreshTokenBeforeOperation();
      
      // Now perform your API calls with the fresh token
      // ...
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  };
  
  // ...
};
```

## Benefits

1. **Improved Reliability**: The app now handles token expiration gracefully
2. **Reduced Redundancy**: Token refresh happens only once even with multiple concurrent requests
3. **Better User Experience**: Users don't need to log in again as frequently
4. **Consistent Error Handling**: Authentication errors are handled uniformly across the app
5. **Detailed Logging**: Token refresh operations are logged for easier debugging

## Future Improvements

1. Add offline token storage with secure storage
2. Implement background token refresh
3. Add analytics to track token refresh patterns and optimize refresh timing