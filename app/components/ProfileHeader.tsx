import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  ImageSourcePropType,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, SPACING } from '../constants/theme';
import UrduText from './UrduText';
import RemoteImage from './RemoteImage';
import ImagePickerModal from './ImagePickerModal';
import ProgressModal from './ProgressModal';
import { pickImageFromCamera, pickImageFromLibrary, requestMediaPermissions } from '../utils/imageUpload';
import i18n from '../i18n';

interface ProfileHeaderProps {
  title: string;
  avatarSource?: ImageSourcePropType;
  backgroundSource?: ImageSourcePropType;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  onCameraPress?: (imageUri: string) => void;
  onEditPress?: () => void;
  showSettings?: boolean;
  showCamera?: boolean;
  showEditIcon?: boolean;
  avatarSize?: number;
  personId?: number;
  isUploading?: boolean;
}

const HEADER_HEIGHT = 260;
const AVATAR_SIZE = 120;

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title,
  avatarSource = require('@/assets/images/avatar.png'),
  backgroundSource,
  onBackPress = () => router.back(),
  onSettingsPress = () => {},
  onCameraPress = () => {},
  onEditPress = () => {},
  showSettings = true,
  showCamera = true,
  showEditIcon,
  personId,
  isUploading = false,
}) => {
  const insets = useSafeAreaInsets();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle camera press
  const handleCameraPress = async () => {
    // Check if we have a handler for the camera press
    if (!onCameraPress) {
      Alert.alert(i18n.t('coming_soon'), i18n.t('feature_not_available'));
      return;
    }

    // Show image picker modal
    setImagePickerVisible(true);
  };

  // Handle taking a photo with the camera
  const handleTakePhoto = async () => {
    try {
      // Request permissions
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        Alert.alert(
          i18n.t('permission_required'),
          i18n.t('camera_permission_message')
        );
        return;
      }

      // Launch camera
      const result = await pickImageFromCamera();
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Pass the selected image URI to the parent component
        onCameraPress(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(i18n.t('error'), i18n.t('failed_to_take_photo'));
    }
  };

  // Handle picking an image from the gallery
  const handlePickImage = async () => {
    try {
      // Request permissions
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        Alert.alert(
          i18n.t('permission_required'),
          i18n.t('gallery_permission_message')
        );
        return;
      }

      // Launch image picker
      const result = await pickImageFromLibrary();
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Pass the selected image URI to the parent component
        onCameraPress(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(i18n.t('error'), i18n.t('failed_to_pick_image'));
    }
  };

  return (
    <View style={[styles.headerWrapper, { height: HEADER_HEIGHT }]}>
      {backgroundSource && (
        <Image source={backgroundSource} style={styles.headerBg} />
      )}

      {/* top-row icons + title */}
      <View
        style={[
          styles.headerContent,
          { paddingTop: insets.top + 8 },
        ]}
      >
        {/* Left Icons (Settings + Edit) */}
        <View style={styles.iconGroup}>
          {showSettings && (
            <Pressable style={styles.headerIcon} onPress={onSettingsPress}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </Pressable>
          )}
          {showEditIcon && (
            <Pressable style={styles.headerIcon} onPress={onEditPress}>
              <FontAwesome6 name="edit" size={24} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* Centered Title */}
        <View style={styles.titleContainer}>
          <UrduText style={styles.headerTitle}>{title}</UrduText>
        </View>

        {/* Right Icon (Back Button) */}
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <FontAwesome6 name="arrow-right-long" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* avatar sits 75 % down the header */}
      <View
        style={[
          styles.avatarWrapper,
          { top: HEADER_HEIGHT * 0.95 - AVATAR_SIZE / 2 },
        ]}
      >
        <RemoteImage
          source={avatarSource}
          fallbackSource={require('@/assets/images/avatar.png')}
          style={[
            styles.avatar,
            {
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
            },
          ]}
          showLoadingIndicator={true}
        />
        {showCamera && (
          <Pressable 
            style={styles.cameraBadge} 
            onPress={handleCameraPress}
            disabled={isUploading}
          >
            <Ionicons name="camera" size={22} color={COLORS.white} />
          </Pressable>
        )}
      </View>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={handleTakePhoto}
        onGalleryPress={handlePickImage}
      />

      {/* Upload Progress Modal */}
      <ProgressModal
        visible={isUploading}
        progress={uploadProgress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: 30,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
    resizeMode: 'cover',
  },
  headerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: 'pink',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 6,
    left: 140,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 7,
  },
});

export default ProfileHeader;