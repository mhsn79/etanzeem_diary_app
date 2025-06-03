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
import { AppDispatch, RootState } from '@/app/store';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import { 
  updatePerson, 
  createPerson, 
  updatePersonImage,
  selectUpdatePersonStatus, 
  selectUpdatePersonError,
  selectCreatePersonStatus,
  selectCreatePersonError,
  resetUpdateStatus,
  resetCreateStatus,
  fetchContactTypes,
  selectContactTypes,
  selectContactTypesStatus,
  selectContactTypesError
} from '@/app/features/persons/personSlice';
import {
  selectSubordinateUnitsForDropdown
} from '@/app/features/tanzeem/tanzeemHierarchySlice';
import { Person, UpdatePersonPayload, CreatePersonPayload } from '@/app/models/Person';
import { getImageUrl } from '@/app/utils/imageUpload';

import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
import CustomDropdown, { Option } from '@/app/components/CustomDropdown';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
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
  
  // Fetch contact types on component mount
  useEffect(() => {
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, contactTypesStatus]);

  // Hide the header
  useEffect(() => {
    navigation.setOptions({ 
      headerShown: false,
      title: isEditMode ? i18n.t('edit_rukun') : i18n.t('add_rukun')
    });
  }, [navigation, isEditMode]);

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
    
    try {
      if (isEditMode && 'id' in formData) {
        // Update existing rukun
        await dispatch(updatePerson(formData as UpdatePersonPayload)).unwrap();
        Alert.alert(
          i18n.t('success'),
          'Person updated successfully',
          [{ text: i18n.t('ok') }]
        );
      } else {
        // Create new rukun
        await dispatch(createPerson(formData as CreatePersonPayload)).unwrap();
        Alert.alert(
          i18n.t('success'),
          'Person created successfully',
          [{ text: i18n.t('ok') }]
        );
      }
      
      // Navigate back on success and refresh the list
      navigation.goBack();
    } catch (error) {
      console.error('Error saving rukun:', error);
      Alert.alert(
        i18n.t('error'),
        typeof error === 'string' ? error : i18n.t('save_failed'),
        [{ text: i18n.t('ok') }]
      );
    }
  };
  
  // Clean up status when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetUpdateStatus());
      dispatch(resetCreateStatus());
    };
  }, [dispatch]);
  
  // Handle back button press
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  // Handle image upload
  const handleImageUpload = async (imageUri: string) => {
    // Check if we're in edit mode and have a valid ID
    if (!isEditMode || !('id' in formData) || !formData.id) {
      Alert.alert(
        i18n.t('error'),
        i18n.t('save_profile_first')
      );
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Dispatch the updatePersonImage action
      // We've already checked that id exists and is valid above
      await dispatch(updatePersonImage({
        id: formData.id,
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
          title={isEditMode ? 'رکن': i18n.t('add_rukun')}
          backgroundSource={COMMON_IMAGES.profileBackground}
          avatarSource={
            (isEditMode && initialRukun?.picture)
              ? { uri: getImageUrl(initialRukun.picture as string) }
              : require('@/assets/images/avatar.png')
          }
          onBackPress={handleBackPress}
          showSettings={false}
          showCamera={isEditMode}
          onCameraPress={handleImageUpload}
          personId={isEditMode && 'id' in formData ? formData.id : undefined}
          isUploading={isUploading}
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
        </ScrollView>
      </View>
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
});
