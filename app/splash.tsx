import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppSelector } from '../src/hooks/useAppSelector';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { selectIsAuthenticated, initializeAuth } from './features/auth/authSlice';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

// Calculate optimal image dimensions based on screen size
const getImageDimensions = () => {
  const screenAspectRatio = width / height;
  const imageAspectRatio = 1563 / 3383; // Original image aspect ratio
  
  if (screenAspectRatio > imageAspectRatio) {
    // Screen is wider than image - fit to height
    const imageHeight = height * 0.7; // 70% of screen height
    const imageWidth = imageHeight * imageAspectRatio;
    return { width: imageWidth, height: imageHeight };
  } else {
    // Screen is taller than image - fit to width
    const imageWidth = width * 0.8; // 80% of screen width
    const imageHeight = imageWidth / imageAspectRatio;
    return { width: imageWidth, height: imageHeight };
  }
};

export default function SplashScreenComponent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const prepare = async () => {
      try {
        // Initialize auth and fetch user data when app starts
        if (isAuthenticated) {
          console.log('[DEBUG] 🔄 Initializing auth and fetching user data...');
          dispatch(initializeAuth());
        }

        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();

        // Hide the native splash screen after animation starts
        await SplashScreen.hideAsync();

        // Navigate after delay
        const timer = setTimeout(() => {
          if (isAuthenticated) {
            router.replace('/screens/(tabs)/Dashboard');
          } else {
            router.replace('/screens/LoginScreen');
          }
        }, 2000);

        return () => clearTimeout(timer);
      } catch (e) {
        console.warn('Error preparing splash screen:', e);
      }
    };

    prepare();
  }, [router, isAuthenticated, fadeAnim, scaleAnim, dispatch]);

  const imageDimensions = getImageDimensions();

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.imageContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            width: imageDimensions.width,
            height: imageDimensions.height,
          }
        ]}
      >
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={[styles.image, { width: '100%', height: '100%' }]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008CFF',
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure no clipping or masking
    overflow: 'visible',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // Remove any border radius or circular clipping
    borderRadius: 0,
    overflow: 'visible',
    // Ensure no background that might interfere
    backgroundColor: 'transparent',
  },
  image: {
    // Dimensions will be set dynamically
    // Remove any border radius or circular clipping
    borderRadius: 0,
    // Ensure no background
    backgroundColor: 'transparent',
  },
}); 