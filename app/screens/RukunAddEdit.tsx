// app/screens/RukunAddEdit.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Text,
  InteractionManager,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import i18n from '@/src/i18n';
import { AppDispatch, RootState } from '@/src/store/types';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import {
  updatePerson,
  createPerson,
  checkPhoneExists,
  archivePerson,
  transferRukun,
  selectUpdatePersonStatus,
  selectUpdatePersonError,
  selectCreatePersonStatus,
  selectCreatePersonError,
  selectTransferStatus,
  selectTransferError,
  resetUpdateStatus,
  resetCreateStatus,
  resetTransferStatus,
  resetArchiveStatus,
  fetchContactTypes,
  selectContactTypes,
  selectContactTypesStatus,
  selectContactTypesError
} from '@/src/features/persons/personSlice';
import {
  selectSubordinateUnitsForDropdown
} from '@/src/features/tanzeem/tanzeemHierarchySlice';
import {
  selectDashboardSelectedUnitId,
  selectDashboardSelectedUnit,
  selectUserUnitDetails,
  selectLevelsById
} from '@/src/features/tanzeem/tanzeemSlice';
import { Person, UpdatePersonPayload, CreatePersonPayload } from '@/src/models/Person';

import CustomButton from '@/src/components/CustomButton';
import FormInput from '@/src/components/FormInput';
import CustomDropdown, { Option } from '@/src/components/CustomDropdown';
import UrduText from '@/src/components/UrduText';
import TransferRukunModal from '@/src/components/TransferRukunModal';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/src/constants/theme';
import { formatUnitDisplay } from '@/src/utils/formatUnitDisplay';
import { FontAwesome6 } from '@expo/vector-icons';

type RukunAddEditRouteProp = RouteProp<RootStackParamList, 'screens/RukunAddEdit'>;

