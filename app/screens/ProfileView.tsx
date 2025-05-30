// app/screens/ProfileView.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import i18n from '../i18n';
import { logout } from '@/app/features/auth/authSlice';
import { AppDispatch } from '@/app/store';
import { fetchPersonByEmail } from '@/app/features/persons/personSlice';

// Import components
import CustomButton from '@/app/components/CustomButton';
import CustomDropdown from '@/app/components/CustomDropdown';
import FormInput from '@/app/components/FormInput';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
import { COMMON_IMAGES } from '@/app/constants/images';
import { COLORS } from '../constants/theme';

// Selectors for person data
import { 
  selectUserDetails, 
  selectUserDetailsStatus, 
  selectUserDetailsError 
} from '@/app/features/persons/personSlice';

// Selectors for tanzeem level data
import {
  selectUserTanzeemiLevelDetails,
  selectUserTanzeemiLevelStatus,
  selectUserTanzeemiLevelError,
  fetchUserTanzeemiUnit
} from '@/app/features/tanzeem/tanzeemSlice';

/* ──────────────────────
   Helper for read-only text fields
   ────────────────────── */
const StaticField = (label: string, value: string | undefined | null) => (
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
  
  // Get user details from Redux store
  const userDetails = useSelector(selectUserDetails);
  const userDetailsStatus = useSelector(selectUserDetailsStatus);
  const userDetailsError = useSelector(selectUserDetailsError);
  
  // Get tanzeem level details from Redux store
  const tanzeemLevelDetails = useSelector(selectUserTanzeemiLevelDetails);
  const tanzeemLevelStatus = useSelector(selectUserTanzeemiLevelStatus);
  const tanzeemLevelError = useSelector(selectUserTanzeemiLevelError);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Format date of birth if available
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  // Extract user data from Person collection
  const displayData = useMemo(() => {
    if (!userDetails) return {};

    return {
      id: userDetails.id,
      name: userDetails.Name || userDetails.name,
      address: userDetails.Address || userDetails.address,
      phone: userDetails.Phone_Number || userDetails.phone,
      whatsApp: userDetails.additional_phones,
      picture: userDetails.picture,
      parent: userDetails.Father_Name || userDetails.parent,
      dob: formatDate(userDetails.Date_of_birth || userDetails.dob),
      cnic: userDetails.CNIC || userDetails.cnic,
      unit: userDetails.Tanzeemi_Unit?.toString() || userDetails.unit?.toString(),
      status: userDetails.status,
      email: userDetails.Email || userDetails.email,
      role: userDetails.role,
    };
  }, [userDetails]);

  // Refresh user details
  const refreshUserDetails = async () => {
    if (userDetails?.email || userDetails?.Email) {
      setRefreshing(true);
      try {
        const email = userDetails.email || userDetails.Email;
        if (email) {
          await dispatch(fetchPersonByEmail(email)).unwrap();
          
          // If user has a Tanzeemi unit, fetch it (which will also fetch the Tanzeem level)
          if (userDetails.Tanzeemi_Unit || userDetails.unit) {
            const unitId = userDetails.Tanzeemi_Unit || userDetails.unit;
            if (typeof unitId === 'number') {
              await dispatch(fetchUserTanzeemiUnit(unitId)).unwrap();
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing user details:', error);
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Handle logout
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
  
  // Hide header on focus
  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });
  
  // Fetch Tanzeemi unit when component mounts
  useEffect(() => {
    if (userDetails && (userDetails.Tanzeemi_Unit || userDetails.unit)) {
      const unitId = userDetails.Tanzeemi_Unit || userDetails.unit;
      if (typeof unitId === 'number') {
        dispatch(fetchUserTanzeemiUnit(unitId));
      }
    }
  }, [userDetails?.id, userDetails?.Tanzeemi_Unit, userDetails?.unit]);

  // Show loading indicator when initially loading
  if (userDetailsStatus === 'loading' && !refreshing && !userDetails) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading_profile')}</Text>
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshUserDetails}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <UrduText style={styles.personName}>{displayData.name || ''}</UrduText>
        <UrduText style={styles.personSub}>{displayData.parent || ''}</UrduText>

        {displayData.name && StaticField(i18n.t('name'), displayData.name)}
        {displayData.parent && StaticField(i18n.t('parent'), displayData.parent)}
        {displayData.dob && StaticField(i18n.t('dob'), displayData.dob)}
        {displayData.cnic && StaticField(i18n.t('cnic'), displayData.cnic)}
        {displayData.unit && StaticField(i18n.t('unit'), displayData.unit)}
        {tanzeemLevelDetails && StaticField(i18n.t('tanzeem_level'), tanzeemLevelDetails.Name)}
        {tanzeemLevelDetails && StaticField(i18n.t('nazim_label'), tanzeemLevelDetails.Nazim_Label)}
        {displayData.status && StaticField(i18n.t('status'), i18n.t(displayData.status))}
        {displayData.role && StaticField(i18n.t('role'), displayData.role as string)}
        {displayData.phone && StaticField(i18n.t('phone_number'), displayData.phone)}
        {displayData.whatsApp && StaticField(i18n.t('whatsapp_number'), displayData.whatsApp)}
        {displayData.email && StaticField(i18n.t('email'), displayData.email)}
        
        {/* Additional fields from Person collection */}
        {userDetails?.Rukn_No && StaticField(i18n.t('rukn_no'), userDetails.Rukn_No.toString())}
        {userDetails?.Rukinat_Date && StaticField(i18n.t('rukinat_date'), formatDate(userDetails.Rukinat_Date))}
        {userDetails?.Profession && StaticField(i18n.t('profession'), userDetails.Profession)}
        {userDetails?.Education && StaticField(i18n.t('education'), userDetails.Education)}
        {userDetails?.Gender && StaticField(i18n.t('gender'), 
          userDetails.Gender === 'm' ? i18n.t('male') : 
          userDetails.Gender === 'f' ? i18n.t('female') : 
          userDetails.Gender
        )}

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
  
  /* loading state */
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
