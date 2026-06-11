// app/screens/RukunView.tsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  GestureResponderEvent,
  Alert,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Linking } from 'react-native';
import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import {
  fetchPersonById,
  selectPersonById,
  selectPersonsStatus,
  selectPersonsError,
  updatePerson,
  archivePerson,
  createRukunTransfer,
  checkExistingTransfer,
  resetTransferStatus,
  resetArchiveStatus,
  selectContactTypes,
  fetchContactTypes,
  selectContactTypesStatus,
} from '@/src/features/persons/personSlice';
import { fetchTanzeemiUnits, selectTanzeemiUnitById, fetchTanzeemiUnitById } from '@/src/features/tanzeem/tanzeemSlice';
import { selectSubordinateUnitsForDropdown } from '@/src/features/tanzeem/tanzeemHierarchySlice';
import { getImageUrl } from '@/src/utils/imageUpload';

import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/src/constants/theme';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import { RootState, AppDispatch } from '@/src/store/types';

import i18n from '@/src/i18n';

// Components
import CustomButton from '@/src/components/CustomButton';
import CustomDropdown, { Option } from '@/src/components/CustomDropdown';
import UrduText from '@/src/components/UrduText';
import ProfileHeader from '@/src/components/ProfileHeader';
import ContactActionButton from '@/src/components/ContactActionButton';
import TransferRukunModal from '@/src/components/TransferRukunModal';
import { COMMON_IMAGES } from '@/src/constants/images';

type RukunDetailsRouteProp = RouteProp<RootStackParamList, 'screens/RukunView'>;

