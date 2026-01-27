import React, { useState, useEffect } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import i18n from '../i18n';
import CustomButton from '../components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectUserDetails, selectUserDetailsStatus } from '@/app/features/persons/personSlice';
import { COLORS } from '@/app/constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';

export default function ProfileEdit() {
  const insets = useSafeAreaInsets();
  
  // Get user details from Redux store
  const userDetails = useSelector(selectUserDetails);
  const userDetailsStatus = useSelector(selectUserDetailsStatus);
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    name: '',
    parent: '',
    dob: '',
    cnic: '',
    unit: '',
    status: '',
    phone: '',
    whatsApp: '',
    email: '',
  });
  
  // Update form data when userDetails changes
  useEffect(() => {
    if (userDetails) {
      setFormData({
        name: userDetails.Name || userDetails.name || '',
        parent: userDetails.Father_Name || userDetails.parent || '',
        dob: userDetails.Date_of_birth || userDetails.dob || '',
        cnic: userDetails.CNIC || userDetails.cnic || '',
        unit: userDetails.Tanzeemi_Unit?.toString() || userDetails.unit?.toString() || '',
        status: userDetails.status || '',
        phone: userDetails.Phone_Number || userDetails.phone || '',
        whatsApp: userDetails.additional_phones || '',
        email: userDetails.Email || userDetails.email || '',
      });
    }
  }, [userDetails]);

  const handlePictureUpdate = () => {
    // Image upload functionality would go here
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = () => {
    // Save functionality would go here
    console.log('Saving profile data:', formData);
    router.back();
  };

  // Show loading indicator when initially loading
  if (userDetailsStatus === 'loading' && !userDetails) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t('loading_profile')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('profile')}</Text>
        </View>

        <View style={[{ direction: i18n.locale === 'ur' ? 'rtl' : 'ltr' }]}>
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/avatar.png')}
              style={styles.logo}
            />
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.nameStyle}>{formData.name}</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>{i18n.t('personal_information')}</Text>
            
            <Text style={styles.textItem}>{i18n.t('name')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder={i18n.t('name')}
            />
            
            <Text style={styles.textItem}>{i18n.t('parent')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.parent}
              onChangeText={(value) => handleInputChange('parent', value)}
              placeholder={i18n.t('parent')}
            />
            
            <Text style={styles.textItem}>{i18n.t('dob')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.dob}
              onChangeText={(value) => handleInputChange('dob', value)}
              placeholder={i18n.t('dob')}
            />
            
            <Text style={styles.textItem}>{i18n.t('cnic')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.cnic}
              onChangeText={(value) => handleInputChange('cnic', value)}
              placeholder={i18n.t('cnic')}
            />
            
            <Text style={styles.sectionTitle}>{i18n.t('contact_information')}</Text>
            
            <Text style={styles.textItem}>{i18n.t('phone_number')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder={i18n.t('phone_number')}
              keyboardType="phone-pad"
            />
            
            <Text style={styles.textItem}>{i18n.t('whatsapp_number')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.whatsApp}
              onChangeText={(value) => handleInputChange('whatsApp', value)}
              placeholder={i18n.t('whatsapp_number')}
              keyboardType="phone-pad"
            />
            
            <Text style={styles.textItem}>{i18n.t('email')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder={i18n.t('email')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.sectionTitle}>{i18n.t('tanzeemi_information')}</Text>
            
            <Text style={styles.textItem}>{i18n.t('unit')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.unit}
              onChangeText={(value) => handleInputChange('unit', value)}
              placeholder={i18n.t('unit')}
            />
            
            <Text style={styles.textItem}>{i18n.t('status')}</Text>
            <TextInput 
              style={styles.input}
              value={formData.status}
              onChangeText={(value) => handleInputChange('status', value)}
              placeholder={i18n.t('status')}
            />
            
            <View style={styles.buttonContainer}>
              <CustomButton
                text={i18n.t('save')}
                onPress={handleSave}
                viewStyle={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameStyle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 5,
  },
  textItem: {
    color: COLORS.textSecondary,
    fontFamily: "JameelNooriNastaleeq",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
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
  },
});
