import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '@/src/i18n';
import CustomTextInput from '@/src/components/CustomTextInput';
import CustomButton from '@/src/components/CustomButton';
import Toast from '@/src/components/Toast';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import {
  clearError,
  loginAndFetchUserDetails,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
} from '@/src/features/auth/authSlice';
import { ImageBackground } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { debugLog, debugBreakpoint } from '@/src/utils/debug';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailEmptyOnBlur, setEmailEmptyOnBlur] = useState(false);
  const [passwordEmptyOnBlur, setPasswordEmptyOnBlur] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* Refs for keyboard flow */
  const passwordRef = useRef<TextInput>(null);

  /* Keyboard animation */
  const keyboardVisible = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardVisible.value = withTiming(1, { duration: 250 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardVisible.value = withTiming(0, { duration: 200 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    height: interpolate(
      keyboardVisible.value,
      [0, 1],
      [screenHeight * 0.45, screenHeight * 0.12]
    ),
    overflow: 'hidden' as const,
  }));

  const animatedLogoOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(keyboardVisible.value, [0, 0.5], [1, 0]),
  }));

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

  useEffect(() => {
    if (!authError) return;
    // Handle invalid credentials with a field-level + form error and allow retry
    if (authError.includes('INVALID_CREDENTIALS') || authError.includes('Invalid user credentials')) {
      setPasswordError(i18n.t('invalid_credentials'));
      setFormError(i18n.t('invalid_credentials'));
      setLoginInProgress(false);
      return;
    }

    // Other auth errors should be shown as a form-level message
    setFormError(authError);
    setLoginInProgress(false);
  }, [authError]);

  /* Handle modal close */
  const handleCloseModal = () => {
    setShowAccessDeniedModal(false);
    dispatch(clearError());
  };

  /* Submit */
  const handleLogin = () => {
    setFormError(null);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) {
      return;
    }

    Keyboard.dismiss();
    setLoginInProgress(true);
    dispatch(loginAndFetchUserDetails({ email, password }));
  };

  /* Dynamic title top value based on notch presence */
  const titleTop = insets.top > 0 ? 45 : 25;

  /* ---------------------------------------------------------------- */
  /*                             RENDER                               */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (status !== 'loading') {
      setLoginInProgress(false);
    }
  }, [status]);

  const showLoading = loginInProgress && status === 'loading';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar hidden />
        <View style={styles.background}>
          {/* Logo & Banner — animates smaller when keyboard opens */}
          <Pressable onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
              <ImageBackground
                source={require('../../assets/images/pattern.png')}
                style={styles.pattern}
              >
                <View style={styles.overlay}>
                  <Text style={[styles.title, { marginTop: titleTop }]}>{i18n.t('appname')}</Text>
                  <Animated.View style={animatedLogoOpacity}>
                    <Image
                      source={require('../../assets/images/jamat-logo.png')}
                      style={styles.logo}
                    />
                  </Animated.View>
                </View>
              </ImageBackground>
            </Animated.View>
          </Pressable>

          {/* Login form */}
          <View style={styles.loginContainer}>
            {/* Email field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{i18n.t('email')}</Text>
              <CustomTextInput
                style={styles.ltrInput}
                placeholder={i18n.t('enter_your_email')}
                placeholderTextColor="#2D2327"
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailEmptyOnBlur) setEmailEmptyOnBlur(false);
                  if (emailError) setEmailError(null);
                  if (formError) setFormError(null);
                  if (authError) dispatch(clearError());
                }}
                onBlur={() => {
                  if (!email.trim()) setEmailEmptyOnBlur(true);
                }}
                onSubmitEditing={() => passwordRef.current?.focus()}
                value={email}
                error={!!emailError || emailEmptyOnBlur}
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
              />
              {emailError && <Text style={styles.errText}>{emailError}</Text>}
            </View>

            {/* Password field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{i18n.t('password')}</Text>
              <CustomTextInput
                ref={passwordRef}
                style={styles.ltrInput}
                placeholder="********"
                placeholderTextColor="#2D2327"
                secureTextEntry
                onChangeText={(v) => {
                  setPassword(v);
                  if (passwordEmptyOnBlur) setPasswordEmptyOnBlur(false);
                  if (passwordError) setPasswordError(null);
                  if (formError) setFormError(null);
                  if (authError) dispatch(clearError());
                }}
                onBlur={() => {
                  if (!password.trim()) setPasswordEmptyOnBlur(true);
                }}
                onSubmitEditing={handleLogin}
                value={password}
                error={!!passwordError || passwordEmptyOnBlur}
                autoComplete="password"
                returnKeyType="done"
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

            {/* Form error */}
            {formError && <Text style={styles.errText}>{formError}</Text>}

            {/* Submit */}
            <View style={styles.buttonContainer}>
              {showLoading ? (
                <ActivityIndicator size="large" color="#008CFF" />
              ) : (
                <CustomButton
                  text={i18n.t('login')}
                  onPress={handleLogin}
                  disabled={!email.trim() || !password.trim()}
                />
              )}
            </View>
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
const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#0077ff',
  },
  logoContainer: {
    width: '100%',
  },
  pattern: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 119, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40, // Space for the rounded overlap
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginTop: 15,
  },
  title: {
    color: 'white',
    fontSize: 34,
    fontFamily: 'JameelNooriNastaleeq',
    textAlign: 'center',
  },
  loginContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.lightGray,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    marginTop: -40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
    minHeight: 90,
  },
  inputText: {
    fontSize: 18,
    fontFamily: 'JameelNooriNastaleeq',
    color: '#2D2327',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  ltrInput: {
    textAlign: 'left',
    writingDirection: 'ltr',
    backgroundColor: '#FFFFFF',
  },
  errText: {
    alignSelf: 'flex-start',
    color: COLORS.error,
    fontSize: 16,
    fontFamily: 'JameelNooriNastaleeq',
    minHeight: 20,
  },
  resetPass: {
    alignSelf: 'flex-end',
  },
  resetPassText: {
    fontSize: 14,
    fontFamily: 'JameelNooriNastaleeq',
    lineHeight: 30,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
