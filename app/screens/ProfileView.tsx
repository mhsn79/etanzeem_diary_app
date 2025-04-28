// app/screens/ProfileView.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';

import i18n from '../i18n';
import { profileData } from '@/app/data/profile';
import { logout, selectUser, updateUserAvatar, selectAuthStatus } from '@/app/features/auth/authSlice';
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
import { COLORS, SPACING } from '../constants/theme';

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
  
  // State for tracking image upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Combine user data from API with static profile data
  // Use API data if available, otherwise fall back to static data
  const displayData = useMemo<ExtendedProfileData>(() => {
    // Log avatar URL for debugging
    if (userData?.avatar) {
      console.log('Avatar URL:', `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055'}/assets/${userData.avatar}`);
    }
    
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
      // We can add more fields from the API response as needed
      role: userData.role || 'N/A',
      lastAccess,
      // Keep the rest of the profile data for fields not provided by the API
    } as ExtendedProfileData;
  }, [userData]);

  // Handle image picker and upload
  const handleImageUpload = async () => {
    try {
      // Request permission to access the camera roll
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          i18n.t('error'),
          i18n.t('camera_permission_denied') || 'Permission to access camera roll was denied'
        );
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Image picker was cancelled');
        return;
      }
      
      const selectedImage = result.assets[0];
      
      // Confirm with the user
      Alert.alert(
        i18n.t('confirm') || 'Confirm',
        i18n.t('update_profile_picture_confirm') || 'Do you want to update your profile picture?',
        [
          {
            text: i18n.t('cancel') || 'Cancel',
            style: 'cancel',
          },
          {
            text: i18n.t('update') || 'Update',
            onPress: async () => {
              setIsUploading(true);
              try {
                await dispatch(updateUserAvatar({
                  imageUri: selectedImage.uri,
                  onProgress: (progress) => {
                    setUploadProgress(progress);
                  }
                })).unwrap();
                
                Alert.alert(
                  i18n.t('success') || 'Success',
                  i18n.t('profile_picture_updated') || 'Profile picture updated successfully'
                );
              } catch (error: any) {
                Alert.alert(
                  i18n.t('error') || 'Error',
                  error.message || i18n.t('failed_to_update_profile_picture') || 'Failed to update profile picture'
                );
              } finally {
                setIsUploading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        i18n.t('error') || 'Error',
        i18n.t('image_picker_error') || 'An error occurred while picking an image'
      );
    }
  };

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
        avatarSource={
          userData?.avatar 
            ? { 
                uri: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055'}/assets/${userData.avatar}?cache=${Date.now()}`,
                cache: 'web',
                headers: {
                  Accept: 'image/jpeg, image/png, image/jpg',
                  'Cache-Control': 'no-cache',
                  Pragma: 'no-cache',
                  Expires: '0',
                }
              }
            : require('@/assets/images/avatar.png')
        }
        showCamera={true}
        onCameraPress={handleImageUpload}
        isUploading={isUploading}
      />
      
      {/* Loading indicator for avatar upload */}
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

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
  
  /* loading overlay */
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
