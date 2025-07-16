# Enhanced Token Refresh System

## Overview

The enhanced token refresh system provides automatic background token management to ensure users stay authenticated without interruption. It includes intelligent token refresh timing, background processing, and comprehensive error handling.

## Features

### 🔄 Automatic Background Refresh
- **Periodic Checks**: Automatically checks token expiration every minute
- **Smart Timing**: Refreshes tokens 5 minutes before they expire
- **Cooldown Protection**: Prevents excessive refresh attempts (30-second cooldown)
- **App State Awareness**: Handles app foreground/background transitions

### 🛡️ Robust Error Handling
- **Singleton Promise**: Ensures only one refresh operation at a time
- **Graceful Degradation**: Background refresh failures don't force logout
- **Retry Logic**: Failed refreshes are retried on next API call
- **Logout Protection**: Prevents multiple simultaneous logout calls

### 📊 Debug & Monitoring
- **Real-time Status**: Track refresh status and timing
- **Debug Panel**: Development-only panel showing token information
- **Comprehensive Logging**: Detailed logs for troubleshooting

## Architecture

### Core Components

#### 1. `useTokenRefresh` Hook
```typescript
const { 
  refreshTokenIfNeeded, 
  ensureFreshTokenBeforeOperation, 
  getTokenInfo,
  isAuthenticated, 
  isTokenExpired 
} = useTokenRefresh();
```

**Features:**
- Automatic token refresh on component mount
- Background refresh timer management
- App state change handling
- Token expiry information

#### 2. Background Refresh System
```typescript
// Singleton variables for background management
let backgroundRefreshTimer: NodeJS.Timeout | null = null;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 30000; // 30 seconds
const BACKGROUND_CHECK_INTERVAL = 60000; // 1 minute
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes
```

#### 3. Utility Functions
```typescript
// Manual refresh trigger
await triggerBackgroundRefresh(dispatch, tokens);

// Get refresh status
const status = getBackgroundRefreshStatus();

// Cleanup on logout
cleanupBackgroundRefresh();
```

## Usage

### Basic Implementation

#### 1. In Root Layout
```typescript
// app/_layout.tsx
import { useTokenRefresh } from './utils/tokenRefresh';

export default function RootLayout() {
  // Initialize automatic token refresh
  useTokenRefresh();
  
  return (
    // Your app layout
  );
}
```

#### 2. In Components
```typescript
// Any component that needs token management
import { useTokenRefresh } from '@/app/utils/tokenRefresh';

const MyComponent = () => {
  const { 
    refreshTokenIfNeeded, 
    getTokenInfo,
    isAuthenticated 
  } = useTokenRefresh();
  
  // Token info for debugging
  const tokenInfo = getTokenInfo();
  
  // Manual refresh if needed
  const handleCriticalOperation = async () => {
    await refreshTokenIfNeeded();
    // Proceed with operation
  };
  
  return (
    // Your component JSX
  );
};
```

#### 3. API Call Wrapper
```typescript
import { withTokenRefresh } from '@/app/utils/tokenRefresh';

const makeApiCall = async () => {
  return await withTokenRefresh(
    () => apiClient.get('/some-endpoint'),
    dispatch
  );
};
```

### Advanced Usage

#### 1. Custom Refresh Logic
```typescript
const { getTokenInfo } = useTokenRefresh();

useEffect(() => {
  const tokenInfo = getTokenInfo();
  
  if (tokenInfo.shouldRefresh) {
    console.log(`Token expires in ${tokenInfo.timeUntilExpiry}ms`);
    // Custom refresh logic
  }
}, [getTokenInfo]);
```

#### 2. Debug Panel (Development Only)
```typescript
// Automatically available in development mode
// Shows token status, refresh timing, and manual refresh button
```

## Configuration

### Timing Constants
```typescript
const REFRESH_COOLDOWN = 30000; // 30 seconds between refresh attempts
const BACKGROUND_CHECK_INTERVAL = 60000; // Check every minute
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry
```

### Customization
You can modify these constants in `app/utils/tokenRefresh.ts` to adjust:
- How frequently tokens are checked
- How early tokens are refreshed before expiry
- Cooldown periods between refresh attempts

## Error Handling

### Background Refresh Failures
- Background refresh failures don't force logout
- Failed refreshes are retried on next API call
- Comprehensive error logging for debugging

### Network Issues
- Handles network connectivity problems
- Graceful degradation when offline
- Automatic retry when connection is restored

### Token Expiration
- Detects expired tokens immediately
- Forces logout only when necessary
- Prevents multiple logout calls

## Debug Features

### Debug Panel
In development mode, a debug panel is available showing:
- Current authentication status
- Token expiry information
- Background refresh status
- Manual refresh trigger button

### Console Logging
Comprehensive logging with prefixes:
- `[TokenRefresh]` for token refresh operations
- `[Auth]` for authentication operations
- Detailed error messages and timing information

## Best Practices

### 1. Initialize Early
Always initialize `useTokenRefresh` in your root layout or early in the app lifecycle.

### 2. Use in Critical Components
Add `useTokenRefresh` to components that make API calls or need authentication state.

### 3. Handle Errors Gracefully
Don't rely solely on background refresh for critical operations. Always have fallback error handling.

### 4. Monitor in Development
Use the debug panel during development to monitor token refresh behavior.

### 5. Test Edge Cases
Test scenarios like:
- Network disconnection during refresh
- App backgrounding/foregrounding
- Multiple simultaneous API calls
- Token expiration during app usage

## Troubleshooting

### Common Issues

#### 1. Multiple Refresh Attempts
**Symptom**: Multiple refresh calls happening simultaneously
**Solution**: The singleton promise system should prevent this. Check if you're calling refresh manually in multiple places.

#### 2. Background Refresh Not Working
**Symptom**: Tokens expire even with background refresh enabled
**Solution**: 
- Check if `useTokenRefresh` is initialized in root layout
- Verify tokens are properly stored
- Check console logs for error messages

#### 3. Excessive Logout Calls
**Symptom**: App logs out repeatedly
**Solution**: 
- Check for multiple logout triggers
- Verify token refresh is working properly
- Check network connectivity

### Debug Steps

1. **Enable Debug Panel**: Use the debug panel in development mode
2. **Check Console Logs**: Look for `[TokenRefresh]` and `[Auth]` logs
3. **Monitor Token Expiry**: Use `getTokenInfo()` to check token status
4. **Test Manual Refresh**: Use the debug panel's manual refresh button

## Migration from Old System

If migrating from the previous token refresh system:

1. **Replace Manual Calls**: Replace manual `checkAndRefreshTokenIfNeeded` calls with `useTokenRefresh`
2. **Update Components**: Add `useTokenRefresh` to components that need token management
3. **Remove Redundant Code**: Remove manual refresh logic that's now handled automatically
4. **Test Thoroughly**: Test all authentication flows to ensure proper migration

## Performance Considerations

- Background refresh uses minimal resources
- Timer intervals are optimized for battery life
- Singleton pattern prevents duplicate operations
- Automatic cleanup on logout prevents memory leaks

## Security Considerations

- Tokens are stored securely using `expo-secure-store`
- Refresh tokens are handled securely
- Failed refresh attempts don't expose sensitive information
- Logout properly cleans up all authentication state 