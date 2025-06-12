import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import ScreenLayout from '@/app/components/ScreenLayout';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import CustomDropdown from '@/app/components/CustomDropdown';
import FormInput from '@/app/components/FormInput';
import CustomButton from '@/app/components/CustomButton';
import Dialog from '@/app/components/Dialog';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import {
  fetchActivityTypes,
  selectAllActivityTypes,
  selectActivityTypesStatus,
  selectActivityTypesError,
} from '@/app/features/activityTypes/activityTypesSlice';
import {
  createActivity,
  selectCreateActivityStatus,
  selectCreateActivityError,
} from '@/app/features/activities/activitySlice';
import DateTimePicker from '@/app/components/DateTimePicker';

const ActivityScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const mode = (params.mode || 'schedule') as 'report' | 'schedule';
  const initialDate =
    mode === 'report'
      ? new Date() // Today for report mode
      : new Date(new Date().setDate(new Date().getDate() + 1)); // Tomorrow for schedule mode

  const [selectedActivityDate, setSelectedActivityDate] = useState<Date | null>(initialDate);
  const [activityDetails, setActivityDetails] = useState({
    activityType: '',
    location: '',
    locationLabel: '',
    notes: '',

  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Redux selectors
  const activityTypes = useAppSelector(selectAllActivityTypes);
  const activityTypesStatus = useAppSelector(selectActivityTypesStatus);
  const activityTypesError = useAppSelector(selectActivityTypesError);
  const createActivityStatus = useAppSelector(selectCreateActivityStatus);
  const createActivityError = useAppSelector(selectCreateActivityError);

  // Fetch activity types on component mount
  useEffect(() => {
    if (activityTypesStatus === 'idle') {
      dispatch(fetchActivityTypes());
    }
  }, [dispatch, activityTypesStatus]);

  // Handle activity creation status changes
  useEffect(() => {
    if (createActivityStatus === 'succeeded' && isSubmitting) {
      setShowSuccessDialog(true);
      setIsSubmitting(false);
    } else if (createActivityStatus === 'failed' && isSubmitting) {
      setShowConfirmDialog(false);
      setIsSubmitting(false);
    }
  }, [createActivityStatus, createActivityError, isSubmitting]);

  // Map activity types from API to dropdown options
  const activityTypeOptions = activityTypes.map((type) => ({
    id: String(type.id),
    label: type.Name,
    value: String(type.id),
  }));

  const locationOptions = [
    { id: '1', label: 'پارٹی کا ہیڈ آفس، لاہور', value: '1' },
    { id: '2', label: 'یونین کونسل 1', value: '2' },
    { id: '3', label: 'یونین کونسل 2', value: '3' },
    { id: '4', label: 'یونین کونسل 3', value: '4' },
    { id: '5', label: 'یونین کونسل 4', value: '5' },
    { id: '6', label: 'یونین کونسل 5', value: '6' },
    { id: '7', label: 'یونین کونسل 6', value: '7' },
    { id: '8', label: 'یونین کونسل 7', value: '8' },
    { id: '9', label: 'یونین کونسل 8', value: '9' },
    { id: '10', label: 'یونین کونسل 9', value: '10' },
  ];

  const navigateBack = () => {
    navigation.goBack();
  };

  const handleDateTimeChange = (date: Date) => {
    // Adjust the date based on mode
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Always set seconds and milliseconds to 0
    date.setSeconds(0, 0);
    
    if (mode === 'report' && date > new Date()) {
      // For report mode, don't allow future dates
      date.setHours(today.getHours(), 0, 0, 0);
    } else if (mode === 'schedule' && isSameDay(date, today) && date.getHours() <= today.getHours()) {
      // For schedule mode, ensure time is in the future if date is today
      date.setHours(today.getHours() + 1, 0, 0, 0);
    }
    
    setSelectedActivityDate(date);
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const updateActivityField = (field: string) => (value: string) => {
    setActivityDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectActivityType = (option: { id: string; label: string; value: string }) => {
    setActivityDetails((prev) => ({
      ...prev,
      activityType: option.value,
    }));
  };

  const selectLocation = (option: { id: string; label: string; value: string }) => {
    setActivityDetails((prev) => ({
      ...prev,
      location: option.value,
      locationLabel: option.label,
    }));
  };

  const validateForm = () => {
    if (!selectedActivityDate) {
      return 'براہ کرم تاریخ اور وقت منتخب کریں۔';
    }
    if (!activityDetails.activityType) {
      return 'براہ کرم سرگرمی کی قسم منتخب کریں۔';
    }
    if (!activityDetails.location) {
      return 'براہ کرم جگہ منتخب کریں۔';
    }
    return null;
  };

  const submitActivity = () => {
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    // Get the selected date
    const activityDate = selectedActivityDate!;
    
    // Extract month and year for reporting
    const reportMonth = activityDate.getMonth() + 1; // JavaScript months are 0-indexed
    const reportYear = activityDate.getFullYear();
    
    const payload = {
      activity_type: Number(activityDetails.activityType),
      activity_date_and_time: activityDate.toISOString(),
      activity_details: activityDetails.notes,
      location: activityDetails.locationLabel,
      status: 'draft',
      report_month: reportMonth,
      report_year: reportYear
    };
    console.log('============payloadpayloadpayloadpayloadpayload=============',payload);
    
    setIsSubmitting(true);
    dispatch(createActivity(payload));
  };

  const handleSuccessDialogConfirm = () => {
    setShowSuccessDialog(false);
    navigation.goBack();
  };

  const screenTitle = mode === 'report' ? 'سرگرمی رپورٹ فارم' : 'سرگرمی شیڈول کریں';

  return (
    <ScreenLayout title={screenTitle} onBack={navigateBack}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <DateTimePicker
            label="تاریخ اور وقت"
            placeholder="تاریخ اور وقت منتخب کریں"
            mode="datetime"
            initialDate={selectedActivityDate || undefined}
            onDateChange={handleDateTimeChange}
            minimumDate={mode === 'schedule' ? new Date() : undefined}
            maximumDate={mode === 'report' ? new Date() : undefined}
            useUrduText={true}
            confirmText="منتخب کریں"
            cancelText="منسوخ"
            rightIcon={
              <TouchableOpacity>
                <Ionicons name="calendar" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            }
            containerStyle={styles.datePickerContainer}
          />
          <FormInput
            inputTitle="سرگرمی کا نام"
            value={activityDetails.notes}
            onChange={updateActivityField('notes')}
            placeholder="سرگرمی کا نام منتخب کریں"
          />
          <CustomDropdown
            options={activityTypeOptions}
            onSelect={selectActivityType}
            dropdownTitle="سرگرمی کی وضاحت"
            placeholder="نئے امیدواروں کا انٹرویو، مہم کے منتظمین سے ملاقات"
            selectedValue={activityDetails.activityType}
            dropdownContainerStyle={styles.dropdownContainer}
            loading={activityTypesStatus === 'loading'}
          />
          <CustomDropdown
            options={locationOptions}
            onSelect={selectLocation}
            placeholder="جگہ"
            dropdownTitle="جگہ"
            selectedValue={activityDetails.location}
            dropdownContainerStyle={styles.dropdownContainer}
          />
        </View>
      </ScrollView>
      {validationError && (
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>{validationError}</UrduText>
        </View>
      )}
      {createActivityError && createActivityStatus === 'failed' && (
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>{createActivityError}</UrduText>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <CustomButton
          text="سرگرمی جمع کروائیں"
          onPress={submitActivity}
          viewStyle={[{ backgroundColor: COLORS.primary, flex: 1, marginHorizontal: SPACING.sm }]}
          textStyle={[{ color: COLORS.white }]}
          loading={createActivityStatus === 'loading'}
          disabled={createActivityStatus === 'loading'}
        />
      </View>
      <Dialog
        visible={showConfirmDialog}
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowConfirmDialog(false)}
        title="سرگرمی جمع کروانے کی تصدیق"
        description="کیا آپ واقعاً اس سرگرمی کو جمع کروانا چاہتے ہیں؟ ایک بار جمع ہونے کے بعد، آپ اسے صرف ایڈمن کی اجازت سے ایڈٹ کر سکیں گے"
        confirmText="ہاں، جمع کروائیں"
        cancelText="نہیں، واپس جائیں"
        showWarningIcon={true}
      />
      <Dialog
        visible={showSuccessDialog}
        onConfirm={handleSuccessDialogConfirm}
        onClose={() => setShowSuccessDialog(false)}
        title="مبارک ہو! آپ کی سرگرمی جمع کر دی گئی ہے!"
        description="آپ کی سرگرمی کامیابی سے سبمٹ ہو چکی ہے۔ آپ چاہیں تو جمع شدہ سرگرمیاں دیکھ سکتے ہیں یا واپس ہوم پیج پر جا سکتے ہیں۔"
        confirmText="ٹھیک ہے"
        showSuccessIcon={true}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  datePickerContainer: {
    marginBottom: SPACING.md,
  },
  dropdownContainer: {
    marginBottom: SPACING.md,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error || 'red',
  },
  errorText: {
    color: COLORS.error || 'red',
    textAlign: 'right',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },

});

export default ActivityScreen;