import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../i18n';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import Toast from '../components/Toast';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import {
  clearError,
  loginAndFetchUserDetails,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
} from '../features/auth/authSlice';
import { ImageBackground } from 'react-native';
import { COLORS } from '../constants/theme';
import { debugLog, debugBreakpoint } from '../utils/debug';

/* ------------------------------------------------------------------ */
/*                        FIELD-LEVEL VALIDATORS                      */
/* ------------------------------------------------------------------ */
const validateEmail = (email: string): string | null => {
  if (!email) return i18n.t('email_is_required');
  if (!email.includes('@')) return i18n.t('email_must_contain_at_symbol');
  if (!email.includes('.')) return i18n.t('email_must_contain_dot');
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return i18n.t('password_is_required');
  if (password.length < 8) return i18n.t('password_must_be_at_least_8_characters');
  return null;
};

/* ------------------------------------------------------------------ */
/*                              SCREEN                                */
/* ------------------------------------------------------------------ */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authError = useAppSelector(selectAuthError);

  /* Form state */
  const [email, setEmail] = useState('uc39@jiislamabad.org');
  const [password, setPassword] = useState('87654321');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  /* Redirect when auth succeeds */
  useEffect(() => {
    if (isAuthenticated) {
      // Use setTimeout to ensure safe navigation
      setTimeout(() => {
        router.replace('/screens/Dashboard');
      }, 100);
    }
  }, [isAuthenticated]);

  /* Check for access denied error */
  useEffect(() => {
    if (authError && authError.includes("don't have any access to the app")) {
      setShowAccessDeniedModal(true);
    }
  }, [authError]);

  /* Handle modal close */
  const handleCloseModal = () => {
    setShowAccessDeniedModal(false);
    dispatch(clearError());
  };

  /* Submit */
  const handleLogin = () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) {
      return;
    }

    dispatch(loginAndFetchUserDetails({ email, password }));
  };

  /* Dynamic title top value based on notch presence */
  const titleTop = insets.top > 0 ? 45 : 25; // Reduced values to move title up

  /* ---------------------------------------------------------------- */
  /*                             RENDER                               */
  /* ---------------------------------------------------------------- */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar hidden />
        <View style={styles.background}>
          {/* Logo & Banner */}
          <View style={styles.logoContainer}>
            <ImageBackground
              source={require('../../assets/images/pattern.png')}
              style={styles.pattern}
            >
              <View style={styles.overlay}>
                <Image
                  source={require('../../assets/images/jamat-logo.png')}
                  style={styles.logo}
                />
                <Text style={[styles.title, { top: titleTop }]}>{i18n.t('appname')}</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Login form */}
          <View style={styles.loginContainer}>
            {/* Email field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{i18n.t('email')}</Text>
              <CustomTextInput
                placeholder={i18n.t('enter_your_email')}
                placeholderTextColor="#2D2327"
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError(null);
                }}
                value={email}
                error={!!emailError}
              />
              {emailError && <Text style={styles.errText}>{emailError}</Text>}
            </View>

            {/* Password field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{i18n.t('password')}</Text>
              <CustomTextInput
                placeholder="********"
                placeholderTextColor="#2D2327"
                secureTextEntry
                onChangeText={(v) => {
                  setPassword(v);
                  if (passwordError) setPasswordError(null);
                }}
                value={password}
                error={!!passwordError}
              />
              {passwordError && <Text style={styles.errText}>{passwordError}</Text>}
            </View>

            {/* Forgot password */}
            <Pressable
              style={styles.resetPass}
              onPress={() => console.log('password reset')}
            >
              <Text style={styles.resetPassText}>{i18n.t('reset_your_password')}</Text>
            </Pressable>

            {/* Submit */}
            {status === 'loading' ? (
              <ActivityIndicator size="large" color="#008CFF" />
            ) : (
              <CustomButton text={i18n.t('login')} onPress={handleLogin} />
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Regular toast for other errors */}
      {authError && !authError.includes("don't have any access to the app") && <Toast />}
      

    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ */
/*                                STYLES                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  background: {
    flex: 1,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pattern: {
    width: '100%',
    aspectRatio: 1.2, // Changed from 1 to 1.5 to make it shorter
  },
  overlay: {
    flex: 1,
    backgroundColor: '#0077ff',
    opacity: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    position: 'absolute',
    width: 120, // Added explicit width
    height: 120, // Added explicit height
    resizeMode: 'contain',
  },
  title: {
    position: 'absolute',
    color: 'white',
    fontSize: 30,
    fontFamily: 'JameelNooriNastaleeq',
    lineHeight: 60,
    textAlign: 'center',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // alignItems: 'center',
    marginTop: -40,
    // gap: 10, // Increased gap from 10 to 15
    // paddingTop: 20, // Reduced from 60 to 40
    padding: 20,
    justifyContent: 'center', // Added to center content vertically
  },
  inputContainer: {
    width: '100%',
    gap: 5, // Reduced gap for tighter spacing
    marginBottom: 5, // Added margin bottom for better separation
  },
  inputText: {
    fontSize: 16,
    fontFamily: 'JameelNooriNastaleeq',
    color: '#2D2327',
    alignSelf: 'flex-start',
  },
  errText: {
    alignSelf: 'flex-start',
    color: COLORS.error,
    fontSize: 16,
    fontFamily: 'JameelNooriNastaleeq',
  },
  resetPass: {
    alignSelf: 'flex-end',
  },
  resetPassText: {
    fontSize: 12,
    fontFamily: 'JameelNooriNastaleeq',
    lineHeight:30,
    marginBottom: 30,
  },
});