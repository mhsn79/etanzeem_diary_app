import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { selectAuthError } from '../features/auth/authSlice';
import { useAppSelector } from '@/src/hooks/redux';

export default function Toast() {
  const errorMessage = useAppSelector(selectAuthError);
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (errorMessage) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [errorMessage]);

  if (!errorMessage) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}> 
      <Text style={styles.text}>{errorMessage}</Text>
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
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
});
