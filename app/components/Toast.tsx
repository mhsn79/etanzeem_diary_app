import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';
import { selectAuthError } from '../features/auth/authSlice';
import { useAppSelector } from '@/src/hooks/redux';
import { Ionicons } from '@expo/vector-icons';

export default function Toast() {
  const errorMessage = useAppSelector(selectAuthError);
  const [opacity] = useState(new Animated.Value(0));
  
  // Check if this is an access denied error
  const isAccessDenied = errorMessage && errorMessage.includes("Access denied");
  
  // Use longer display time for access denied errors
  const displayTime = isAccessDenied ? 6000 : 3000;

  useEffect(() => {
    if (errorMessage) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(displayTime),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [errorMessage, displayTime]);

  if (!errorMessage) return null;

  return (
    <Animated.View 
      style={[
        styles.toast, 
        { opacity },
        isAccessDenied && styles.accessDeniedToast
      ]}
    > 
      {isAccessDenied && (
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={24} color="white" />
        </View>
      )}
      <Text style={[
        styles.text,
        isAccessDenied && styles.accessDeniedText
      ]}>
        {errorMessage}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#EA5455',
    padding: 12,
    borderRadius: 8,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accessDeniedToast: {
    backgroundColor: '#D32F2F', // Darker red for access denied
    padding: 16,
    bottom: 20, // Keep at bottom for access denied as well
  },
  iconContainer: {
    marginRight: 10,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  accessDeniedText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
