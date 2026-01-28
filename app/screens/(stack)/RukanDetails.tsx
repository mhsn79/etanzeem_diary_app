// app/screens/(stack)/RukanDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, router, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';

import { logout } from '@/app/features/auth/authSlice';
import { AppDispatch } from '@/app/store';
import { selectPersonById } from '@/app/features/persons/personSlice';
import { COLORS } from '@/app/constants/theme';

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

export default function RukanDetails() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const personId = params.id as string;
  
  // Get person details from Redux store
  const personDetails = useSelector((state: any) => selectPersonById(state, personId));
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(!personDetails);

  // Format date if available - only date format, no time
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Use toLocaleDateString with options to ensure only date is shown, no time
      return date.toLocaleDateString('ur-PK', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  // Refresh person details
  const refreshPersonDetails = async () => {
    setRefreshing(true);
    // Here you would dispatch an action to fetch the person details
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  // Show loading indicator when initially loading
  if (loading && !personDetails) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading_profile')}</Text>
      </View>
    );
  }

  // Show empty state if no person details
  if (!personDetails) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{i18n.t('no_profile_data')}</Text>
        <CustomButton
          text={i18n.t('go_back')}
          onPress={() => router.back()}
          viewStyle={styles.backButton}
        />
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
            onRefresh={refreshPersonDetails}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <UrduText style={styles.personName}>{personDetails.Name || personDetails.name || ''}</UrduText>
        <UrduText style={styles.personSub}>{personDetails.Father_Name || personDetails.parent || ''}</UrduText>

        {/* Only show required fields: Name, Father's name, Address, Membership date, Email, Phone number, WhatsApp Number */}
        {personDetails.Name && StaticField(i18n.t('name'), personDetails.Name || personDetails.name)}
        {personDetails.Father_Name && StaticField(i18n.t('parent'), personDetails.Father_Name || personDetails.parent)}
        {(personDetails.Address || personDetails.address) && StaticField(i18n.t('address'), personDetails.Address || personDetails.address)}
        {personDetails.Rukinat_Date && StaticField(i18n.t('rukinat_date'), formatDate(personDetails.Rukinat_Date))}
        {personDetails.Email && StaticField(i18n.t('email'), personDetails.Email || personDetails.email)}
        {personDetails.Phone_Number && StaticField(i18n.t('phone_number'), personDetails.Phone_Number || personDetails.phone)}
        {(personDetails.additional_phones || personDetails.whatsApp) && StaticField(i18n.t('whatsapp_number'), personDetails.additional_phones || personDetails.whatsApp)}
        {/*personDetails.Rukn_No && StaticField(i18n.t('rukn_no'), personDetails.Rukn_No.toString())}
        {personDetails.Rukinat_Date && StaticField(i18n.t('rukinat_date'), formatDate(personDetails.Rukinat_Date))}
        {personDetails.Profession && StaticField(i18n.t('profession'), personDetails.Profession)}
        {personDetails.Education && StaticField(i18n.t('education'), personDetails.Education)}
        {personDetails.Gender && StaticField(i18n.t('gender'), 
          personDetails.Gender === 'm' ? i18n.t('male') : 
          personDetails.Gender === 'f' ? i18n.t('female') : 
          personDetails.Gender
        )} */}

        <View style={styles.buttonContainer}>
          <CustomButton
            text={i18n.t('go_back')}
            onPress={() => router.back()}
            viewStyle={styles.backButton}
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
    color: COLORS.primary,
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
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },
  
  /* loading and error states */
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
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 20,
  },
});
