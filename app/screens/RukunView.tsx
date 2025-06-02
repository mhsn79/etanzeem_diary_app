// app/screens/RukunView.tsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
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
  Alert,
  RefreshControl,
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
  updatePersonImage,
  selectPersonById,
  selectPersonsStatus,
  selectPersonsError,
} from '@/app/features/persons/personSlice';
import { getImageUrl } from '@/app/utils/imageUpload';

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
    params: { rukun, contactTypeLabel },
  } = useRoute<RukunDetailsRouteProp>();

  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  const person = useAppSelector((state) => selectPersonById(state, rukun.id));
  const status = useAppSelector(selectPersonsStatus);
  const error = useAppSelector(selectPersonsError);

  const displayPerson = person ?? rukun;
  
  // Use the passed contact type label or fallback to default
  const displayContactTypeLabel = contactTypeLabel || 'رکن';
  
  // Handle image upload
  const handleImageUpload = async (imageUri: string) => {
    try {
      setIsUploading(true);
      
      // Dispatch the updatePersonImage action
      await dispatch(updatePersonImage({
        id: rukun.id,
        imageUri,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      })).unwrap();
      
      // Show success message
      Alert.alert(
        i18n.t('success'),
        i18n.t('image_updated_successfully')
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        i18n.t('error'),
        typeof error === 'string' ? error : i18n.t('image_upload_failed')
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchPersonById(rukun.id)).unwrap();
    } catch (error) {
      console.error('Error refreshing person data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, rukun.id]);

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
  // Determine if this is a detailed contact type (umeedwar or rukun)
  const isDetailedContactType = useMemo(() => {
    // Check if contactTypeLabel contains umeedwar or rukun (in any language)
    const label = contactTypeLabel?.toLowerCase() || '';
    return label.includes('umeedwar') || label.includes('rukun') || 
           label.includes('امیدوار') || label.includes('ارکان');
  }, [contactTypeLabel]);

  const detailRows = useMemo(() => {

    console.log('=============7777777======isDetailedContactType--',isDetailedContactType,JSON.stringify(displayPerson));
    
    if (isDetailedContactType) {
      // Comprehensive fields for umeedwar and rukun
      return [
        { label: i18n.t('father'), value: displayPerson.parent || displayPerson.Father_Name },
        { label: i18n.t('unit'), value: displayPerson.unit || displayPerson.unit_name || displayPerson.Tanzeemi_Unit },
        { label: i18n.t('gender'), value: displayPerson.gender || displayPerson.Gender },
        { label: i18n.t('phone_number'), value: displayPerson.phone_number || displayPerson.Phone_Number || displayPerson.phone },
        { label: i18n.t('whatsapp_number'), value: displayPerson.whatsapp_number },
        { label: i18n.t('email'), value: displayPerson.email || displayPerson.Email },
        { label: i18n.t('cnic'), value: displayPerson.cnic || displayPerson.CNIC },
        { label: i18n.t('dob'), value: displayPerson.dob || displayPerson.Date_of_birth },
        { label: i18n.t('education'), value: displayPerson.education || displayPerson.Education },
        { label: i18n.t('profession'), value: displayPerson.profession || displayPerson.Profession },
        { label: i18n.t('rukn_no'), value: displayPerson.rukn_no || displayPerson.Rukn_No },
        { label: i18n.t('rukinat_date'), value: displayPerson.rukinat_date || displayPerson.Rukinat_Date },
        { label: i18n.t('transfer_from'), value: displayPerson.transfer_from || displayPerson.Transfer_from },
        { label: i18n.t('transfer_to'), value: displayPerson.transfer_to || displayPerson.Transfet_to },
      ].filter(row => row.value); // Only show rows with values
    } else {
      // Limited fields for karkun and others
      return [
        { label: i18n.t('unit'), value: displayPerson.unit || displayPerson.unit_name },
        { label: i18n.t('unit_id'), value: displayPerson.unit_id },
        { label: i18n.t('gender'), value: displayPerson.gender || displayPerson.Gender },
        { label: i18n.t('phone_number'), value: displayPerson.phone_number || displayPerson.Phone_Number || displayPerson.phone },
        { label: i18n.t('whatsapp_number'), value: displayPerson.whatsapp_number },
        { label: i18n.t('email'), value: displayPerson.email || displayPerson.Email },
      ].filter(row => row.value); // Only show rows with values
    }
  }, [displayPerson, isDetailedContactType]);

  // Get additional phone numbers if available
  const additionalPhones = displayPerson.additional_phone_numbers || [];

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
          title={displayContactTypeLabel}
          backgroundSource={COMMON_IMAGES.profileBackground}
          avatarSource={
            displayPerson.picture
              ? { uri: getImageUrl(displayPerson.picture) }
              : require('@/assets/images/avatar.png')
          }
          showEditIcon
          onEditPress={handleEditDetails}
          showSettings={false}
          showCamera={true}
          onCameraPress={handleImageUpload}
          personId={rukun.id}
          isUploading={isUploading}
        />

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
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
            
            {/* Additional Phone Numbers Section */}
            {additionalPhones.length > 0 && (
              <View style={styles.additionalPhonesSection}>
                <UrduText style={styles.sectionTitle}>
                  {i18n.t('additional_phone_numbers')}
                </UrduText>
                {additionalPhones.map((phone: string, index: number) => (
                  <DetailRow 
                    key={`additional-phone-${index}`} 
                    label={`${i18n.t('phone')} ${index + 2}`} 
                    value={phone} 
                  />
                ))}
              </View>
            )}
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
  
  /* additional sections */
  additionalPhonesSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    fontFamily: 'JameelNooriNastaleeq',
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
