// app/screens/ProfileView.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, router } from 'expo-router';
import { useDispatch } from 'react-redux';


import { profileData } from '@/app/data/profile';
import { logout } from '@/app/features/auth/authSlice';
import { AppDispatch } from '@/app/store';

import CustomButton from '@/app/components/CustomButton';
import CustomDropdown from '@/app/components/CustomDropdown';
import FormInput from '@/app/components/FormInput';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
import { COMMON_IMAGES } from '@/app/constants/images';
import i18n from '@/app/i18n';

/* ──────────────────────
   Helper for read-only text fields
   ────────────────────── */
const StaticField = (label: string, value: string) => (
  <FormInput
    key={label}
    inputTitle={label}
    value={value}
    onChange={() => {}}
    editable={false}
  />
);

/* ──────────────────────
   Constants
   ────────────────────── */
const AVATAR_SIZE = 120;         // keep in sync with styles.avatar

export default function RukanDetails() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/screens/LoginScreen');
  };
  
  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  return (
    <View style={styles.root}>
      {/*──────────── Header (wave + avatar) ────────────*/}
      <ProfileHeader
        title={i18n.t('profile')}
        backgroundSource={COMMON_IMAGES.profileBackground}
      
      />

      {/*──────────── Content ────────────*/}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollWrapper}
      >
        <UrduText style={styles.personName}>{profileData.name}</UrduText>
        <UrduText style={styles.personSub}>{profileData.parent}</UrduText>

        {StaticField(i18n.t('name'), profileData.name)}
        {StaticField(i18n.t('parent'), profileData.parent)}
        {StaticField(i18n.t('dob'), profileData.dob)}
        {StaticField(i18n.t('cnic'), profileData.cnic)}
        {StaticField(i18n.t('unit'), profileData.unit)}
        {StaticField(i18n.t('status'), profileData.status)}
        {StaticField(i18n.t('phone_number'), profileData.phone)}
        {StaticField(i18n.t('whatsapp_number'), profileData.whatsApp)}
        {StaticField(i18n.t('email'), profileData.email)}

        <CustomDropdown
          dropdownTitle={i18n.t('language')}
          placeholder={i18n.t('language')}
          onSelect={() => {}}
          options={[
            { id: 'ur', label: 'اردو', value: 'ur' },
            { id: 'en', label: 'English', value: 'en' },
          ]}
        />

        <CustomButton
          text={i18n.t('logout')}
          onPress={handleLogout}
          viewStyle={[styles.logoutBtn]}
          textStyle={[styles.logoutBtnText]}
        />
      </ScrollView>
    </View>
  );
}

/* ──────────────────────
   Styles
   ────────────────────── */
const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  
  scrollWrapper: {
    marginTop: AVATAR_SIZE / 2 + 20, // ensures list starts below the avatar
  },
  
  /* scroll area */
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  /* text */
  personName: {
    fontSize: 28,
    color: '#008CFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  personSub: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'JameelNooriNastaleeq',
    marginBottom: 16,
  },

  /* buttons */
  logoutBtn: {
    backgroundColor: '#EA5455',
    marginTop: 32,
    alignSelf: 'center',
    color: '#fff',
  },
  logoutBtnText: {
    color: '#fff',
  },
});
