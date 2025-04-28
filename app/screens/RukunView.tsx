// app/screens/RukunView.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { Linking } from 'react-native';
import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import {
  fetchPersonById,
  selectPersonById,
  selectSelectedPersonStatus,
  selectSelectedPersonError,
} from '@/app/features/persons/personSlice';

import { COLORS, SPACING } from '@/app/constants/theme';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import { RootState, AppDispatch } from '@/app/store';

import i18n from '../i18n';

// Components
import CustomButton from '@/app/components/CustomButton';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
import ContactActionButton from '../components/ContactActionButton';
import { COMMON_IMAGES } from '@/app/constants/images';

type RukunDetailsRouteProp = RouteProp<RootStackParamList, 'screens/RukunView'>;

/* --------------------------
   Typed hooks (optional)
---------------------------*/
const useAppDispatch = () => useDispatch<AppDispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default function RukunView() {
  /* ──────────── Navigation & Redux ────────────*/
  const {
    params: { rukun },
  } = useRoute<RukunDetailsRouteProp>();

  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const person = useAppSelector((state) => selectPersonById(state, rukun.id));
  const status = useAppSelector(selectSelectedPersonStatus);
  const error = useAppSelector(selectSelectedPersonError);

  const displayPerson = person ?? rukun;

  /* ──────────── Data fetching ────────────*/
  useEffect(() => {
    // Always fetch the latest data when the screen is focused
    dispatch(fetchPersonById(rukun.id));
  }, [dispatch, rukun.id]);
  
  // Also refetch when the screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPersonById(rukun.id));
      return () => {
        // Cleanup if needed
      };
    }, [dispatch, rukun.id])
  );

  /* ──────────── Hide stack header ────────────*/
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });
      return () => {
        // Cleanup if needed
      };
    }, [navigation])
  );

  /* ──────────── Derived state ────────────*/
  const detailRows = useMemo(
    () => [
      { label: i18n.t('parent'), value: displayPerson.parent },
      { label: i18n.t('dob'), value: displayPerson.dob },
      { label: i18n.t('cnic'), value: displayPerson.cnic },
      { label: i18n.t('unit'), value: displayPerson.unit },
      { label: i18n.t('status'), value: displayPerson.status },
      { label: i18n.t('phone_number'), value: displayPerson.phone_number },
      { label: i18n.t('whatsapp_number'), value: displayPerson.whatsapp_number },
      { label: i18n.t('email'), value: displayPerson.email },
    ],
    [displayPerson],
  );

  /* ──────────── Helpers ────────────*/
  const openLink = (url: string) =>
    Linking.openURL(url).catch((e) => console.error('Link error', e));

  /* ──────────── Async states ────────────*/
  if (status === 'loading' && !person) {
    return (
      <CenteredContainer>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
      </CenteredContainer>
    );
  }

  if (status === 'failed' && error) {
    return (
      <CenteredContainer>
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton
          text={i18n.t('try_again')}
          onPress={() => dispatch(fetchPersonById(rukun.id))}
          viewStyle={styles.retryBtn}
          textStyle={styles.retryBtnText}
        />
      </CenteredContainer>
    );
  }
  const handleEditDetails = () => {
    // Navigate to edit screen with the most up-to-date person data
    navigation.navigate('screens/RukunAddEdit', { rukun: displayPerson });
  };
  /* ──────────── Main UI ────────────*/
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      style={styles.flex1}
    >
      <View style={styles.root}>
        {/* Header */}
        <ProfileHeader
          title={'رکن'}
          backgroundSource={COMMON_IMAGES.profileBackground}
          avatarSource={
            displayPerson.picture
              ? { uri: displayPerson.picture }
              : require('@/assets/images/avatar.png')
          }
          showEditIcon
          onEditPress={handleEditDetails}
          showSettings={false}
        />

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollWrapper}
          showsVerticalScrollIndicator={false}
        >
          {/* Name & address */}
          <View style={styles.alignCenter}>
            <UrduText style={styles.name}>{displayPerson.name ?? 'N/A'}</UrduText>

            {!!displayPerson.address && (
              <View style={styles.addressRow}>
                <Image
                  source={require('@/assets/images/location-icon-blue.png')}
                  style={styles.locationIcon}
                />
                <UrduText style={styles.address}>{displayPerson.address}</UrduText>
              </View>
            )}
          </View>

          {/* Contact actions */}
          <View style={styles.contactActions}>
            <ContactActionButton
              onPress={() => openLink(`tel:${displayPerson.phone}`)}
              text={i18n.t('call')}
              iconType="phone"
              btnStyle={styles.contactBtn}
            />
            <ContactActionButton
              onPress={() =>
                openLink(`whatsapp://send?phone=${displayPerson.whatsapp_number}`)
              }
              text="واٹس ایپ"
              iconType="whatsapp"
              btnStyle={styles.contactBtn}
            />
            <ContactActionButton
              onPress={() => openLink(`sms:${displayPerson.phone}`)}
              text="ایس ایم ایس"
              iconType="sms"
              btnStyle={styles.contactBtn}
            />
          </View>

          {/* Details */}
          <View style={styles.details}>
            {detailRows.map(({ label, value }) => (
              <DetailRow key={label} label={label} value={value ?? '-'} />
            ))}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ──────────── Helper components ────────────*/
const CenteredContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
  <View style={[styles.flex1, styles.center]}>{children}</View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <UrduText style={styles.detailLabel}>{label}</UrduText>
    <UrduText style={styles.detailValue}>{value}</UrduText>
  </View>
);

/* ──────────── Styles ────────────*/
const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  root: { flex: 1, backgroundColor: '#fff' },

  /* scroll */
  scrollWrapper: { marginTop: AVATAR_SIZE / 2 + 20 },
  scrollContent: { paddingBottom: 40 },

  /* centered view */
  center: { justifyContent: 'center', alignItems: 'center' },

  /* header content */
  alignCenter: { alignItems: 'center' },
  name: {
    color: COLORS.primary,
    fontSize: 28,
    marginBottom: SPACING.xs,
    fontFamily: 'JameelNooriNastaleeq',
  },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { height: 16, width: 16, marginRight: SPACING.xs },
  address: {
    fontSize: 16,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.black,
  },

  /* contact */
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  contactBtn: {
    backgroundColor: COLORS.lightPrimary,
    marginHorizontal: SPACING.sm,
    borderRadius: 30,
  },

  /* details */
  details: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
  },
  detailLabel: {
    color: COLORS.black,
    fontFamily: 'JameelNooriNastaleeq',
    fontSize: 20,
    lineHeight: 32,
  },
  detailValue: {
    color: COLORS.black,
    fontFamily: 'JameelNooriNastaleeq',
    fontSize: 20,
  },

  /* async states */
  loadingText: { marginTop: SPACING.sm, fontSize: 16, color: COLORS.primary },
  errorText: {
    fontSize: 16,
    color: COLORS.error ?? 'red',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: 15,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  retryBtnText: {
    fontSize: 14,
    color: COLORS.black,
  },
});
