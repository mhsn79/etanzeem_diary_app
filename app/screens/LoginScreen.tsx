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

import { useAppDispatch, useAppSelector } from '../../src/hooks/redux';
import {
  login,
  selectAuthStatus,
  selectIsAuthed,
} from '../features/auth/authSlice';

/* ------------------------------------------------------------------ */
/*                        FIELD‑LEVEL VALIDATORS                      */
/* ------------------------------------------------------------------ */
const validateEmail = (email: string): string | null => {
  if (!email) return i18n.t('email_is_required');
  if (!email.includes('@')) return i18n.t('email_must_contain_at_symbol');
  if (!email.includes('.')) return i18n.t('email_must_contain_dot');
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return i18n.t('password_is_required');
  if (password.length < 8)
    return i18n.t('password_must_be_at_least_8_characters');
  return null;
};

/* ------------------------------------------------------------------ */
/*                              SCREEN                                */
/* ------------------------------------------------------------------ */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const status  = useAppSelector(selectAuthStatus);
  const isAuthed = useAppSelector(selectIsAuthed);

  /* Form state */
  const [email, setEmail] = useState("sohail-abubaker@pixelpk.com");
  const [password, setPassword] = useState("12345678");

  /* Error state (separate) */
  const [emailError, setEmailError]       = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /* Redirect when auth succeeds */
  useEffect(() => {
    if (isAuthed) router.replace('/screens/Dashboard');
  }, [isAuthed]);

  /* Submit */
  const handleLogin = () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) return; // stop if any field invalid

    dispatch(login({ email, password }));
  };

  /* ---------------------------------------------------------------- */
  /*                             RENDER                               */
  /* ---------------------------------------------------------------- */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <StatusBar hidden />
        <View style={styles.background}>
          {/* Logo & Banner */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/pattern.png')}
              style={styles.pattern}
            />
            <Image
              source={require('../../assets/images/jamat-logo.png')}
              style={styles.logo}
            />
            <Text style={styles.title}>{i18n.t('appname')}</Text>
          </View>

          {/* Login form */}
          <View style={styles.loginContainer}>
            {/* E‑mail field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{i18n.t('email')}</Text>
              <CustomTextInput
                placeholder={i18n.t('enter_your_email')}
                placeholderTextColor="#2D2327"
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError(null); // clear on edit
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
              {passwordError && (
                <Text style={styles.errText}>{passwordError}</Text>
              )}
            </View>

            {/* Forgot password */}
            <View style={styles.resetPass}>
              <Pressable onPress={() => console.log('password reset')}>
                <Text style={styles.resetPassText}>
                  {i18n.t('reset_your_password')}
                </Text>
              </Pressable>
            </View>

            {/* Submit */}
            {status === 'loading' ? (
              <ActivityIndicator size="large" color="#008CFF" />
            ) : (
              <CustomButton text={i18n.t('login')} onPress={handleLogin} />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Toast for API errors */}
      <Toast />
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ */
/*                                STYLES                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#008CFF' },
  logoContainer: { justifyContent: 'center', alignItems: 'center' },
  title: {
    position: 'absolute',
    top: 45,
    color: 'white',
    fontSize: 30,
    fontFamily: 'JameelNooriNastaleeq',
  },
  pattern: { width: '100%', aspectRatio: 1, opacity: 0.5 },
  logo: { position: 'absolute' },
  loginContainer: {
    flex: 1,
    backgroundColor: '#EBEBEB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    gap: 10,
    paddingTop: 60,
    padding: 25,
  },
  inputContainer: { width: '100%', gap: 10 },
  inputText: {
    fontSize: 16,
    fontFamily: 'JameelNooriNastaleeq',
    color: '#2D2327',
    alignSelf: 'flex-end',
  },
  errText: {
    alignSelf: 'flex-start',
    color: '#EA5455',
    fontSize: 16,
    fontFamily: "JameelNooriNastaleeq",
  },
  resetPass: { alignSelf: 'flex-start' },
  resetPassText: {
    fontSize: 12,
    fontFamily: 'JameelNooriNastaleeq',
    color: '#2D2327',
  },
});
