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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';

import i18n from '../i18n';
import { AppDispatch, RootState } from '@/app/store/types';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import { 
  updatePerson, 
  createPerson, 
  
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
  fetchContactTypes,
  selectContactTypes,
  selectContactTypesStatus,
  selectContactTypesError
} from '@/app/features/persons/personSlice';
import {
  selectSubordinateUnitsForDropdown
} from '@/app/features/tanzeem/tanzeemHierarchySlice';
import { Person, UpdatePersonPayload, CreatePersonPayload } from '@/app/models/Person';
// import { getImageUrl } from '@/app/utils/imageUpload';

import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
import CustomDropdown, { Option } from '@/app/components/CustomDropdown';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
import TransferRukunModal from '@/app/components/TransferRukunModal';
import { COMMON_IMAGES } from '@/app/constants/images';
import { COLORS, SPACING } from '../constants/theme';

type RukunAddEditRouteProp = RouteProp<RootStackParamList, 'screens/RukunAddEdit'>;

/* ──────────────────────
   Constants
   ────────────────────── */
const AVATAR_SIZE = 120;

export default function RukunAddEdit() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RukunAddEditRouteProp>();
  
  // Get the rukun data from route params if it exists (for edit mode)
  const initialRukun = route.params?.rukun;
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
  
  // Transfer status
  const transferStatus = useSelector(selectTransferStatus);
  const transferError = useSelector(selectTransferError);
  
  
  // Form state - simplified to only required fields
  const [formData, setFormData] = useState<UpdatePersonPayload | CreatePersonPayload>(() => {
    if (isEditMode && initialRukun) {
      return {
        id: initialRukun.id,
        name: initialRukun.name || initialRukun.Name || '',
        email: initialRukun.email || initialRukun.Email || '',
        gender: initialRukun.gender || initialRukun.Gender || 'male',
        phone: initialRukun.phone || initialRukun.Phone_Number || '',
        contact_type: initialRukun.contact_type || undefined,
        tanzeemi_unit: initialRukun.Tanzeemi_Unit || undefined,
        status: initialRukun.status || 'draft',
      };
    } else {
      // Create mode - start with empty form
      return {
        name: '',
        email: '',
        gender: 'male',
        phone: '',
        contact_type: undefined,
        tanzeemi_unit: undefined,
        status: 'draft',
      };
    }
  });
  
  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Transfer Rukun state
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Fetch contact types on component mount
  useEffect(() => {
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, contactTypesStatus]);

  // Gender options
  const genderOptions: Option[] = useMemo(() => [
    { id: 'male', label: i18n.t('male'), value: 'male' },
    { id: 'female', label: i18n.t('female'), value: 'female' },
  ], []);

  // Contact type options - filtered to only show "karkun" and "others"
  const contactTypeOptions: Option[] = useMemo(() => {
    if (!contactTypes || contactTypes.length === 0) return [];
    
    return contactTypes
      .filter(type => type.type === 'karkun' || type.type === 'others')
      .map(type => ({
        id: type.id.toString(),
        label: i18n.t(type.type) || type.type,
        value: type.id.toString()
      }));
  }, [contactTypes]);

  // Dynamic header title based on contact type
  const headerTitle = useMemo(() => {
    if (!isEditMode) {
      return i18n.t('add_rukun');
    }
    
    // In edit mode, get the contact type label
    if (formData.contact_type && contactTypes && contactTypes.length > 0) {
      const contactType = contactTypes.find(type => type.id === formData.contact_type);
      if (contactType) {
        // Return the localized contact type name
        return i18n.t(contactType.type) || contactType.type;
      }
    }
    
    // Show loading state if contact types are still being fetched
    if (contactTypesStatus === 'loading') {
      return i18n.t('loading') || 'Loading...';
    }
    
    // Fallback to generic "رکن" if contact type not found or not loaded yet
    return 'رکن';
  }, [isEditMode, formData.contact_type, contactTypes, contactTypesStatus]);

  // Hide the header
  useEffect(() => {
    navigation.setOptions({ 
      headerShown: false,
      title: headerTitle
    });
  }, [navigation, headerTitle]);
  
  // Handle form input changes
  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle dropdown selections
  const handleGenderSelect = (option: Option) => {
    handleChange('gender', option.value);
  };

  const handleContactTypeSelect = (option: Option) => {
    handleChange('contact_type', parseInt(option.value));
  };

  const handleTanzeemiUnitSelect = (option: Option) => {
    handleChange('tanzeemi_unit', parseInt(option.value));
  };

  // Transfer Rukun handlers
  const handleTransferRukun = () => {
    setShowTransferModal(true);
  };

  const handleTransferSuccess = () => {
    // Refresh the data or navigate back
    navigation.goBack();
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name?.trim()) newErrors.name = i18n.t('field_required');
    if (!formData.phone?.trim()) newErrors.phone = i18n.t('field_required');
    if (!formData.contact_type) newErrors.contact_type = i18n.t('field_required');
    
    // Email validation (if provided)
    if (formData.email && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = i18n.t('invalid_email_format');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    

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
              navigation.goBack();
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
    };
  }, [dispatch]);
  
  // Handle back button press
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  // Image upload disabled
  const handleImageUpload = async (_imageUri: string) => {
    return;
  };
        
  
  // Show loading indicator during API operations
  const isLoading = updateStatus === 'loading' || createStatus === 'loading' || isUploading;
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex1}
    >
      <View style={styles.root}>
        {/*──────────── Header (wave + avatar) ────────────*/}
        <ProfileHeader
          title={headerTitle}
          backgroundSource={COMMON_IMAGES.profileBackground}
          avatarSource={require('@/assets/images/avatar.png')}
          onBackPress={handleBackPress}
          showSettings={false}
          showCamera={false}
        />

        {/*──────────── Content ────────────*/}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollWrapper}
        >
          {/* Simplified Form Fields */}
          <FormInput
            inputTitle={i18n.t('name')}
            value={formData.name || ''}
            onChange={(value) => handleChange('name', value)}
            placeholder={i18n.t('enter_name')}
            error={errors.name}
            required
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
            dropdownTitle={i18n.t('gender')}
            options={genderOptions}
            onSelect={handleGenderSelect}
            selectedValue={formData.gender}
            placeholder={i18n.t('gender')}
            viewStyle={styles.dropdownContainer}
          />
          
          <FormInput
            inputTitle={i18n.t('phone_number')}
            value={formData.phone || ''}
            onChange={(value) => handleChange('phone', value)}
            placeholder={i18n.t('enter_phone')}
            keyboardType="phone-pad"
            error={errors.phone}
            required
          />

          <CustomDropdown
            dropdownTitle={i18n.t('contact_type')}
            options={contactTypeOptions}
            onSelect={handleContactTypeSelect}
            selectedValue={formData.contact_type?.toString()}
            placeholder={i18n.t('contact_type')}
            loading={contactTypesStatus === 'loading'}
            viewStyle={styles.dropdownContainer}
          />
          
          {errors.contact_type && (
            <Text style={styles.fieldErrorText}>{errors.contact_type}</Text>
          )}
          <CustomDropdown
            dropdownTitle={i18n.t('unit')}
            options={tanzeemiUnitOptions}
            onSelect={handleTanzeemiUnitSelect}
            selectedValue={formData.tanzeemi_unit?.toString()}
            placeholder={i18n.t('select_unit')}
            disabled={isEditMode}
            viewStyle={styles.dropdownContainer}
          />
          
          {errors.tanzeemi_unit && (
            <Text style={styles.fieldErrorText}>{errors.tanzeemi_unit}</Text>
          )}

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

          {/* Transfer Rukun Feature - Only visible in edit mode */}
          {isEditMode && (
            <View style={styles.transferContainer}>
              <CustomButton
                text={transferStatus === 'loading' ? i18n.t('transferring') : i18n.t('transfer_rukun')}
                onPress={handleTransferRukun}
                viewStyle={styles.transferBtn}
                disabled={isLoading || transferStatus === 'loading'}
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
        </ScrollView>
      </View>

      {/* Transfer Rukun Modal */}
      {isEditMode && 'id' in formData && formData.id && (
        <TransferRukunModal
          visible={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferSuccess}
          rukunId={formData.id}
          rukunName={formData.name || 'Unknown Rukun'}
          currentUnitId={formData.tanzeemi_unit}
          currentUnitName={tanzeemiUnitOptions.find(unit => 
            unit.value === formData.tanzeemi_unit?.toString()
          )?.label}
          tanzeemiUnitOptions={tanzeemiUnitOptions}
        />
      )}
    </KeyboardAvoidingView>
  );
}

/* ──────────────────────
   Styles
   ────────────────────── */
const styles = StyleSheet.create({
  flex1: { 
    flex: 1 
  },
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

  /* form */
  buttonContainer: {
    marginTop: 32,
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
  },
  dropdownContainer: {
    marginBottom: SPACING.md,
  },
  fieldErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  
  // Transfer Rukun styles
  transferContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  transferBtn: {
    backgroundColor: COLORS.warning,
    minWidth: 200,
  },
  transferLoader: {
    marginTop: SPACING.sm,
  },
});