export default function RukunAddEdit() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RukunAddEditRouteProp>();

  // Get the rukun data from route params if it exists (for edit mode)
  const initialRukun = route.params?.rukun;
  const initialContactTypeId = route.params?.contactTypeId;
  const isEditMode = !!initialRukun && !!initialRukun.id;

  // Redux state for tracking API operations
  const updateStatus = useSelector(selectUpdatePersonStatus);
  const updateError = useSelector(selectUpdatePersonError);
  const createStatus = useSelector(selectCreatePersonStatus);
  const createError = useSelector(selectCreatePersonError);
  const contactTypes = useSelector(selectContactTypes);
  const contactTypesStatus = useSelector(selectContactTypesStatus);
  const contactTypesError = useSelector(selectContactTypesError);

  // Redux state for hierarchy units (subordinate units for dropdown)
  const tanzeemiUnitOptions = useSelector(selectSubordinateUnitsForDropdown);

  // Current user's unit (for pre-selecting in create mode)
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const dashboardSelectedUnit = useSelector(selectDashboardSelectedUnit);
  const userUnit = useSelector(selectUserUnitDetails);
  const levelsById = useSelector(selectLevelsById);
  const currentUnitId = selectedUnitId || userUnit?.id;
  const currentUnitName = useMemo(
    () => formatUnitDisplay(dashboardSelectedUnit || userUnit, levelsById),
    [dashboardSelectedUnit, userUnit, levelsById]
  );

  // Transfer status
  const transferStatus = useSelector(selectTransferStatus);
  const transferError = useSelector(selectTransferError);


  // Form state
  const [formData, setFormData] = useState<UpdatePersonPayload | CreatePersonPayload>(() => {
    if (isEditMode && initialRukun) {
      return {
        id: initialRukun.id,
        name: initialRukun.name || initialRukun.Name || '',
        parent: initialRukun.parent || initialRukun.Father_Name || '',
        address: initialRukun.address || initialRukun.Address || '',
        email: initialRukun.email || initialRukun.Email || '',
        phone: initialRukun.phone || initialRukun.Phone_Number || '',
        whatsApp: initialRukun.whatsApp || initialRukun.additional_phones || '',
        contact_type: initialRukun.contact_type || undefined,
        tanzeemi_unit: initialRukun.Tanzeemi_Unit || undefined,
        status: initialRukun.status || 'draft',
      };
    } else {
      // Create mode - pre-select contact type from navigation params
      return {
        name: '',
        parent: '',
        address: '',
        email: '',
        phone: '',
        whatsApp: '',
        contact_type: initialContactTypeId || undefined,
        tanzeemi_unit: undefined,
        status: 'draft',
      };
    }
  });

  // Pre-select current unit in create mode once it's available
  useEffect(() => {
    if (!isEditMode && currentUnitId && !formData.tanzeemi_unit) {
      setFormData(prev => ({ ...prev, tanzeemi_unit: currentUnitId }));
    }
  }, [isEditMode, currentUnitId]);

  // Separate state for Rukinat Date (membership date)
  const [rukinatDate, setRukinatDate] = useState<string>(() => {
    if (isEditMode && initialRukun) {
      return initialRukun.Rukinat_Date || initialRukun.rukinat_date || '';
    }
    return '';
  });

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Transfer state (admin approval for rukun)
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Direct transfer state (for umeedwar/karkun)
  const [showDirectTransferModal, setShowDirectTransferModal] = useState(false);
  const [selectedTransferUnitId, setSelectedTransferUnitId] = useState<number | undefined>(undefined);
  const [directTransferLoading, setDirectTransferLoading] = useState(false);

  // Archive state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveError, setArchiveError] = useState('');

  // Fetch contact types on component mount
  useEffect(() => {
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, contactTypesStatus]);

  // Determine the current contact type string
  const selectedContactTypeStr = useMemo(() => {
    if (!formData.contact_type || !contactTypes || contactTypes.length === 0) return '';
    const ct = contactTypes.find(type => type.id === formData.contact_type);
    return ct?.type || '';
  }, [formData.contact_type, contactTypes]);

  // Determine the initial (edit mode) contact type string
  const initialContactTypeStr = useMemo(() => {
    if (!isEditMode || !initialRukun?.contact_type || !contactTypes || contactTypes.length === 0) return '';
    const ct = contactTypes.find(type => type.id === initialRukun.contact_type);
    return ct?.type || '';
  }, [isEditMode, initialRukun, contactTypes]);

  // Whether this is a rukun type
  const isRukunType = selectedContactTypeStr === 'rukun';

  // Whether transfer is allowed (rukun, umeedwar, karkun — not others)
  const isTransferableType = ['rukun', 'umeedwar', 'karkun'].includes(selectedContactTypeStr);

  // Whether archive is allowed (non-rukun types)
  const isArchivableType = selectedContactTypeStr !== '' && selectedContactTypeStr !== 'rukun';

  // Contact type dropdown options based on mode and current type
  const contactTypeOptions: Option[] = useMemo(() => {
    if (!contactTypes || contactTypes.length === 0) return [];

    let allowedTypes: string[];

    if (!isEditMode) {
      // Create mode: umeedwar, karkun, others (not rukun)
      allowedTypes = ['umeedwar', 'karkun', 'others'];
    } else if (initialContactTypeStr === 'umeedwar') {
      // Edit umeedwar: locked (only umeedwar shown)
      allowedTypes = ['umeedwar'];
    } else if (initialContactTypeStr === 'karkun') {
      // Edit karkun: can promote to umeedwar
      allowedTypes = ['umeedwar', 'karkun'];
    } else if (initialContactTypeStr === 'others') {
      // Edit others: can change to umeedwar, karkun, or others
      allowedTypes = ['umeedwar', 'karkun', 'others'];
    } else {
      // Edit rukun or unknown: show current type only
      allowedTypes = [initialContactTypeStr].filter(Boolean);
    }

    return contactTypes
      .filter(type => allowedTypes.includes(type.type))
      .map(type => ({
        id: type.id.toString(),
        label: i18n.t(type.type) || type.type,
        value: type.id.toString()
      }));
  }, [contactTypes, isEditMode, initialContactTypeStr]);

  // Whether the contact type dropdown should be disabled
  const isContactTypeDisabled = isEditMode && initialContactTypeStr === 'umeedwar';

  // Dynamic header title based on contact type
  const headerTitle = useMemo(() => {
    // If contact type is selected, show its label
    if (formData.contact_type && contactTypes && contactTypes.length > 0) {
      const contactType = contactTypes.find(type => type.id === formData.contact_type);
      if (contactType) {
        return contactType.label_singular || i18n.t(contactType.type) || contactType.type;
      }
    }

    if (contactTypesStatus === 'loading') {
      return i18n.t('loading') || 'Loading...';
    }

    // No contact type selected yet
    return i18n.t('add_new');
  }, [isEditMode, formData.contact_type, contactTypes, contactTypesStatus]);

  // Hide the header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      title: headerTitle
    });
  }, [navigation, headerTitle]);

  // Track whether user has manually edited WhatsApp field
  const [whatsAppManuallyEdited, setWhatsAppManuallyEdited] = useState(
    isEditMode && initialRukun?.additional_phones ? true : false
  );

  // Handle form input changes
  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-fill WhatsApp when phone changes (if user hasn't manually edited it)
      if (field === 'phone' && !whatsAppManuallyEdited) {
        updated.whatsApp = value as string;
      }
      return updated;
    });

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle WhatsApp field changes separately to track manual edits
  const handleWhatsAppChange = (value: string) => {
    setWhatsAppManuallyEdited(true);
    handleChange('whatsApp', value);
  };

  // Handle dropdown selections
  const handleContactTypeSelect = (option: Option) => {
    handleChange('contact_type', parseInt(option.value));
  };

  const handleTanzeemiUnitSelect = (option: Option) => {
    handleChange('tanzeemi_unit', parseInt(option.value));
  };

  // Transfer handlers
  const handleTransferPress = () => {
    if (isRukunType) {
      // Rukun: admin approval flow
      setShowTransferModal(true);
    } else {
      // Umeedwar/Karkun: direct transfer
      setSelectedTransferUnitId(undefined);
      setShowDirectTransferModal(true);
    }
  };

  const handleTransferSuccess = () => {
    InteractionManager.runAfterInteractions(() => navigation.goBack());
  };

  const handleDirectTransferConfirm = async () => {
    if (!selectedTransferUnitId) {
      Alert.alert(i18n.t('error'), i18n.t('please_select_unit'));
      return;
    }
    if (!isEditMode || !('id' in formData) || !formData.id) return;

    setDirectTransferLoading(true);
    try {
      await dispatch(updatePerson({
        id: formData.id,
        unit: selectedTransferUnitId.toString(),
      })).unwrap();

      setShowDirectTransferModal(false);
      Alert.alert(
        i18n.t('success'),
        i18n.t('transfer_successful_message', { rukunName: formData.name || '' }),
        [{ text: i18n.t('ok'), onPress: () => InteractionManager.runAfterInteractions(() => navigation.goBack()) }]
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

    if (!isEditMode || !('id' in formData) || !formData.id) return;

    setShowArchiveModal(false);
    try {
      await dispatch(archivePerson({ id: formData.id, reason: archiveReason.trim() })).unwrap();
      Alert.alert(
        i18n.t('success'),
        i18n.t('archive_successful'),
        [{ text: i18n.t('ok'), onPress: () => InteractionManager.runAfterInteractions(() => navigation.goBack()) }]
      );
    } catch (error: any) {
      Alert.alert(i18n.t('error'), error || i18n.t('archive_failed'));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = i18n.t('field_required');
    if (!formData.phone?.trim()) newErrors.phone = i18n.t('field_required');
    if (!formData.contact_type) newErrors.contact_type = i18n.t('field_required');

    if (formData.email && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = i18n.t('invalid_email_format');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check phone uniqueness
    try {
      const phoneExists = await dispatch(checkPhoneExists({
        phone: formData.phone!.trim(),
        excludeId: isEditMode && 'id' in formData ? formData.id : undefined,
      })).unwrap();

      if (phoneExists) {
        setErrors(prev => ({ ...prev, phone: i18n.t('phone_already_exists') }));
        return;
      }
    } catch {
      // If phone check fails, continue with save (don't block on network errors)
    }

    if (isEditMode && 'id' in formData && formData.id) {
      // Update mode
      const payload: UpdatePersonPayload = {
        id: formData.id,
        name: formData.name,
        parent: formData.parent,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        whatsApp: formData.whatsApp,
        contact_type: formData.contact_type,
      };
      // Include Rukinat_Date only for rukun type
      if (isRukunType && rukinatDate) {
        (payload as any).Rukinat_Date = rukinatDate;
      }

      const result = await dispatch(updatePerson(payload));
      if (updatePerson.fulfilled.match(result)) {
        Alert.alert(
          i18n.t('success'),
          i18n.t('update_successful') || 'Updated successfully',
          [{ text: i18n.t('ok'), onPress: () => InteractionManager.runAfterInteractions(() => navigation.goBack()) }]
        );
      }
    } else {
      // Create mode
      const payload: CreatePersonPayload = {
        name: formData.name || '',
        parent: formData.parent,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        whatsApp: formData.whatsApp,
        contact_type: formData.contact_type,
        tanzeemi_unit: formData.tanzeemi_unit as number | undefined,
        status: 'draft',
      };

      const result = await dispatch(createPerson(payload));
      if (createPerson.fulfilled.match(result)) {
        Alert.alert(
          i18n.t('success'),
          i18n.t('save') || 'Saved successfully',
          [{ text: i18n.t('ok'), onPress: () => InteractionManager.runAfterInteractions(() => navigation.goBack()) }]
        );
      }
    }
  };

  // Handle transfer success and error
  useEffect(() => {
    if (transferStatus === 'succeeded') {
      setShowTransferModal(false);
      Alert.alert(
        i18n.t('transfer_successful'),
        i18n.t('transfer_successful_message', { rukunName: formData.name || 'Rukun' }),
        [
          {
            text: i18n.t('ok'),
            onPress: () => {
              InteractionManager.runAfterInteractions(() => navigation.goBack());
            }
          }
        ]
      );
    } else if (transferStatus === 'failed' && transferError) {
      Alert.alert(
        i18n.t('transfer_failed'),
        transferError,
        [
          {
            text: i18n.t('ok'),
            onPress: () => {
              dispatch(resetTransferStatus());
            }
          }
        ]
      );
    }
  }, [transferStatus, transferError, formData.name, navigation, dispatch]);

  // Clean up status when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetUpdateStatus());
      dispatch(resetCreateStatus());
      dispatch(resetTransferStatus());
      dispatch(resetArchiveStatus());
    };
  }, [dispatch]);

  // Handle back button press
  const handleBackPress = () => {
    InteractionManager.runAfterInteractions(() => navigation.goBack());
  };

  // Show loading indicator during API operations
  const isLoading = updateStatus === 'loading' || createStatus === 'loading' || isUploading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex1}
    >
      <View style={styles.root}>
        {/*──────────── Compact Header ────────────*/}
        <View style={[styles.compactHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <FontAwesome6 name="arrow-right-long" size={20} color={COLORS.black} />
          </TouchableOpacity>
          <UrduText style={styles.headerTitle}>{headerTitle}</UrduText>
          <View style={{ width: 36 }} />
        </View>

        {/*──────────── Content ────────────*/}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <FormInput
            inputTitle={i18n.t('name')}
            value={formData.name || ''}
            onChange={(value) => handleChange('name', value)}
            placeholder={i18n.t('enter_name')}
            error={errors.name}
            required
          />

          <FormInput
            inputTitle={i18n.t('parent')}
            value={formData.parent || ''}
            onChange={(value) => handleChange('parent', value)}
            placeholder={i18n.t('enter_parent_name')}
            error={errors.parent}
          />

          <FormInput
            inputTitle={i18n.t('address')}
            value={formData.address || ''}
            onChange={(value) => handleChange('address', value)}
            placeholder={i18n.t('enter_address')}
            multiline={true}
            numberOfLines={2}
            error={errors.address}
          />

          {/* Rukinat Date - only for rukun type */}
          {isRukunType && (
            <FormInput
              inputTitle={i18n.t('rukinat_date')}
              value={rukinatDate}
              onChange={(value) => setRukinatDate(value)}
              placeholder="YYYY-MM-DD"
              error={errors.rukinat_date}
              />
          )}

          <FormInput
            inputTitle={i18n.t('phone_number')}
            value={formData.phone || ''}
            onChange={(value) => handleChange('phone', value)}
            placeholder={i18n.t('enter_phone')}
            keyboardType="phone-pad"
            error={errors.phone}
            required
          />

          <FormInput
            inputTitle={i18n.t('whatsapp_number')}
            value={formData.whatsApp || ''}
            onChange={handleWhatsAppChange}
            placeholder={i18n.t('enter_phone')}
            keyboardType="phone-pad"
            error={errors.whatsApp}
          />

          <FormInput
            inputTitle={i18n.t('email')}
            value={formData.email || ''}
            onChange={(value) => handleChange('email', value)}
            placeholder={i18n.t('enter_email')}
            keyboardType="email-address"
            error={errors.email}
          />

          <CustomDropdown
            dropdownTitle={i18n.t('contact_type')}
            options={contactTypeOptions}
            onSelect={handleContactTypeSelect}
            selectedValue={formData.contact_type?.toString()}
            placeholder={i18n.t('contact_type')}
            loading={contactTypesStatus === 'loading'}
            disabled={isContactTypeDisabled}
            viewStyle={styles.dropdownContainer}
          />

          {errors.contact_type && (
            <Text style={styles.fieldErrorText}>{errors.contact_type}</Text>
          )}

          {/* Unit - show as read-only label */}
          <View style={styles.unitRow}>
            <UrduText style={styles.unitLabel}>{i18n.t('unit')}</UrduText>
            <UrduText style={styles.unitValue}>
              {currentUnitName || tanzeemiUnitOptions.find(u => u.value === formData.tanzeemi_unit?.toString())?.label || i18n.t('select_unit')}
            </UrduText>
          </View>

          {/* Error messages */}
          {(updateError || createError) && (
            <Text style={styles.errorText}>
              {updateError || createError}
            </Text>
          )}

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <CustomButton
              text={isEditMode ? i18n.t('update') : i18n.t('save')}
              onPress={handleSubmit}
              viewStyle={styles.submitBtn}
              disabled={isLoading}
            />

            {isLoading && (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={styles.loader}
              />
            )}
          </View>

          {/* Transfer Feature - Only visible in edit mode for transferable types */}
          {isEditMode && isTransferableType && (
            <View style={styles.transferContainer}>
              <CustomButton
                text={transferStatus === 'loading' || directTransferLoading ? i18n.t('transferring') : i18n.t('transfer_contact')}
                onPress={handleTransferPress}
                viewStyle={styles.transferBtn}
                disabled={isLoading || transferStatus === 'loading' || directTransferLoading}
              />

              {transferStatus === 'loading' && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={styles.transferLoader}
                />
              )}
            </View>
          )}

          {/* Archive/Remove Feature - Only visible in edit mode for non-rukun types */}
          {isEditMode && isArchivableType && (
            <View style={styles.archiveContainer}>
              <CustomButton
                text={i18n.t('archive_person')}
                onPress={handleArchivePress}
                viewStyle={styles.archiveBtn}
                disabled={isLoading}
              />
            </View>
          )}
        </ScrollView>
      </View>

      {/* Transfer Modal */}
      {isEditMode && 'id' in formData && formData.id && (
        <TransferRukunModal
          visible={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferSuccess}
          rukunId={formData.id}
          rukunName={formData.name || 'Unknown'}
          currentUnitId={formData.tanzeemi_unit}
          currentUnitName={tanzeemiUnitOptions.find(unit =>
            unit.value === formData.tanzeemi_unit?.toString()
          )?.label}
          tanzeemiUnitOptions={tanzeemiUnitOptions}
        />
      )}

      {/* Direct Transfer Modal (for umeedwar/karkun) */}
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

            <CustomDropdown
              dropdownTitle={i18n.t('select_new_unit')}
              options={tanzeemiUnitOptions}
              onSelect={(option: Option) => setSelectedTransferUnitId(parseInt(option.value))}
              selectedValue={selectedTransferUnitId?.toString()}
              placeholder={i18n.t('choose_destination_unit')}
              disabled={directTransferLoading}
              viewStyle={styles.dropdownContainer}
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
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
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

            <UrduText style={styles.modalTitle}>
              {i18n.t('archive_person_title')}
            </UrduText>

            <UrduText style={styles.modalDescription}>
              {i18n.t('archive_person_confirm', { name: formData.name || '' })}
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
                viewStyle={styles.modalConfirmBtn}
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

/* ──────────────────────
   Styles
   ────────────────────── */
const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Compact header
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: 7,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl * 2,
  },

  buttonContainer: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    minWidth: 200,
  },
  loader: {
    marginLeft: 16,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontFamily: 'JameelNooriNastaleeq',
  },
  dropdownContainer: {
    marginBottom: SPACING.xs,
  },
  fieldErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'JameelNooriNastaleeq',
  },

  // Unit read-only row
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  unitLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  unitValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: SPACING.sm,
  },

  // Transfer styles
  transferContainer: {
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  transferBtn: {
    backgroundColor: COLORS.warning,
    minWidth: 200,
  },
  transferLoader: {
    marginTop: SPACING.sm,
  },

  // Archive styles
  archiveContainer: {
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  archiveBtn: {
    backgroundColor: COLORS.error,
    minWidth: 200,
  },

  // Modal styles
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
  modalTextInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    borderRadius: BORDER_RADIUS?.md || 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY?.fontSize?.md || 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    textAlign: 'right',
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
    backgroundColor: COLORS.error,
  },
  modalCancelBtn: {
    backgroundColor: COLORS.lightGray2,
  },
});
