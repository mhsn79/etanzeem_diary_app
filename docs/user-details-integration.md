# User Details Integration

This document explains how to use the new functionality that fetches a person's data based on their email after login and stores it in a userDetails object.

## Overview

The implementation adds a new thunk in the `personSlice` that fetches a person by email, and integrates it with the login process in `authSlice`. This allows you to access the person's data immediately after login.

## How It Works

1. When a user logs in, the `login` thunk in `authSlice` automatically dispatches the `fetchPersonByEmail` thunk from `personSlice`.
2. The person data is fetched from the API and stored in the Redux store under `persons.userDetails`.
3. You can access this data using the `selectUserDetails` selector from `personSlice`.

## Usage Examples

### Basic Usage

```tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { selectUserDetails, selectUserDetailsStatus } from '@/app/features/persons/personSlice';

const ProfileScreen = () => {
  const userDetails = useSelector(selectUserDetails);
  const userDetailsStatus = useSelector(selectUserDetailsStatus);

  if (userDetailsStatus === 'loading') {
    return <Text>Loading user details...</Text>;
  }

  if (!userDetails) {
    return <Text>No user details found</Text>;
  }

  return (
    <View>
      <Text>Name: {userDetails.name}</Text>
      <Text>Email: {userDetails.email}</Text>
      <Text>Phone: {userDetails.phone}</Text>
      {/* Display other user details as needed */}
    </View>
  );
};

export default ProfileScreen;
```

### Waiting for Both Login and User Details

For components that need to wait for both login and user details to complete, you can use the `loginAndFetchUserDetails` thunk:

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginAndFetchUserDetails } from '@/app/features/auth/authSlice';
import { selectAuthStatus, selectAuthError } from '@/app/features/auth/authSlice';
import { selectUserDetails } from '@/app/features/persons/personSlice';
import { AppDispatch } from '@/app/store';

const LoginScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const userDetails = useSelector(selectUserDetails);

  const handleLogin = async () => {
    try {
      await dispatch(loginAndFetchUserDetails({ email, password })).unwrap();
      // Navigate to home screen or do something else on success
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button 
        title={authStatus === 'loading' ? 'Logging in...' : 'Login'} 
        onPress={handleLogin}
        disabled={authStatus === 'loading'}
      />
      {authError && <Text style={{ color: 'red' }}>{authError}</Text>}
      
      {userDetails && (
        <View>
          <Text>Welcome, {userDetails.name}!</Text>
        </View>
      )}
    </View>
  );
};

export default LoginScreen;
```

## Available Selectors

From `personSlice`:
- `selectUserDetails`: Gets the user details object
- `selectUserDetailsStatus`: Gets the loading status ('idle', 'loading', 'succeeded', 'failed')
- `selectUserDetailsError`: Gets any error that occurred during fetching

## Notes

- The user details are automatically fetched after login, so in most cases, you don't need to dispatch `fetchPersonByEmail` manually.
- If the user doesn't have a corresponding person record in the database, `userDetails` will be `null`.
- The user details are also added to the persons entity adapter, so you can access them using `selectPersonById` if you know the ID.