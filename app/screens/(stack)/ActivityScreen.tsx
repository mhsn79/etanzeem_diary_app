import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
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
  editActivity,
  fetchActivityById,
  selectCreateActivityStatus,
  selectCreateActivityError,
  selectEditActivityStatus,
  selectEditActivityError,
  selectActivityById,
  getActivityById,
  selectFetchActivityByIdStatus,
  selectFetchActivityByIdError,
} from '@/app/features/activities/activitySlice';
import DateTimePicker from '@/app/components/DateTimePicker';
import {
  selectUserUnitDetails,
  selectUserTanzeemiLevelDetails,
  selectAllTanzeemiUnits,
  selectChildUnits,
  selectLevelsById,
} from '@/app/features/tanzeem/tanzeemSlice';

const ActivityScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const mode = (params.mode || 'schedule') as 'report' | 'schedule' | 'edit';
  const activityId = params.id ? Number(params.id) : undefined;
  const isEditMode = mode === 'edit' && activityId !== undefined;
  
  // Get initial date based on mode
  const getInitialDate = () => {
    if (mode === 'report') return new Date(); // Today for report mode
    if (mode === 'schedule') return new Date(new Date().setDate(new Date().getDate() + 1)); // Tomorrow for schedule mode
    return new Date(); // Default for edit mode (will be overridden)
  };

  // Initialize state with default values
  const [selectedActivityDate, setSelectedActivityDate] = useState<Date | null>(getInitialDate());
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
  const [isLoading, setIsLoading] = useState(isEditMode);
  
  // Redux selectors
  const activityTypes = useAppSelector(selectAllActivityTypes);
  const activityTypesStatus = useAppSelector(selectActivityTypesStatus);
  const activityTypesError = useAppSelector(selectActivityTypesError);
  const createActivityStatus = useAppSelector(selectCreateActivityStatus);
  const createActivityError = useAppSelector(selectCreateActivityError);
  const editActivityStatus = useAppSelector(selectEditActivityStatus);
  const editActivityError = useAppSelector(selectEditActivityError);
  const fetchByIdStatus = useAppSelector(selectFetchActivityByIdStatus);
  const fetchByIdError = useAppSelector(selectFetchActivityByIdError);
  
  // Tanzeem selectors
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const userTanzeemiLevelDetails = useAppSelector(selectUserTanzeemiLevelDetails);
  const allTanzeemiUnits = useAppSelector(selectAllTanzeemiUnits);
  const childUnits = useAppSelector(selectChildUnits(userUnitDetails?.id || 0));
  const levelsById = useAppSelector(selectLevelsById);
  
  // If in edit mode, get the activity from the store
  const activity = isEditMode && activityId ? useAppSelector(getActivityById(activityId)) : null;
  
  // Debug log to track activity data - only log when important values change
  useEffect(() => {
    if (isEditMode) {
      console.log('Activity data changed:', { 
        activityId, 
        activityExists: !!activity,
        fetchByIdStatus,
        fetchByIdError
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, activityId, !!activity, fetchByIdStatus, fetchByIdError]);

  // Fetch activity types on component mount
  useEffect(() => {
    if (activityTypesStatus === 'idle') {
      dispatch(fetchActivityTypes());
    }
  }, [dispatch, activityTypesStatus]);
  
  // Fetch activity data in edit mode - only once when component mounts
  useEffect(() => {
    if (isEditMode && activityId) {
      console.log(`Checking if we need to fetch activity ID: ${activityId}`);
      
      // Set loading state immediately
      setIsLoading(true);
      
      // Check if we already have the activity in the store
      if (activity) {
        console.log('Activity already in store, no need to fetch:', activity);
        setIsLoading(false);
        return;
      }
      
      // If we're already fetching, don't dispatch again
      if (fetchByIdStatus === 'loading') {
        console.log('Already fetching activity, waiting for result...');
        return;
      }
      
      console.log(`Dispatching fetchActivityById for ID: ${activityId}`);
      dispatch(fetchActivityById(activityId))
        .unwrap()
        .then((result) => {
          console.log('Successfully fetched activity:', result);
        })
        .catch((error) => {
          console.error('Failed to fetch activity:', error);
          setValidationError('Failed to fetch activity data');
          setIsLoading(false);
        });
    }
  // Only run this effect once when the component mounts in edit mode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, activityId]);
  
  // Populate form fields when activity data is available in edit mode
  useEffect(() => {
    if (isEditMode && activity) {
      console.log('Populating form with activity data:', activity);
      
      // Always update the form fields when in edit mode and activity is available
      // This ensures the form is populated correctly
      
      // Set activity date
      if (activity.activity_date_and_time) {
        setSelectedActivityDate(new Date(activity.activity_date_and_time));
      }
      
      // Set activity details
      setActivityDetails({
        activityType: activity.activity_type ? String(activity.activity_type) : '',
        location: activity.location || '',
        locationLabel: activity.location || '',
        notes: activity.activity_details || '',
      });
      
      // Set loading to false since we have the data
      setIsLoading(false);
    }
  // Only include dependencies that won't change frequently to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, activity?.id]);

  // Handle activity creation/edit status changes
  useEffect(() => {
    if ((createActivityStatus === 'succeeded' || editActivityStatus === 'succeeded') && isSubmitting) {
      setShowSuccessDialog(true);
      setIsSubmitting(false);
    } else if ((createActivityStatus === 'failed' || editActivityStatus === 'failed') && isSubmitting) {
      setShowConfirmDialog(false);
      setIsSubmitting(false);
    }
  }, [createActivityStatus, createActivityError, editActivityStatus, editActivityError, isSubmitting]);

  // Filter activity types by current unit level and add "دیگر" option
  const filteredActivityTypeOptions = React.useMemo(() => {
    console.log('Activity types filtering:', {
      totalActivityTypes: activityTypes.length,
      userUnitLevelId: userUnitDetails?.level_id || userUnitDetails?.Level_id,
      userUnitLevel: userUnitDetails?.level,
      activityTypes: activityTypes.map(type => ({ id: type.id, name: type.Name }))
    });
    
    // Since level_id doesn't exist in Activity_Type collection, show all activity types
    console.log('Showing all activity types since level_id field is not available');
    const options = activityTypes.map((type) => ({
      id: String(type.id),
      label: type.Name,
      value: String(type.id),
    }));
    
    // Add "دیگر" (Other) option at the end
    options.push({
      id: 'other',
      label: 'دیگر',
      value: 'other',
    });
    
    console.log('Final activity type options:', options.length);
    return options;
  }, [activityTypes]);

  // Create location options with current and child units
  const locationOptions = React.useMemo(() => {
    console.log('Location options creation:', {
      userUnitDetails: userUnitDetails ? { id: userUnitDetails.id, name: userUnitDetails.Name, level_id: userUnitDetails.level_id || userUnitDetails.Level_id } : null,
      childUnitsCount: childUnits?.length || 0,
      childUnits: childUnits?.map(unit => ({ id: unit.id, name: unit.Name, level_id: unit.level_id || unit.Level_id })) || [],
      userTanzeemiLevelDetails: userTanzeemiLevelDetails ? { id: userTanzeemiLevelDetails.id, name: userTanzeemiLevelDetails.Name } : null,
      levelsById: Object.keys(levelsById).length,
      availableLevelIds: Object.keys(levelsById)
    });
    
    const options = [];
    
    // Add current unit
    if (userUnitDetails) {
      const levelName = userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '';
      const unitName = userUnitDetails.Name || userUnitDetails.name || '';
      const label = levelName ? `${levelName}: ${unitName}` : unitName;
      
      options.push({
        id: String(userUnitDetails.id),
        label: label,
        value: String(userUnitDetails.id),
      });
    }
    
    // Add child units with their respective level names
    if (childUnits && childUnits.length > 0) {
      childUnits.forEach(unit => {
        // Get the level details for this specific child unit
        const childLevelId = unit.level_id || unit.Level_id;
        let childLevelName = '';
        
        if (childLevelId && levelsById[childLevelId]) {
          childLevelName = levelsById[childLevelId].Name || '';
        }
        
        const unitName = unit.Name || unit.name || '';
        // If level name is not available, just show the unit name
        const label = childLevelName ? `${childLevelName}: ${unitName}` : unitName;
        
        console.log(`Child unit ${unitName} (ID: ${unit.id}) - Level ID: ${childLevelId}, Level Name: "${childLevelName}", Final Label: "${label}"`);
        
        options.push({
          id: String(unit.id),
          label: label,
          value: String(unit.id),
        });
      });
    }
    
    console.log('Final location options:', options.length);
    return options;
  }, [userUnitDetails, childUnits, userTanzeemiLevelDetails, levelsById]);

  // Auto-populate activity details when activity type changes
  useEffect(() => {
    if (activityDetails.activityType && activityDetails.activityType !== 'other') {
      const selectedType = activityTypes.find(type => String(type.id) === activityDetails.activityType);
      const levelName = userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name;
      
      if (selectedType && levelName) {
        const activityDetailsText = `${selectedType.Name} - ${levelName}`;
        setActivityDetails(prev => ({
          ...prev,
          notes: activityDetailsText,
        }));
      }
    }
  }, [activityDetails.activityType, activityTypes, userTanzeemiLevelDetails]);

  const navigateBack = () => {
    navigation.goBack();
  };

  const handleDateTimeChange = (date: Date) => {
    // Create a new Date object to avoid mutating the original
    const newDate = new Date(date);
    
    // Adjust the date based on mode
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Always set seconds and milliseconds to 0
    newDate.setSeconds(0, 0);
    
    if (mode === 'report' && newDate > new Date()) {
      // For report mode, don't allow future dates
      newDate.setHours(today.getHours(), 0, 0, 0);
    } else if (mode === 'schedule' && isSameDay(newDate, today) && newDate.getHours() <= today.getHours()) {
      // For schedule mode, ensure time is in the future if date is today
      newDate.setHours(today.getHours() + 1, 0, 0, 0);
    }
    
    setSelectedActivityDate(newDate);
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
      status: isEditMode ? (activity?.status || 'draft') : 'draft',
      report_month: reportMonth,
      report_year: reportYear
    };
    
    setIsSubmitting(true);
    
    if (isEditMode && activityId) {
      // Edit existing activity
      dispatch(editActivity({ id: activityId, activityData: payload }));
    } else {
      // Create new activity
      dispatch(createActivity(payload));
    }
  };

  const handleSuccessDialogConfirm = () => {
    setShowSuccessDialog(false);
    navigation.goBack();
  };

  const getScreenTitle = () => {
    if (mode === 'report') return 'سرگرمی رپورٹ فارم';
    if (mode === 'edit') return 'سرگرمی میں ترمیم کریں';
    return 'سرگرمی شیڈول کریں';
  };
  
  const screenTitle = getScreenTitle();

  // Show loading indicator when fetching activity data in edit mode
  if (isLoading && isEditMode) {
    console.log('Showing loading indicator for edit mode');
    return (
      <ScreenLayout title={screenTitle} onBack={navigateBack}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <UrduText style={styles.loadingText}>سرگرمی کی معلومات لوڈ ہو رہی ہیں...</UrduText>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title={screenTitle} onBack={navigateBack}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <DateTimePicker
            key={`date-picker-${selectedActivityDate?.getTime() || 'initial'}`}
            label="تاریخ اور وقت"
            placeholder="تاریخ اور وقت منتخب کریں"
            mode="datetime"
            initialDate={selectedActivityDate || undefined}
            onDateChange={handleDateTimeChange}
            minimumDate={mode === 'schedule' ? new Date() : undefined}
            maximumDate={mode === 'report' ? new Date() : undefined}
            // In edit mode, don't restrict dates
            disabled={isEditMode && activity?.status !== 'draft'}
            useUrduText={true}
            confirmText="منتخب کریں"
            cancelText="منسوخ"
            containerStyle={styles.datePickerContainer}
          />
          
          <CustomDropdown
            options={filteredActivityTypeOptions}
            onSelect={selectActivityType}
            dropdownTitle="سرگرمی کی قسم"
            placeholder="سرگرمی کی قسم منتخب کریں"
            selectedValue={activityDetails.activityType}
            dropdownContainerStyle={styles.dropdownContainer}
            loading={activityTypesStatus === 'loading'}
          />
          
          <CustomDropdown
            options={locationOptions}
            onSelect={selectLocation}
            dropdownTitle="جگہ"
            placeholder="جگہ منتخب کریں"
            selectedValue={activityDetails.location}
            dropdownContainerStyle={styles.dropdownContainer}
          />
          
          <FormInput
            inputTitle="سرگرمی کی تفصیلات"
            value={activityDetails.notes}
            onChange={updateActivityField('notes')}
            placeholder="سرگرمی کی تفصیلات"
            multiline={true}
            numberOfLines={3}
          />
        </View>
      </ScrollView>
      {validationError && (
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>{validationError}</UrduText>
        </View>
      )}
      {createActivityError && createActivityStatus === 'failed' && !isEditMode && (
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>{createActivityError}</UrduText>
        </View>
      )}
      {editActivityError && editActivityStatus === 'failed' && isEditMode && (
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>{editActivityError}</UrduText>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <CustomButton
          text={isEditMode ? "سرگرمی اپڈیٹ کریں" : "سرگرمی جمع کروائیں"}
          onPress={submitActivity}
          viewStyle={[{ backgroundColor: COLORS.primary, flex: 1, marginHorizontal: SPACING.sm }]}
          textStyle={[{ color: COLORS.white }]}
          loading={isEditMode ? editActivityStatus === 'loading' : createActivityStatus === 'loading'}
          disabled={isEditMode ? editActivityStatus === 'loading' : createActivityStatus === 'loading'}
        />
      </View>
      <Dialog
        visible={showConfirmDialog}
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowConfirmDialog(false)}
        title={isEditMode ? "سرگرمی اپڈیٹ کرنے کی تصدیق" : "سرگرمی جمع کروانے کی تصدیق"}
        description={isEditMode 
          ? "کیا آپ واقعاً اس سرگرمی کو اپڈیٹ کرنا چاہتے ہیں؟"
          : "کیا آپ واقعاً اس سرگرمی کو جمع کروانا چاہتے ہیں؟ ایک بار جمع ہونے کے بعد، آپ اسے صرف ایڈمن کی اجازت سے ایڈٹ کر سکیں گے"
        }
        confirmText={isEditMode ? "ہاں، اپڈیٹ کریں" : "ہاں، جمع کروائیں"}
        cancelText="نہیں، واپس جائیں"
        showWarningIcon={true}
      />
      <Dialog
        visible={showSuccessDialog}
        onConfirm={handleSuccessDialogConfirm}
        onClose={() => setShowSuccessDialog(false)}
        title={isEditMode 
          ? "مبارک ہو! آپ کی سرگرمی اپڈیٹ کر دی گئی ہے!" 
          : "مبارک ہو! آپ کی سرگرمی جمع کر دی گئی ہے!"
        }
        description={isEditMode
          ? "آپ کی سرگرمی کامیابی سے اپڈیٹ ہو چکی ہے۔"
          : "آپ کی سرگرمی کامیابی سے سبمٹ ہو چکی ہے۔ آپ چاہیں تو جمع شدہ سرگرمیاں دیکھ سکتے ہیں یا واپس ہوم پیج پر جا سکتے ہیں۔"
        }
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.primary,
    textAlign: 'center',
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