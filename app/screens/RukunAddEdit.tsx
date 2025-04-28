// app/screens/RukunAddEdit.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
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
  resetCreateStatus
} from '@/app/features/persons/personSlice';
import { Person, UpdatePersonPayload, CreatePersonPayload } from '@/app/models/Person';
import { getImageUrl } from '@/app/utils/imageUpload';

import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
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
  const isEditMode = !!route.params?.rukun;
  const initialRukun = route.params?.rukun;
  
  // Redux state for tracking API operations
  const updateStatus = useSelector(selectUpdatePersonStatus);
  const updateError = useSelector(selectUpdatePersonError);
  const createStatus = useSelector(selectCreatePersonStatus);
  const createError = useSelector(selectCreatePersonError);
  
  // Form state
  const [formData, setFormData] = useState<UpdatePersonPayload | CreatePersonPayload>({
    id: initialRukun?.id || 0,
    name: initialRukun?.name || '',
    parent: initialRukun?.parent || '',
    dob: initialRukun?.dob || '',
    cnic: initialRukun?.cnic || '',
    status: initialRukun?.status || 'active',
    address: initialRukun?.address || '',
    phone: initialRukun?.phone || '',
    whatsApp: initialRukun?.whatsApp || '',
    email: initialRukun?.email || '',
    picture: initialRukun?.picture || '',
  });
  
  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Hide the header
  useEffect(() => {
    navigation.setOptions({ 
      headerShown: false,
      title: isEditMode ? i18n.t('edit_rukun') : i18n.t('add_rukun')
    });
  }, [navigation, isEditMode]);
  
  // Handle form input changes
  const handleChange = (field: keyof typeof formData, value: string) => {
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
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name) newErrors.name = i18n.t('field_required');
    if (!formData.phone) newErrors.phone = i18n.t('field_required');
    
    // CNIC validation (if provided)
    if (formData.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = i18n.t('invalid_cnic_format');
    }
    
    // Email validation (if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
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
      } else {
        // Create new rukun
        await dispatch(createPerson(formData as CreatePersonPayload)).unwrap();
      }
      
      // Navigate back on success
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
            formData.picture
              ? { uri: getImageUrl(formData.picture as string) }
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
          {/* Form Fields */}
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
          />
          
          <FormInput
            inputTitle={i18n.t('dob')}
            value={formData.dob || ''}
            onChange={(value) => handleChange('dob', value)}
            placeholder="DD/MM/YYYY"
          />
          
          <FormInput
            inputTitle={i18n.t('cnic')}
            value={formData.cnic || ''}
            onChange={(value) => handleChange('cnic', value)}
            placeholder="00000-0000000-0"
            error={errors.cnic}
          />
          
          <FormInput
            inputTitle={i18n.t('unit')}
            value={formData.unit !== undefined ? formData.unit.toString() : ''}
            onChange={(value) => handleChange('unit', value)}
            placeholder={i18n.t('enter_unit')}
          />
          
          <FormInput
            inputTitle={i18n.t('address')}
            value={formData.address || ''}
            onChange={(value) => handleChange('address', value)}
            placeholder={i18n.t('enter_address')}
            multiline
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
          
          <FormInput
            inputTitle={i18n.t('whatsapp_number')}
            value={formData.whatsApp || ''}
            onChange={(value) => handleChange('whatsApp', value)}
            placeholder={i18n.t('enter_whatsapp')}
            keyboardType="phone-pad"
          />
          
          <FormInput
            inputTitle={i18n.t('email')}
            value={formData.email || ''}
            onChange={(value) => handleChange('email', value)}
            placeholder={i18n.t('enter_email')}
            keyboardType="email-address"
            error={errors.email}
          />

          {/* Error messages */}
          {(updateError || createError) && (
            <Text style={styles.errorText}>
              {updateError || createError}
            </Text>
          )}

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <CustomButton
              text={isEditMode ? 'اپڈیٹ کریں' : i18n.t('save')}
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
});
