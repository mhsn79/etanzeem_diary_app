// app/screens/ProfileView.tsx
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import i18n from '../i18n';
import { profileData } from '@/app/data/profile';
import { logout, selectUser, selectAuthStatus } from '@/app/features/auth/authSlice';
import { AppDispatch } from '@/app/store';

// Define an extended profile data interface to include additional fields
interface ExtendedProfileData {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsApp: string;
  sms: string;
  picture: null | string;
  parent: string;
  dob: string;
  cnic: string;
  unit: string;
  status: string;
  email: string;
  // Additional fields from API
  role?: string;
  lastAccess?: string;
}

import CustomButton from '@/app/components/CustomButton';
import CustomDropdown from '@/app/components/CustomDropdown';
import FormInput from '@/app/components/FormInput';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
import { COMMON_IMAGES } from '@/app/constants/images';
import { COLORS } from '../constants/theme';

/* ──────────────────────
   Helper for read-only text fields
   ────────────────────── */
const StaticField = (label: string, value: string | undefined) => (
  <FormInput
    key={label}
    inputTitle={label}
    value={value || 'N/A'}
    onChange={() => {}}
    editable={false}
  />
);

/* ──────────────────────
   Constants
   ────────────────────── */
const AVATAR_SIZE = 120;         // keep in sync with styles.avatar

export default function ProfileView() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const userData = useSelector(selectUser);
  const authStatus = useSelector(selectAuthStatus);

  // Combine user data from API with static profile data
  // Use API data if available, otherwise fall back to static data
  const displayData = useMemo<ExtendedProfileData>(() => {
    if (!userData) return profileData as ExtendedProfileData;

    // Format the name based on first_name and last_name
    const formattedName = userData.first_name 
      ? (userData.last_name 
          ? `${userData.first_name} ${userData.last_name}` 
          : userData.first_name)
      : profileData.name;

    // Format last access time if available
    let lastAccess = 'N/A';
    if ((userData as any).last_access) {
      try {
        const lastAccessDate = new Date((userData as any).last_access);
        lastAccess = lastAccessDate.toLocaleString();
      } catch (e) {
        console.error('Error formatting last access date:', e);
      }
    }

    return {
      ...profileData,
      name: formattedName,
      email: userData.email || profileData.email,
      status: userData.status || profileData.status,
      role: userData.role || 'N/A',
      lastAccess,
    } as ExtendedProfileData;
  }, [userData]);

  const handleLogout = () => {
    dispatch(logout())
      .then(() => {
        router.replace('/screens/LoginScreen');
      })
      .catch((err) => {
        console.error('Error during logout:', err);
        router.replace('/screens/LoginScreen');
      });
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
        avatarSource={require('@/assets/images/avatar.png')}
        showCamera={false}
      />

      {/*──────────── Content ────────────*/}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollWrapper}
      >
        <UrduText style={styles.personName}>{displayData.name}</UrduText>
        <UrduText style={styles.personSub}>{displayData.parent}</UrduText>

        {StaticField(i18n.t('name'), displayData.name)}
        {StaticField(i18n.t('parent'), displayData.parent)}
        {StaticField(i18n.t('dob'), displayData.dob)}
        {StaticField(i18n.t('cnic'), displayData.cnic)}
        {StaticField(i18n.t('unit'), displayData.unit)}
        {StaticField(i18n.t('status'), displayData.status)}
        {userData?.role && StaticField(i18n.t('role'), displayData.role || 'N/A')}
        {StaticField(i18n.t('phone_number'), displayData.phone)}
        {StaticField(i18n.t('whatsapp_number'), displayData.whatsApp)}
        {StaticField(i18n.t('email'), displayData.email)}
        {(userData as any)?.last_access && StaticField(i18n.t('last_login'), displayData.lastAccess || 'N/A')}

        <CustomDropdown
          dropdownTitle={i18n.t('language')}
          placeholder={i18n.t('language')}
          onSelect={() => {}}
          options={[
            { id: 'ur', label: 'اردو', value: 'ur' },
            { id: 'en', label: 'English', value: 'en' },
          ]}
        />

        <View style={styles.logoutContainer}>
          <CustomButton
            text={i18n.t('logout')}
            onPress={handleLogout}
            viewStyle={[styles.logoutBtn]}
          />
        </View>
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
  logoutContainer: {
    marginVertical: 32,
  },
  logoutBtn: {
    backgroundColor: COLORS.error,
  },
});
