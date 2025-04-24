import React from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { COLORS, SPACING } from '../constants/theme';
import UrduText from './UrduText';

interface ProfileHeaderProps {
  title: string;
  avatarSource?: ImageSourcePropType;
  backgroundSource?: ImageSourcePropType;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  onCameraPress?: () => void;
  showSettings?: boolean;
  showCamera?: boolean;
  
  avatarSize?: number;
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
  showSettings = true,
  showCamera = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerWrapper, { height: HEADER_HEIGHT }]}>
      {backgroundSource && (
        <Image source={backgroundSource} style={styles.headerBg} />
      )}

      {/* top-row icons + title */}
      <View
        style={[
          styles.headerContent,
          { paddingTop: insets.top + 8 } as StyleProp<ViewStyle>,
        ]}
      >
        {showSettings && (
          <Pressable style={styles.headerIcon} onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </Pressable>
        )}

        <UrduText style={styles.headerTitle}>{title}</UrduText>

        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <FontAwesome6 name="arrow-right-long" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* avatar sits 75 % down the header */}
      <View 
        style={[
          styles.avatarWrapper, 
          { top: HEADER_HEIGHT * 0.95 - AVATAR_SIZE / 2 }
        ]}
      >
        <Image
          source={avatarSource}
          style={[
            styles.avatar, 
            { 
              width: AVATAR_SIZE, 
              height: AVATAR_SIZE, 
              borderRadius: AVATAR_SIZE / 2 
            }
          ]}
        />
        {showCamera && (
          <Pressable style={styles.cameraBadge} onPress={onCameraPress}>
            <Ionicons name="camera" size={22} color={COLORS.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    // height is set dynamically via props
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
  headerTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '600' 
  },
  headerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'absolute',
    // top is set dynamically based on headerHeight and avatarSize
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatar: {
    // width, height, and borderRadius are set dynamically via props
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