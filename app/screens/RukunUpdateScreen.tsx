// app/screens/RukunUpdateScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';

import i18n from '../i18n';
import { AppDispatch, RootState } from '@/app/store';
import { RootStackParamList } from '@/src/types/RootStackParamList';
import { 
  fetchPersonById,
  selectPersonById,
  selectPersonsStatus,
  selectPersonsError,
  fetchRukunUpdateRequest,
  selectRukunUpdateRequestByContactId,
  submitRukunUpdateRequest,
  RukunUpdateRequest
} from '@/app/features/persons/personSlice';
import { Person } from '@/app/models/Person';
import { getImageUrl } from '@/app/utils/imageUpload';

import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
import UrduText from '@/app/components/UrduText';
import ProfileHeader from '@/app/components/ProfileHeader';
import { COMMON_IMAGES } from '@/app/constants/images';
import { COLORS, SPACING } from '../constants/theme';

type RukunUpdateRouteProp = RouteProp<RootStackParamList, 'screens/RukunUpdateScreen'>;

/* ──────────────────────
   Constants
   ────────────────────── */
const AVATAR_SIZE = 120;

export default function RukunUpdateScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RukunUpdateRouteProp>();
  
  // Get the rukun data from route params with safety checks
  const { rukun, contactTypeLabel } = route.params || {};
  
  // Early return if no rukun data
  if (!rukun || !rukun.id) {
    return (
      <View style={[styles.flex1, styles.center]}>
        <Text style={styles.errorText}>{i18n.t('invalid_contact_id')}</Text>
        <CustomButton
          text={i18n.t('go_back')}
          onPress={() => navigation.goBack()}
          viewStyle={styles.errorButton}
          textStyle={styles.errorButtonText}
        />
      </View>
    );
  }
  
  // Redux state with safety checks
  const person = useSelector((state: RootState) => {
    try {
      return selectPersonById(state, rukun.id);
    } catch (error) {
      console.error('Error selecting person by ID:', error);
      return null;
    }
  });
  
  const personStatus = useSelector((state: RootState) => {
    try {
      return selectPersonsStatus(state);
    } catch (error) {
      console.error('Error selecting persons status:', error);
      return 'idle';
    }
  });
  
  const personError = useSelector((state: RootState) => {
    try {
      return selectPersonsError(state);
    } catch (error) {
      console.error('Error selecting persons error:', error);
      return null;
    }
  });
  
  // Rukun Update Request state
  const existingRequest = useSelector((state: RootState) => {
    try {
      return selectRukunUpdateRequestByContactId(state, rukun?.id || 0);
    } catch (error) {
      console.error('Error selecting rukun update request:', error);
      return null;
    }
  });
  
  const displayPerson = person ?? rukun;
  
  // Form state - comprehensive fields for Rukun Update
  const [formData, setFormData] = useState<RukunUpdateRequest>(() => ({
    contact_id: rukun?.id || 0,
    status: 'draft' as const,
    Name: '',
    Father_Name: '',
    date_of_birth: '',
    Phone_Number: '',
    Email: '',
    Address: '',
    Profession: '',
    Education: '',
    Additional_Phones: '',
  }));
  
  // Additional phone number state (single field)
  const [additionalPhone, setAdditionalPhone] = useState<string>('');
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch person data and rukun update request on component mount
  useEffect(() => {
    if (rukun?.id) {
      console.log(`[RukunUpdateScreen] 🚀 Starting data fetch for rukun ID: ${rukun.id}`);
      console.log(`[RukunUpdateScreen] 📋 Rukun data:`, {
        id: rukun.id,
        name: rukun.name,
        phone: rukun.phone,
        contactTypeLabel
      });
      
      dispatch(fetchPersonById(rukun.id));
      dispatch(fetchRukunUpdateRequest(rukun.id));
    } else {
      console.log(`[RukunUpdateScreen] ❌ No rukun ID provided`);
    }
  }, [dispatch, rukun?.id]);
  
  // Pre-fill form with existing data based on status logic
  useEffect(() => {
    if (!rukun?.id) return;
    
    // Only run if we have the necessary data
    if (!existingRequest && !person) {
      console.log(`[RukunUpdateScreen] ⏳ Waiting for data to load...`);
      return;
    }
    
    console.log(`[RukunUpdateScreen] 📊 Form Data Population - Starting...`);
    console.log(`[RukunUpdateScreen] 👤 Person data:`, person ? {
      loaded: true,
      id: person.id,
      name: person.name,
      phone: person.phone,
      email: person.email,
      hasAdditionalPhones: person.additional_phone_numbers?.length > 0
    } : { loaded: false });
    
    console.log(`[RukunUpdateScreen] 📝 Existing Request:`, existingRequest ? {
      loaded: true,
      status: existingRequest.status,
      contact_id: existingRequest.contact_id,
      hasData: !!existingRequest.Name
    } : { loaded: false });
    
    // Determine which data to use based on rukun update request status
    let dataToUse = null;
    let statusToUse: 'draft' | 'published' = 'draft';
    
    if (existingRequest) {
      if (existingRequest.status === 'published') {
        // If status is published, show data from Person table
        dataToUse = displayPerson;
        statusToUse = 'published';
        console.log(`[RukunUpdateScreen] ✅ Using data from Person table (published status)`);
      } else {
        // Status is NOT published (draft), use data from Rukn_Update table
        dataToUse = existingRequest;
        statusToUse = 'draft';
        console.log(`[RukunUpdateScreen] 📝 Using data from Rukn_Update table (draft status)`);
      }
    } else {
      // No existing request, show data from Person table
      dataToUse = displayPerson;
      statusToUse = 'draft';
      console.log(`[RukunUpdateScreen] 🆕 No existing request, using data from Person table`);
    }
    
    if (dataToUse) {
      console.log(`[RukunUpdateScreen] 🔧 Populating form with data:`, {
        source: statusToUse === 'published' ? 'Person Table' : 'Rukn_Update Table',
        name: dataToUse.name || dataToUse.Name,
        phone: dataToUse.phone || dataToUse.Phone_Number,
        email: dataToUse.email || dataToUse.Email,
        hasAdditionalPhones: !!(dataToUse.Additional_Phones || dataToUse.additional_phone_numbers?.length)
      });
      
      // Pre-fill with appropriate data based on source
      let formDataToSet;
      
      if (statusToUse === 'published') {
        // Using Person table data
        formDataToSet = {
          contact_id: rukun.id,
          status: statusToUse,
          Name: dataToUse.name || '',
          Father_Name: dataToUse.parent || '',
          date_of_birth: dataToUse.dob || '',
          Phone_Number: dataToUse.phone || '',
          Email: dataToUse.email || '',
          Address: dataToUse.address || '',
          Profession: dataToUse.profession || '',
          Education: dataToUse.education || '',
          Additional_Phones: (dataToUse.additional_phone_numbers && dataToUse.additional_phone_numbers.length > 0 ? dataToUse.additional_phone_numbers[0] : ''),
        };
      } else {
        // Using Rukn_Update table data (draft status)
        formDataToSet = {
          contact_id: rukun.id,
          status: statusToUse,
          Name: dataToUse.Name || '',
          Father_Name: dataToUse.Father_Name || '',
          date_of_birth: dataToUse.date_of_birth || '',
          Phone_Number: dataToUse.Phone_Number || '',
          Email: dataToUse.Email || '',
          Address: dataToUse.Address || '',
          Profession: dataToUse.Profession || '',
          Education: dataToUse.Education || '',
          Additional_Phones: dataToUse.Additional_Phones || '',
        };
      }
      
      console.log(`[RukunUpdateScreen] 📋 Final form data (${statusToUse === 'published' ? 'Person Table' : 'Rukn_Update Table'}):`, formDataToSet);
      console.log(`[RukunUpdateScreen] 🔍 Raw data source:`, dataToUse);
      
      // Set form data and log the state change
      setFormData(prevFormData => {
        console.log(`[RukunUpdateScreen] 🔄 Form data state change:`, {
          previous: prevFormData,
          new: formDataToSet,
          changed: JSON.stringify(prevFormData) !== JSON.stringify(formDataToSet)
        });
        return { ...formDataToSet }; // Create a new object to force re-render
      });
      
      // Set additional phone based on source
      let additionalPhoneValue = '';
      if (statusToUse === 'published') {
        // From Person table
        additionalPhoneValue = (dataToUse.additional_phone_numbers && dataToUse.additional_phone_numbers.length > 0 ? dataToUse.additional_phone_numbers[0] : '');
      } else {
        // From Rukn_Update table
        additionalPhoneValue = dataToUse.Additional_Phones || '';
      }
      setAdditionalPhone(additionalPhoneValue);
      
      console.log(`[RukunUpdateScreen] ✅ Form population completed`);
      
      // Debug: Log current form state after a brief delay to ensure state has updated
      setTimeout(() => {
        console.log(`[RukunUpdateScreen] 🔍 Current form state after population:`, formData);
      }, 100);
    } else {
      console.log(`[RukunUpdateScreen] ⚠️ No data available to populate form`);
    }
  }, [person, existingRequest, rukun?.id]);
  
  // Hide the header
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });
      return () => {
        // Cleanup if needed
      };
    }, [navigation])
  );
  
  // Handle form input changes
  const handleChange = (field: keyof RukunUpdateRequest, value: string) => {
    console.log(`[RukunUpdateScreen] 📝 Field changed: ${field} = "${value}"`);
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
  
  // Handle additional phone number
  const handleAdditionalPhoneChange = (value: string) => {
    console.log(`[RukunUpdateScreen] 📞 Additional phone changed: "${value}"`);
    setAdditionalPhone(value);
    
    // Update form data
    setFormData(prev => ({ ...prev, Additional_Phones: value }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    console.log(`[RukunUpdateScreen] 🔍 Starting form validation...`);
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.Name?.trim()) {
      newErrors.Name = i18n.t('field_required');
      console.log(`[RukunUpdateScreen] ❌ Validation error: Name is required`);
    }
    if (!formData.Phone_Number?.trim()) {
      newErrors.Phone_Number = i18n.t('field_required');
      console.log(`[RukunUpdateScreen] ❌ Validation error: Phone Number is required`);
    }
    
    // Email validation (if provided)
    if (formData.Email && formData.Email.trim() && !/\S+@\S+\.\S+/.test(formData.Email)) {
      newErrors.Email = i18n.t('email_format_invalid');
      console.log(`[RukunUpdateScreen] ❌ Validation error: Invalid email format`);
    }
    
    // Phone validation
    if (formData.Phone_Number && formData.Phone_Number.trim() && !/^\+?[\d\s\-\(\)]+$/.test(formData.Phone_Number)) {
      newErrors.Phone_Number = i18n.t('phone_format_invalid');
      console.log(`[RukunUpdateScreen] ❌ Validation error: Invalid phone format`);
    }
    
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`[RukunUpdateScreen] ${isValid ? '✅' : '❌'} Validation result:`, { 
      isValid, 
      errorCount: Object.keys(newErrors).length,
      errors: newErrors 
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    console.log(`[RukunUpdateScreen] 🚀 Starting form submission...`);
    console.log(`[RukunUpdateScreen] 📝 Current form data:`, formData);
    console.log(`[RukunUpdateScreen] 📞 Additional phone:`, additionalPhone);
    
    if (!validateForm()) {
      console.log(`[RukunUpdateScreen] ❌ Form validation failed`);
      Alert.alert(i18n.t('error'), i18n.t('missing_required_fields'));
      return;
    }
    
    console.log(`[RukunUpdateScreen] ✅ Form validation passed`);
    
    try {
      setIsSubmitting(true);
      console.log(`[RukunUpdateScreen] 📤 Preparing to submit request...`);
      
      // Prepare the final data for submission
      const submissionData: RukunUpdateRequest = {
        ...formData,
        Additional_Phones: additionalPhone, // Use the current additional phone value
        status: formData.status || 'draft', // Ensure status is set
      };
      
      console.log(`[RukunUpdateScreen] 📋 Final submission data:`, submissionData);
      console.log(`[RukunUpdateScreen] � Existing request info:`, {
        hasExistingRequest: !!existingRequest,
        existingRequestId: existingRequest?.id,
        existingRequestStatus: existingRequest?.status,
        note: 'API layer will automatically handle update vs create'
      });
      
      // Submit the actual API request
      console.log(`[RukunUpdateScreen] 📡 Dispatching submitRukunUpdateRequest...`);
      const result = await dispatch(submitRukunUpdateRequest(submissionData));
      
      if (submitRukunUpdateRequest.fulfilled.match(result)) {
        console.log(`[RukunUpdateScreen] ✅ Request submitted successfully:`, result.payload);
        
        Alert.alert(
          i18n.t('success'),
          i18n.t('update_request_submitted'),
          [
            {
              text: i18n.t('ok'),
              onPress: () => {
                console.log(`[RukunUpdateScreen] 🔙 Navigating back after successful submission...`);
                navigation.goBack();
              },
            }
          ]
        );
      } else {
        console.log(`[RukunUpdateScreen] ❌ Request submission failed:`, result.payload);
        throw new Error(result.payload as string || 'Failed to submit request');
      }
    } catch (error) {
      console.error(`[RukunUpdateScreen] ❌ Error submitting Rukun Update Request:`, error);
      Alert.alert(
        i18n.t('error'),
        typeof error === 'string' ? error : i18n.t('update_request_failed')
      );
    } finally {
      setIsSubmitting(false);
      console.log(`[RukunUpdateScreen] 🏁 Form submission process completed`);
    }
  };
  
  // Handle back button press
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  // Clean up status when component unmounts (temporarily disabled)
  // useEffect(() => {
  //   return () => {
  //     dispatch(resetRukunUpdateStatus());
  //   };
  // }, [dispatch]);
  
  // Determine if form is editable based on status
  const isEditable = useMemo(() => {
    return formData.status !== 'published';
  }, [formData.status]);
  
  // Status message
  const statusMessage = useMemo(() => {
    switch (formData.status) {
      case 'published':
        return i18n.t('request_published');
      case 'draft':
      default:
        return i18n.t('all_fields_editable');
    }
  }, [formData.status]);
  
  // Show loading indicator during API operations
  const isLoading = personStatus === 'loading' || isSubmitting;
  
  // Debug: Log current form data on every render
  console.log(`[RukunUpdateScreen] 🎯 Current form data on render:`, {
    Name: formData.Name,
    Father_Name: formData.Father_Name,
    Phone_Number: formData.Phone_Number,
    Email: formData.Email,
    Address: formData.Address,
    status: formData.status
  });
  
  // Create a unique key for form inputs to force re-render when data source changes
  const formKey = useMemo(() => {
    return `${rukun?.id}-${existingRequest?.status || 'no-request'}-${existingRequest?.id || 'new'}`;
  }, [rukun?.id, existingRequest?.status, existingRequest?.id]);
  
  // Show loading if we're still fetching data and don't have the required data yet
  if (personStatus === 'loading' && !person && !existingRequest) {
    return (
      <View style={[styles.flex1, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading_request')}</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex1}
    >
      <View style={styles.root}>
        {/*──────────── Header (wave + avatar) ────────────*/}
        <ProfileHeader
          title={i18n.t('rukun_update_request')}
          backgroundSource={COMMON_IMAGES.profileBackground}
          avatarSource={
            displayPerson?.picture
              ? { uri: getImageUrl(displayPerson.picture) }
              : require('@/assets/images/avatar.png')
          }
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
          {/* Status Message */}
          <View style={styles.statusContainer}>
            <UrduText style={[
              styles.statusText,
              formData.status === 'published' ? styles.publishedStatus : styles.draftStatus
            ]}>
              {statusMessage}
            </UrduText>
            
            {/* Debug info - remove in production */}
            {__DEV__ && (
              <Text style={styles.debugText}>
                Data Source: {existingRequest && existingRequest.status !== 'published' ? 'Rukun Update Request' : 'Person Table'}
                {existingRequest && ` | Request Status: ${existingRequest.status}`}
              </Text>
            )}
          </View>
          
          
          {/* Name */}
          <FormInput
            key={`name-${formKey}`}
            inputTitle={i18n.t('name')}
            value={formData.Name || ''}
            onChange={(value) => handleChange('Name', value)}
            placeholder={i18n.t('enter_name')}
            error={errors.Name}
            required
            editable={isEditable}
            disabled={!isEditable}
          />
          
          {/* Father Name */}
          <FormInput
            key={`father-${formKey}`}
            inputTitle={i18n.t('father_name')}
            value={formData.Father_Name || ''}
            onChange={(value) => handleChange('Father_Name', value)}
            placeholder={i18n.t('enter_parent_name')}
            editable={isEditable}
            disabled={!isEditable}
          />
          
          {/* Date of Birth */}
          <FormInput
            inputTitle={i18n.t('date_of_birth')}
            value={formData.date_of_birth || ''}
            onChange={(value) => handleChange('date_of_birth', value)}
            placeholder="YYYY-MM-DD"
            editable={isEditable}
            disabled={!isEditable}
          />
          
          {/* Phone Number */}

          <FormInput
            key={`phone-${formKey}`}
            inputTitle={i18n.t('phone_number')}
            value={formData.Phone_Number || ''}
            onChange={(value) => handleChange('Phone_Number', value)}
            placeholder={i18n.t('enter_phone')}
            keyboardType="phone-pad"
            maxLength={15} // Allow for formatting characters like +, -, spaces
            error={errors.Phone_Number}
            editable={isEditable}
            disabled={!isEditable}
            helpText="Maximum 11 digits allowed"
          />
          
          {/* Email */}
          <FormInput
            inputTitle={i18n.t('email')}
            value={formData.Email || ''}
            onChange={(value) => handleChange('Email', value)}
            placeholder={i18n.t('enter_email')}
            keyboardType="email-address"
            error={errors.Email}
            editable={isEditable}
            disabled={!isEditable}
          />
          
          {/* Address */}
          <FormInput
            inputTitle={i18n.t('address')}
            value={formData.Address || ''}
            onChange={(value) => handleChange('Address', value)}
            placeholder={i18n.t('enter_address')}
            multiline={true}
            numberOfLines={3}
            editable={isEditable}
            disabled={!isEditable}
          />
          
          {/* Profession */}
          <FormInput
            inputTitle={i18n.t('profession')}
            value={formData.Profession || ''}
            onChange={(value) => handleChange('Profession', value)}
            placeholder={i18n.t('profession')}
            editable={isEditable}
            disabled={!isEditable}
          />
          
          {/* Education */}
          <FormInput
            inputTitle={i18n.t('education')}
            value={formData.Education || ''}
            onChange={(value) => handleChange('Education', value)}
            placeholder={i18n.t('education')}
            editable={isEditable}
            disabled={!isEditable}
          />
          
          {/* Additional Phone Number */}
          <FormInput
            inputTitle={i18n.t('additional_phones')}
            value={additionalPhone}
            onChange={handleAdditionalPhoneChange}
            placeholder={i18n.t('enter_phone')}
            keyboardType="phone-pad"
            maxLength={15} // Allow for formatting characters like +, -, spaces
            error={errors.Additional_Phones}
            editable={isEditable}
            disabled={!isEditable}
            helpText="Maximum 11 digits allowed"
          />
          
          {/* Submit Button */}
          {isEditable && (
            <View style={styles.submitContainer}>
              <CustomButton
                text={isSubmitting ? i18n.t('submitting_request') : i18n.t('submit_request')}
                onPress={handleSubmit}
                viewStyle={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                textStyle={styles.submitButtonText}
                disabled={isSubmitting || isLoading}
              />
            </View>
          )}
          
          {/* Published Status Message */}
          {formData.status === 'published' && (
            <View style={styles.publishedMessageContainer}>
              <UrduText style={styles.publishedMessage}>
                {i18n.t('view_only_published')}
              </UrduText>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ──────────── Styles ────────────*/
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  root: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },

  /* scroll */
  scrollWrapper: { marginTop: AVATAR_SIZE / 2 + 20 },
  scrollContent: { paddingBottom: 40, paddingHorizontal: SPACING.md },

  /* Status */
  statusContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'JameelNooriNastaleeq',
  },
  draftStatus: { color: COLORS.textSecondary },
  publishedStatus: { color: '#34C759' }, // Green
  debugText: {
    fontSize: 12,
    color: '#666',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },



  /* Submit */
  submitContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
  },

  /* Published Message */
  publishedMessageContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  publishedMessage: {
    fontSize: 14,
    color: '#1D4ED8',
    textAlign: 'center',
    fontFamily: 'JameelNooriNastaleeq',
  },

  /* Loading */
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'JameelNooriNastaleeq',
  },

  /* Error */
  errorText: {
    fontSize: 16,
    color: COLORS.error || '#FF3B30',
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: 'JameelNooriNastaleeq',
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'JameelNooriNastaleeq',
  },
});