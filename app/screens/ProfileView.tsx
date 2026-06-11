// app/screens/ProfileView.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, router } from 'expo-router';
import Constants from 'expo-constants';
import { useDispatch, useSelector } from 'react-redux';

import i18n from '@/src/i18n';
import { logout, selectUser } from '@/src/features/auth/authSlice';
import { AppDispatch } from '@/src/store/types';
import { directApiRequest } from '@/src/services/apiClient';
import { Ionicons } from '@expo/vector-icons';

// Import components
import CustomButton from '@/src/components/CustomButton';
import UrduText from '@/src/components/UrduText';
import ProfileHeader from '@/src/components/ProfileHeader';
import { COMMON_IMAGES } from '@/src/constants/images';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/src/constants/theme';

// Selectors for tanzeem data
import {
  selectUserUnitDetails,
  selectLevelsById,
  selectUserAssignedUnits,
} from '@/src/features/tanzeem/tanzeemSlice';
import { formatUnitName } from '@/src/utils/formatUnitName';

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
  
  // Directus user (logged-in user)
  const authUser = useSelector(selectUser);

  // Unit details for display
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const levelsById = useSelector(selectLevelsById);

  const assignedUnits = useSelector(selectUserAssignedUnits);

  // Local state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState(authUser?.first_name || '');
  const [lastName, setLastName] = useState(authUser?.last_name || '');
  const [savingName, setSavingName] = useState(false);

  const handleChangePassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('غلطی', 'براہ کرم تمام خانے پر کریں');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('غلطی', 'نیا پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('غلطی', 'نیا پاس ورڈ اور تصدیقی پاس ورڈ مختلف ہیں');
      return;
    }
    setChangingPassword(true);
    try {
      await directApiRequest(
        '/users/me',
        'PATCH',
        JSON.stringify({ password: newPassword })
      );
      Alert.alert('کامیابی', 'پاس ورڈ تبدیل ہو گیا');
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('غلطی', 'پاس ورڈ تبدیل نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  // Format unit display
  const formattedUnit = useMemo(() => {
    if (!userUnitDetails) return '';
    const unitName = userUnitDetails.Name || '';
    const unitLevelId = userUnitDetails.Level_id;
    let levelName = '';
    if (unitLevelId && levelsById[unitLevelId]) {
      levelName = levelsById[unitLevelId].Name || '';
    }
    return levelName ? `${levelName}: ${unitName}` : unitName;
  }, [userUnitDetails, levelsById]);

  // Save name
  const handleSaveName = useCallback(async () => {
    if (!firstName.trim() && !lastName.trim()) return;
    setSavingName(true);
    try {
      await directApiRequest(
        '/users/me',
        'PATCH',
        JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim() })
      );
      Alert.alert('کامیابی', 'نام تبدیل ہو گیا');
      setEditingName(false);
    } catch {
      Alert.alert('غلطی', 'نام تبدیل نہیں ہو سکا');
    } finally {
      setSavingName(false);
    }
  }, [firstName, lastName]);

  // Handle logout
  const handleLogout = () => {
    dispatch(logout())
      .then(() => router.replace('/screens/LoginScreen'))
      .catch(() => router.replace('/screens/LoginScreen'));
  };

  // Hide header on focus
  useFocusEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  // Sync name fields when authUser changes
  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.first_name || '');
      setLastName(authUser.last_name || '');
    }
  }, [authUser?.first_name, authUser?.last_name]);

  if (!authUser) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayName = [authUser.first_name, authUser.last_name].filter(Boolean).join(' ') || authUser.email;

  return (
    <View style={styles.root}>
      <ProfileHeader
        title={i18n.t('profile')}
        backgroundSource={COMMON_IMAGES.profileBackground}
        avatarSource={require('@/assets/images/avatar.png')}
        showCamera={false}
        headerHeight={160}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollWrapper}
      >
        <UrduText style={styles.personName}>{displayName}</UrduText>

        <InfoRow label="ای میل" value={authUser.email} />
        {formattedUnit ? <InfoRow label="یونٹ" value={formattedUnit} /> : null}

        {/* Assigned units list */}
        {assignedUnits.length > 0 && (
          <View style={styles.assignedUnitsContainer}>
            <UrduText style={styles.assignedUnitsLabel}>تفویض شدہ یونٹس</UrduText>
            {assignedUnits.map(unit => {
              const levelId = unit.Level_id || unit.level_id;
              const levelName = levelId && levelsById[levelId] ? levelsById[levelId].Name || '' : '';
              const unitName = formatUnitName(unit);
              return (
                <View key={unit.id} style={styles.assignedUnitRow}>
                  <Ionicons name="business-outline" size={16} color={COLORS.primary} />
                  <UrduText style={styles.assignedUnitText}>
                    {levelName ? `${levelName}: ${unitName}` : unitName}
                  </UrduText>
                </View>
              );
            })}
          </View>
        )}

        {/* TODO: Edit name section (commented out for now)
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setEditingName(!editingName)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <UrduText style={styles.actionButtonText}>نام میں ترمیم</UrduText>
          </TouchableOpacity>
        </View>

        {editingName && (
          <View style={styles.changePasswordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="پہلا نام"
              placeholderTextColor={COLORS.textSecondary}
              textAlign="right"
            />
            <TextInput
              style={styles.passwordInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="آخری نام"
              placeholderTextColor={COLORS.textSecondary}
              textAlign="right"
            />
            <CustomButton
              text={savingName ? 'محفوظ ہو رہا ہے...' : 'نام محفوظ کریں'}
              onPress={handleSaveName}
              viewStyle={styles.changePasswordBtn}
              disabled={savingName}
            />
          </View>
        )}
        */}

        {/* Change password section */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowChangePassword(!showChangePassword)}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
            <UrduText style={styles.actionButtonText}>پاس ورڈ تبدیل کریں</UrduText>
          </TouchableOpacity>
        </View>

        {showChangePassword && (
          <View style={styles.changePasswordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="نیا پاس ورڈ"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              textAlign="right"
            />
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="نیا پاس ورڈ دوبارہ"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              textAlign="right"
            />
            <CustomButton
              text={changingPassword ? 'تبدیل ہو رہا ہے...' : 'پاس ورڈ تبدیل کریں'}
              onPress={handleChangePassword}
              viewStyle={styles.changePasswordBtn}
              disabled={changingPassword}
            />
          </View>
        )}

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
  actionButtonsContainer: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.lightGray,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
  },
  changePasswordContainer: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    textAlign: 'left',
    fontFamily: 'JameelNooriNastaleeq',
  },
  changePasswordBtn: {
    backgroundColor: COLORS.primary,
  },
  assignedUnitsContainer: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  assignedUnitsLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'left',
  },
  assignedUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  assignedUnitText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
});