/* --------------------------
   Typed hooks
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

  // Transfer modal state (for rukun admin approval flow)
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Direct transfer modal state (for umeedwar/karkun)
  const [showDirectTransferModal, setShowDirectTransferModal] = useState(false);
  const [selectedTransferUnitId, setSelectedTransferUnitId] = useState<number | undefined>(undefined);
  const [directTransferLoading, setDirectTransferLoading] = useState(false);

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveError, setArchiveError] = useState('');

  const person = useAppSelector((state) => selectPersonById(state, rukun.id));
  const status = useAppSelector(selectPersonsStatus);
  const error = useAppSelector(selectPersonsError);
  const tanzeemiUnitOptions = useAppSelector(selectSubordinateUnitsForDropdown);
  const contactTypes = useAppSelector(selectContactTypes);
  const contactTypesStatus = useAppSelector(selectContactTypesStatus);

  // Get unit details from Redux
  const currentUnitId = person?.Tanzeemi_Unit || person?.tanzeemi_unit || rukun?.Tanzeemi_Unit || rukun?.tanzeemi_unit;
  const unitFromRedux = currentUnitId ? useAppSelector((state) => selectTanzeemiUnitById(state, currentUnitId)) : null;
  const levelsById = useAppSelector((state) => state.tanzeem?.levelsById || {});

  // Fetch contact types if not loaded
  useEffect(() => {
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, contactTypesStatus]);

  // Fetch unit if not in Redux
  useEffect(() => {
    if (currentUnitId && !unitFromRedux) {
      dispatch(fetchTanzeemiUnitById(currentUnitId));
    }
  }, [currentUnitId, unitFromRedux, dispatch]);

  // Format unit name with level
  let formattedUnitName = '';
  if (unitFromRedux) {
    const levelId = unitFromRedux.Level_id || unitFromRedux.level_id;
    const level = levelId && levelsById[levelId] ? levelsById[levelId] : null;
    const levelName = level?.Name || level?.name || '';
    const unitName = unitFromRedux.Name || unitFromRedux.name || '';
    formattedUnitName = levelName ? `${levelName}: ${unitName}` : unitName;
  }

  const displayPerson = person ?? rukun;

  // Use the passed contact type label or derive from person's contact type
  const displayContactTypeLabel = useMemo(() => {
    if (contactTypeLabel) return contactTypeLabel;
    const ctId = displayPerson.contact_type;
    if (ctId && contactTypes && contactTypes.length > 0) {
      const ct = contactTypes.find(type => type.id === ctId);
      if (ct) return ct.label_singular || i18n.t(ct.type) || ct.type;
    }
    return '';
  }, [contactTypeLabel, displayPerson.contact_type, contactTypes]);

  // Determine contact type string from the person's contact_type ID
  const contactTypeStr = useMemo(() => {
    const ctId = displayPerson.contact_type;
    if (!ctId || !contactTypes || contactTypes.length === 0) return '';
    const ct = contactTypes.find(type => type.id === ctId);
    return ct?.type || '';
  }, [displayPerson.contact_type, contactTypes]);

  // Contact type flags
  const isRukunContactType = contactTypeStr === 'rukun';
  const isTransferableType = ['umeedwar', 'karkun'].includes(contactTypeStr);
  const isArchivableType = contactTypeStr !== '' && contactTypeStr !== 'rukun';

  // Whether edit icon should show (hide only for rukun)
  const shouldShowEditIcon = !isRukunContactType;

  // Image upload disabled per requirements
  const handleImageUpload = async (_imageUri: string) => {
    Alert.alert(i18n.t('info'), i18n.t('feature_not_available'));
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
    dispatch(fetchPersonById(rukun.id));
    dispatch(fetchTanzeemiUnits());
  }, [dispatch, rukun.id]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPersonById(rukun.id));
      return () => {};
    }, [dispatch, rukun.id])
  );

  /* ──────────── Hide stack header ────────────*/
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });
      return () => {};
    }, [navigation])
  );

  /* ──────────── Detail rows ────────────*/
  const detailRows = useMemo(() => {
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ur-PK', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      } catch (e) {
        return dateString;
      }
    };

    const rows = [
      { label: i18n.t('parent'), value: displayPerson.parent || displayPerson.Father_Name },
      { label: i18n.t('address'), value: displayPerson.address || displayPerson.Address },
    ];

    // Only show Rukinat_Date for rukun type
    if (isRukunContactType) {
      rows.push({ label: i18n.t('rukinat_date'), value: formatDate(displayPerson.rukinat_date || displayPerson.Rukinat_Date) });
    }

    rows.push(
      { label: i18n.t('email'), value: displayPerson.email || displayPerson.Email },
      { label: i18n.t('phone_number'), value: displayPerson.phone_number || displayPerson.Phone_Number || displayPerson.phone },
      { label: i18n.t('whatsapp_number'), value: displayPerson.whatsapp_number || displayPerson.additional_phones || displayPerson.whatsApp },
    );

    return rows.filter(row => row.value);
  }, [displayPerson, isRukunContactType]);

  const additionalPhones = displayPerson.additional_phone_numbers || [];

  /* ──────────── Helpers ────────────*/
  const openLink = (url: string) =>
    Linking.openURL(url).catch((e) => console.error('Link error', e));

  /* ──────────── Handlers ────────────*/
  const handleEditDetails = () => {
    navigation.navigate('screens/RukunAddEdit', { rukun: displayPerson });
  };

  const handleGenerateRukunUpdateRequest = () => {
    navigation.navigate('screens/RukunUpdateScreen', {
      rukun: displayPerson,
      contactTypeLabel: displayContactTypeLabel
    });
  };

  // Rukun transfer (admin approval flow)
  const handleInitiateRukunTransfer = () => {
    setShowTransferModal(true);
  };

  const handleTransferSuccess = () => {
    dispatch(fetchPersonById(rukun.id));
  };

  // Direct transfer for umeedwar/karkun (local only)
  const handleDirectTransfer = () => {
    setSelectedTransferUnitId(undefined);
    setShowDirectTransferModal(true);
  };

  const handleDirectTransferConfirm = async () => {
    if (!selectedTransferUnitId) {
      Alert.alert(i18n.t('error'), i18n.t('please_select_unit'));
      return;
    }

    setDirectTransferLoading(true);
    try {
      await dispatch(updatePerson({
        id: rukun.id,
        unit: selectedTransferUnitId.toString(),
      })).unwrap();

      setShowDirectTransferModal(false);
      Alert.alert(
        i18n.t('success'),
        i18n.t('transfer_successful_message', { rukunName: displayPerson.name || '' }),
        [{ text: i18n.t('ok'), onPress: () => dispatch(fetchPersonById(rukun.id)) }]
      );
    } catch (err: any) {
      Alert.alert(i18n.t('error'), err || i18n.t('transfer_failed'));
    } finally {
      setDirectTransferLoading(false);
    }
  };

  // Archive handlers
  const handleArchivePress = () => {
    setArchiveReason('');
    setArchiveError('');
    setShowArchiveModal(true);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveReason.trim()) {
      setArchiveError(i18n.t('archive_reason_required'));
      return;
    }

    setShowArchiveModal(false);
    try {
      await dispatch(archivePerson({ id: rukun.id, reason: archiveReason.trim() })).unwrap();
      Alert.alert(
        i18n.t('success'),
        i18n.t('archive_successful'),
        [{ text: i18n.t('ok'), onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert(i18n.t('error'), err || i18n.t('archive_failed'));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetArchiveStatus());
    };
  }, [dispatch]);

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
          showEditIcon={shouldShowEditIcon}
          onEditPress={handleEditDetails}
          showSettings={false}
          showCamera={false}
          personId={rukun.id}
          isUploading={false}
          headerHeight={180}
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

            {/* Rukun-specific actions (admin approval flow) */}
            {isRukunContactType && (
              <View style={styles.actionSection}>
                <CustomButton
                  text={i18n.t('generate_rukun_update_request')}
                  onPress={handleGenerateRukunUpdateRequest}
                  viewStyle={styles.actionButton}
                  textStyle={styles.actionButtonText}
                />

                <CustomButton
                  text={i18n.t('initiate_rukun_transfer')}
                  onPress={handleInitiateRukunTransfer}
                  viewStyle={[styles.actionButton, styles.transferButton]}
                  textStyle={styles.actionButtonText}
                />
              </View>
            )}

            {/* Umeedwar/Karkun actions (direct) */}
            {isTransferableType && (
              <View style={styles.actionSection}>
                <CustomButton
                  text={i18n.t('transfer_contact')}
                  onPress={handleDirectTransfer}
                  viewStyle={[styles.actionButton, styles.transferButton]}
                  textStyle={styles.actionButtonText}
                />

                <CustomButton
                  text={i18n.t('archive_person')}
                  onPress={handleArchivePress}
                  viewStyle={[styles.actionButton, styles.archiveButton]}
                  textStyle={styles.actionButtonText}
                />
              </View>
            )}

            {/* Others type - only archive */}
            {!isRukunContactType && !isTransferableType && contactTypeStr !== '' && (
              <View style={styles.actionSection}>
                <CustomButton
                  text={i18n.t('archive_person')}
                  onPress={handleArchivePress}
                  viewStyle={[styles.actionButton, styles.archiveButton]}
                  textStyle={styles.actionButtonText}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Transfer Rukun Modal (admin approval flow for rukun) */}
      {showTransferModal && (
        <TransferRukunModal
          visible={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferSuccess}
          rukunId={rukun.id}
          rukunName={displayPerson.name || ''}
          currentUnitId={currentUnitId}
          currentUnitName={formattedUnitName || displayPerson.unit || displayPerson.unit_name}
          tanzeemiUnitOptions={tanzeemiUnitOptions}
        />
      )}

      {/* Direct Transfer Modal (for umeedwar/karkun - local transfer only) */}
      <Modal
        visible={showDirectTransferModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDirectTransferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowDirectTransferModal(false)}
              disabled={directTransferLoading}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <UrduText style={styles.modalTitle}>
              {i18n.t('transfer_contact')}
            </UrduText>

            <View style={styles.modalInfo}>
              <UrduText style={styles.modalInfoName}>{displayPerson.name || ''}</UrduText>
              {formattedUnitName ? (
                <UrduText style={styles.modalInfoUnit}>
                  {i18n.t('current_unit')}: {formattedUnitName}
                </UrduText>
              ) : null}
            </View>

            <CustomDropdown
              dropdownTitle={i18n.t('select_new_unit')}
              options={tanzeemiUnitOptions || []}
              onSelect={(option: Option) => setSelectedTransferUnitId(parseInt(option.value))}
              selectedValue={selectedTransferUnitId?.toString()}
              placeholder={i18n.t('choose_destination_unit')}
              disabled={directTransferLoading}
              viewStyle={styles.modalDropdown}
            />

            <View style={styles.modalButtonContainer}>
              <CustomButton
                text={directTransferLoading ? i18n.t('transferring') : i18n.t('confirm')}
                onPress={handleDirectTransferConfirm}
                viewStyle={styles.modalConfirmBtn}
                disabled={directTransferLoading || !selectedTransferUnitId}
              />
              <CustomButton
                text={i18n.t('cancel')}
                onPress={() => setShowDirectTransferModal(false)}
                viewStyle={styles.modalCancelBtn}
                disabled={directTransferLoading}
              />
            </View>

            {directTransferLoading && (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: SPACING.sm }} />
            )}
          </View>
        </View>
      </Modal>

      {/* Archive Reason Modal */}
      <Modal
        visible={showArchiveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowArchiveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowArchiveModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <UrduText style={styles.modalTitleError}>
              {i18n.t('archive_person_title')}
            </UrduText>

            <UrduText style={styles.modalDescription}>
              {i18n.t('archive_person_confirm', { name: displayPerson.name || '' })}
            </UrduText>

            <TextInput
              style={styles.modalTextInput}
              value={archiveReason}
              onChangeText={(text) => {
                setArchiveReason(text);
                if (archiveError) setArchiveError('');
              }}
              placeholder={i18n.t('archive_reason_placeholder')}
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlign="right"
            />

            {archiveError ? (
              <Text style={styles.modalErrorText}>{archiveError}</Text>
            ) : null}

            <View style={styles.modalButtonContainer}>
              <CustomButton
                text={i18n.t('confirm')}
                onPress={handleArchiveConfirm}
                viewStyle={[styles.modalConfirmBtn, styles.archiveButton]}
              />
              <CustomButton
                text={i18n.t('cancel')}
                onPress={() => setShowArchiveModal(false)}
                viewStyle={styles.modalCancelBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  scrollWrapper: { marginTop: AVATAR_SIZE / 2 },
  scrollContent: { paddingBottom: 24 },

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

  /* Action Section */
  actionSection: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
  },
  transferButton: {
    backgroundColor: COLORS.tertiary,
  },
  archiveButton: {
    backgroundColor: COLORS.error,
  },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.background || '#fff',
    borderRadius: BORDER_RADIUS?.lg || 16,
    padding: SPACING.lg,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY?.fontSize?.xxl || 22,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  modalTitleError: {
    fontSize: TYPOGRAPHY?.fontSize?.xxl || 22,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  modalDescription: {
    fontSize: TYPOGRAPHY?.fontSize?.md || 16,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalInfo: {
    backgroundColor: COLORS.lightGray,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS?.md || 8,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  modalInfoName: {
    fontSize: TYPOGRAPHY?.fontSize?.lg || 18,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  modalInfoUnit: {
    fontSize: TYPOGRAPHY?.fontSize?.sm || 14,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  modalDropdown: {
    marginBottom: SPACING.md,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    borderRadius: BORDER_RADIUS?.md || 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY?.fontSize?.md || 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    textAlign: 'left',
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'JameelNooriNastaleeq',
  },
  modalErrorText: {
    color: COLORS.error,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontFamily: 'JameelNooriNastaleeq',
  },
  modalButtonContainer: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.primary,
  },
  modalCancelBtn: {
    backgroundColor: COLORS.lightGray2,
  },
});
