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
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';

import i18n from '../i18n';
import { logout } from '@/app/features/auth/authSlice';
import { AppDispatch } from '@/app/store/types';

// Import components
import CustomButton from '@/app/components/CustomButton';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
import { COMMON_IMAGES } from '@/app/constants/images';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

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
  selectUserUnitDetails,
  selectLevelsById,
  fetchUserTanzeemiUnit
} from '@/app/features/tanzeem/tanzeemSlice';

const appVersion = Constants.expoConfig?.version ?? '0.0.0';

/* ──────────────────────
   Compact read-only field row
   ────────────────────── */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={infoRowStyles.row}>
    <UrduText style={infoRowStyles.label}>{label}</UrduText>
    <UrduText style={infoRowStyles.value}>{value}</UrduText>
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    marginLeft: SPACING.sm,
  },
});

const AVATAR_SIZE = 120; // must match ProfileHeader's internal AVATAR_SIZE

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
  
  // Get user unit details and levels from Redux store
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const levelsById = useSelector(selectLevelsById);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);

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

  // Extract user data from Person collection
  const displayData = useMemo(() => {
    if (!userDetails) return {};

    // Format unit with level, name, and description
    let formattedUnit = '';
    if (userUnitDetails) {
      const unitName = userUnitDetails.Name || '';
      const unitDescription = userUnitDetails.Description || '';
      const unitLevelId = userUnitDetails.Level_id;
      
      // Get level name if available
      let unitLevelName = '';
      if (unitLevelId && levelsById[unitLevelId]) {
        unitLevelName = levelsById[unitLevelId].Name || '';
      }
      
      // Build formatted unit string: "Level Name: Unit Name - Unit Description"
      if (unitLevelName && unitName) {
        formattedUnit = `${unitLevelName}: ${unitName}`;
      } else if (unitName) {
        formattedUnit = unitName;
      }
      
      // Append description if available
      if (unitDescription && unitDescription.trim()) {
        formattedUnit += formattedUnit ? ` - ${unitDescription}` : unitDescription;
      }
    }

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
      unit: formattedUnit || (userDetails.Tanzeemi_Unit?.toString() || userDetails.unit?.toString()),
      status: userDetails.status,
      email: userDetails.Email || userDetails.email,
      role: userDetails.role,
    };
  }, [userDetails, userUnitDetails, levelsById]);

  // Refresh user details
  const refreshUserDetails = async () => {
    if (userDetails?.email || userDetails?.Email) {
      setRefreshing(true);
      try {
        // If user has a Tanzeemi unit, fetch it (which will also fetch the Tanzeem level)
        if (userDetails.Tanzeemi_Unit || userDetails.unit) {
          const unitId = userDetails.Tanzeemi_Unit || userDetails.unit;
          if (typeof unitId === 'number') {
            await dispatch(fetchUserTanzeemiUnit(unitId)).unwrap();
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
        headerHeight={160}
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

        {displayData.parent && <InfoRow label={i18n.t('parent')} value={displayData.parent} />}
        {displayData.phone && <InfoRow label={i18n.t('phone_number')} value={displayData.phone} />}
        {displayData.whatsApp && <InfoRow label={i18n.t('whatsapp_number')} value={displayData.whatsApp} />}
        {displayData.email && <InfoRow label={i18n.t('email')} value={displayData.email} />}
        {displayData.address && <InfoRow label={i18n.t('address')} value={displayData.address} />}
        {displayData.unit && <InfoRow label={i18n.t('unit')} value={displayData.unit} />}

        <View style={styles.logoutContainer}>
          <CustomButton
            text={i18n.t('logout')}
            onPress={handleLogout}
            viewStyle={[styles.logoutBtn]}
          />
        </View>

        <Text style={styles.versionText}>
          Version {appVersion}
        </Text>
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
    backgroundColor: '#fff',
  },

  scrollWrapper: {
    marginTop: AVATAR_SIZE / 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },

  personName: {
    fontSize: 24,
    color: '#008CFF',
    textAlign: 'center',
    marginBottom: 6,
  },

  logoutContainer: {
    marginTop: SPACING.sm,
  },
  logoutBtn: {
    backgroundColor: COLORS.error,
  },

  versionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

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
    fontFamily: 'JameelNooriNastaleeq',
  },
});
