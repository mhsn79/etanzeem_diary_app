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
import { formatUnitName } from '@/app/utils/formatUnitName';

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
    tanzeemiUnit: '',
    notes: '',
    attendance: '',
    reportingMonth: '',
    reportingYear: '',
  });
  

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Tanzeem selectors (moved up to be available for state initialization)
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const userTanzeemiLevelDetails = useAppSelector(selectUserTanzeemiLevelDetails);
  const allTanzeemiUnits = useAppSelector(selectAllTanzeemiUnits);
  const childUnits = useAppSelector(selectChildUnits(userUnitDetails?.id || 0));
  const levelsById = useAppSelector(selectLevelsById);
  
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [showCustomLocationInput, setShowCustomLocationInput] = useState(false);
  const [customLocationText, setCustomLocationText] = useState('');
  
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

  // Set initial tanzeemi unit to current user's unit
  useEffect(() => {
    if (userUnitDetails?.id && !isEditMode) {
      setActivityDetails(prev => ({
        ...prev,
        tanzeemiUnit: String(userUnitDetails.id)
      }));
    }
  }, [userUnitDetails, isEditMode]);

  // Auto-fill reporting month and year for report mode or past published activities
  useEffect(() => {
    if ((mode === 'report' || (isEditMode && activity && isPastActivity(activity) && activity.status === 'published')) && selectedActivityDate) {
      const month = selectedActivityDate.getMonth() + 1;
      const year = selectedActivityDate.getFullYear();
      
      setActivityDetails(prev => ({
        ...prev,
        reportingMonth: String(month),
        reportingYear: String(year),
      }));
    }
  }, [mode, selectedActivityDate, isEditMode, activity]);
  
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
      console.log('Available unit data:', {
        userUnitDetails: userUnitDetails ? { id: userUnitDetails.id, name: formatUnitName(userUnitDetails) } : null,
        childUnits: childUnits?.map(unit => ({ id: unit.id, name: formatUnitName(unit) })) || [],
        activityLocation: activity.location
      });
      
      // Always update the form fields when in edit mode and activity is available
      // This ensures the form is populated correctly
      
      // Set activity date
      if (activity.activity_date_and_time) {
        setSelectedActivityDate(new Date(activity.activity_date_and_time));
      }
      
      // Handle location - check if it's a custom location or unit ID
      let locationValue = '';
      let locationLabelValue = '';
      let shouldShowCustomInput = false;
      let customText = '';
      
      if (activity.location) {
        // Check if the location is a unit ID (numeric) or custom text
        const isUnitId = !isNaN(Number(activity.location)) && activity.location !== '';
        
        console.log('Location analysis:', {
          location: activity.location,
          isUnitId: isUnitId,
          numericValue: Number(activity.location)
        });
        
        if (isUnitId) {
          // It's a unit ID, find the corresponding label
          locationValue = String(activity.location); // Convert to string to match dropdown values
          const unitId = Number(activity.location);
          
          console.log('Looking for unit ID:', unitId);
          
          // Check if it's the current user's unit
          if (userUnitDetails && userUnitDetails.id === unitId) {
            const levelName = userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '';
            const unitName = formatUnitName(userUnitDetails);
            locationLabelValue = levelName ? `${levelName}: ${unitName}` : unitName;
            console.log('Found as user unit:', locationLabelValue);
          } else {
            // Check if it's a child unit
            const childUnit = childUnits?.find(unit => unit.id === unitId);
            if (childUnit) {
              const childLevelId = childUnit.level_id || childUnit.Level_id;
              let childLevelName = '';
              
              if (childLevelId && levelsById[childLevelId]) {
                childLevelName = levelsById[childLevelId].Name || '';
              } else if (childLevelId) {
                // Use fallback level names
                switch (childLevelId) {
                  case 7:
                    childLevelName = 'وارڈ';
                    break;
                  case 6:
                    childLevelName = 'یوسی';
                    break;
                  case 4:
                    childLevelName = 'زون';
                    break;
                  case 3:
                    childLevelName = 'حلقہ';
                    break;
                  default:
                    childLevelName = `${childLevelId}`;
                }
              }
              
              const unitName = formatUnitName(childUnit);
              locationLabelValue = childLevelName ? `${childLevelName}: ${unitName}` : unitName;
              console.log('Found as child unit:', locationLabelValue);
            } else {
              // Unit not found in current data, but it's still a unit ID
              // Don't treat it as custom, just use the ID as fallback
              locationLabelValue = `Unit ${unitId}`;
              console.log('Unit not found, using fallback:', locationLabelValue);
            }
          }
        } else {
          // It's not a numeric ID, but it might be a unit label that was saved as text
          // Check if it matches any of the available unit labels
          const matchingUnit = locationOptions.find(option => option.label === activity.location);
          
          if (matchingUnit && matchingUnit.value !== 'custom') {
            // It matches a unit label, treat it as a unit selection
            locationValue = matchingUnit.value;
            locationLabelValue = matchingUnit.label;
            console.log('Found matching unit label:', locationLabelValue);
          } else {
            // It's a custom location
            locationValue = 'custom';
            locationLabelValue = activity.location;
            shouldShowCustomInput = true;
            customText = activity.location;
            console.log('Treating as custom location:', customText);
          }
        }
      }
      
      console.log('Final location state:', {
        locationValue,
        locationLabelValue,
        shouldShowCustomInput,
        customText
      });
      
      // Set activity details
      setActivityDetails({
        activityType: activity.activity_type ? String(activity.activity_type) : '',
        location: locationValue,
        locationLabel: locationLabelValue,
        tanzeemiUnit: activity.tanzeemi_unit ? String(activity.tanzeemi_unit) : '',
        notes: activity.activity_details || '',
        attendance: activity.attendance ? String(activity.attendance) : '',
        reportingMonth: activity.report_month ? String(activity.report_month) : '',
        reportingYear: activity.report_year ? String(activity.report_year) : '',
      });
      
      // Set custom location state
      setShowCustomLocationInput(shouldShowCustomInput);
      setCustomLocationText(customText);
      
      // Set loading to false since we have the data
      setIsLoading(false);
    }
  // Only include stable dependencies to prevent infinite loops
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
      userTanzeemiLevelName: userTanzeemiLevelDetails?.Name,
      childUnitsLevelIds: childUnits?.map(unit => unit.level_id || unit.Level_id) || [],
      activityTypes: activityTypes.map(type => ({ id: type.id, name: type.Name, level_id: type.level_id }))
    });
    
    // Get current unit's level name
    const currentLevelName = userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '';
    
    // Get all child units' level names
    const childLevelNames = childUnits?.map(unit => {
      const childLevelId = unit.level_id || unit.Level_id;
      return childLevelId && levelsById[childLevelId] ? levelsById[childLevelId].Name : '';
    }).filter(Boolean) || [];
    
    // Combine current level and child levels
    const allowedLevelNames = [currentLevelName, ...childLevelNames].filter(Boolean);
    
    console.log('Allowed level names for filtering:', allowedLevelNames);
    
    // Filter activity types by level names in their titles
    const filteredTypes = activityTypes.filter(type => {
      const typeName = type.Name || '';
      
      // Check if the activity type name contains any of the allowed level names
      const matchesLevel = allowedLevelNames.some(levelName => 
        typeName.includes(levelName)
      );
      
      // Also include generic activity types that don't specify a level
      const isGeneric = !typeName.includes('(') && !typeName.includes('حلقہ') && !typeName.includes('یوسی') && !typeName.includes('زون');
      
      console.log(`Activity type "${typeName}" - Matches level: ${matchesLevel}, Is generic: ${isGeneric}`);
      
      return matchesLevel || isGeneric;
    });
    
    console.log(`Filtered ${filteredTypes.length} activity types out of ${activityTypes.length} total`);
    
    const options = filteredTypes.map((type) => ({
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
  }, [activityTypes, userUnitDetails, childUnits, userTanzeemiLevelDetails, levelsById]);

  // Create tanzeemi unit options
  const tanzeemiUnitOptions = React.useMemo(() => {
    const options = [];
    
    // Add current unit
    if (userUnitDetails) {
      const levelName = userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '';
      const unitName = formatUnitName(userUnitDetails);
      const label = levelName ? `${levelName}: ${unitName}` : unitName;
      
      options.push({
        id: String(userUnitDetails.id),
        label: label,
        value: String(userUnitDetails.id),
      });
    }
    
    // Add child units if they exist
    if (childUnits && childUnits.length > 0) {
      childUnits.forEach(unit => {
        const childLevelId = unit.level_id || unit.Level_id;
        let childLevelName = '';
        
        if (childLevelId && levelsById[childLevelId]) {
          childLevelName = levelsById[childLevelId].Name || '';
        }
        
        const unitName = formatUnitName(unit);
        const label = childLevelName ? `${childLevelName}: ${unitName}` : unitName;
        
        options.push({
          id: String(unit.id),
          label: label,
          value: String(unit.id),
        });
      });
    }
    
    return options;
  }, [userUnitDetails, childUnits, userTanzeemiLevelDetails, levelsById]);

  // Urdu month names for reporting
  const urduMonths = [
    { id: '1', label: 'جنوری', value: '1' },
    { id: '2', label: 'فروری', value: '2' },
    { id: '3', label: 'مارچ', value: '3' },
    { id: '4', label: 'اپریل', value: '4' },
    { id: '5', label: 'مئی', value: '5' },
    { id: '6', label: 'جون', value: '6' },
    { id: '7', label: 'جولائی', value: '7' },
    { id: '8', label: 'اگست', value: '8' },
    { id: '9', label: 'ستمبر', value: '9' },
    { id: '10', label: 'اکتوبر', value: '10' },
    { id: '11', label: 'نومبر', value: '11' },
    { id: '12', label: 'دسمبر', value: '12' },
  ];

  // Generate year options (current year and 2 past years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { id: String(currentYear - 2), label: String(currentYear - 2), value: String(currentYear - 2) },
    { id: String(currentYear - 1), label: String(currentYear - 1), value: String(currentYear - 1) },
    { id: String(currentYear), label: String(currentYear), value: String(currentYear) },
  ];

  // Create location options with current and child units
  const locationOptions = React.useMemo(() => {
    console.log('Location options creation:', {
      userUnitDetails: userUnitDetails ? { id: userUnitDetails.id, name: formatUnitName(userUnitDetails), level_id: userUnitDetails.level_id || userUnitDetails.Level_id } : null,
      childUnitsCount: childUnits?.length || 0,
      childUnits: childUnits?.map(unit => ({ id: unit.id, name: formatUnitName(unit), level_id: unit.level_id || unit.Level_id })) || [],
      userTanzeemiLevelDetails: userTanzeemiLevelDetails ? { id: userTanzeemiLevelDetails.id, name: userTanzeemiLevelDetails.Name } : null,
      levelsById: Object.keys(levelsById).length,
      availableLevelIds: Object.keys(levelsById),
      levelsByIdData: levelsById
    });
    
    const options = [];
    
    // Add current unit
    if (userUnitDetails) {
      const levelName = userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '';
      const unitName = formatUnitName(userUnitDetails);
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
        } else if (childLevelId) {
          // If level is not in levelsById, try to get it from the API or use a fallback
          console.log(`Level ID ${childLevelId} not found in levelsById, using fallback`);
          // For now, we'll use a fallback based on the level ID
          switch (childLevelId) {
            case 7:
              childLevelName = 'وارڈ';
              break;
            case 6:
              childLevelName = 'یوسی';
              break;
            case 4:
              childLevelName = 'زون';
              break;
            case 3:
              childLevelName = 'حلقہ';
              break;
            default:
              childLevelName = `${childLevelId}`;
          }
        }
        
        const unitName = formatUnitName(unit);
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
    
    // Add custom location option
    options.push({
      id: 'custom',
      label: 'دیگر',
      value: 'custom',
    });
    
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

  const isPastActivity = (activity: any) => {
    if (!activity.activity_date_and_time) return false;
    const activityDate = new Date(activity.activity_date_and_time);
    const now = new Date();
    return activityDate < now;
  };

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
    if (option.value === 'custom') {
      setShowCustomLocationInput(true);
      setActivityDetails((prev) => ({
        ...prev,
        location: 'custom',
        locationLabel: '',
      }));
    } else {
      setShowCustomLocationInput(false);
      setCustomLocationText('');
      setActivityDetails((prev) => ({
        ...prev,
        location: option.value,
        locationLabel: option.label,
      }));
    }
  };

  const selectTanzeemiUnit = (option: { id: string; label: string; value: string }) => {
    console.log('Tanzeemi unit selected:', option);
    setActivityDetails((prev) => ({
      ...prev,
      tanzeemiUnit: option.value,
    }));
  };

  const selectAttendance = (value: string) => {
    setActivityDetails((prev) => ({
      ...prev,
      attendance: value,
    }));
  };

  const selectReportingMonth = (option: { id: string; label: string; value: string }) => {
    setActivityDetails((prev) => ({
      ...prev,
      reportingMonth: option.value,
    }));
  };

  const selectReportingYear = (option: { id: string; label: string; value: string }) => {
    setActivityDetails((prev) => ({
      ...prev,
      reportingYear: option.value,
    }));
  };

  const handleCustomLocationSubmit = (customText: string) => {
    setCustomLocationText(customText);
    setActivityDetails((prev) => ({
      ...prev,
      location: 'custom',
      locationLabel: customText,
    }));
  };

  const handleCustomLocationChange = (text: string) => {
    setCustomLocationText(text);
    setActivityDetails((prev) => ({
      ...prev,
      location: 'custom',
      locationLabel: text,
    }));
  };

  const validateForm = () => {
    if (!selectedActivityDate) {
      return 'براہ کرم تاریخ اور وقت منتخب کریں۔';
    }
    if (!activityDetails.activityType) {
      return 'براہ کرم سرگرمی کی قسم منتخب کریں۔';
    }
    if (!activityDetails.tanzeemiUnit) {
      return 'براہ کرم تنظیمی یونٹ منتخب کریں۔';
    }
    if (!activityDetails.location) {
      return 'براہ کرم جگہ منتخب کریں۔';
    }
    if (activityDetails.location === 'custom' && !activityDetails.locationLabel) {
      return 'براہ کرم دیگر جگہ کی تفصیل درج کریں۔';
    }
    
    // Additional validation for report mode or past published activities
    if (mode === 'report' || (isEditMode && activity && isPastActivity(activity) && activity.status === 'published')) {
      if (!activityDetails.attendance) {
        return 'براہ کرم حاضری کی تعداد درج کریں۔';
      }
      if (!activityDetails.reportingMonth) {
        return 'براہ کرم رپورٹنگ کا مہینہ منتخب کریں۔';
      }
      if (!activityDetails.reportingYear) {
        return 'براہ کرم رپورٹنگ کا سال منتخب کریں۔';
      }
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
    
    // Determine what to save for location
    let locationToSave = '';
    if (activityDetails.location === 'custom') {
      // For custom locations, save the custom text
      locationToSave = activityDetails.locationLabel;
    } else {
      // For unit locations, save the unit ID
      locationToSave = activityDetails.location;
    }
    
    // Determine status and reporting details based on mode
    let status = 'draft';
    let reportMonth = activityDate.getMonth() + 1; // Default from activity date
    let reportYear = activityDate.getFullYear(); // Default from activity date
    let attendance = null;
    
    if (mode === 'report') {
      status = 'published';
      reportMonth = parseInt(activityDetails.reportingMonth);
      reportYear = parseInt(activityDetails.reportingYear);
      attendance = parseInt(activityDetails.attendance);
    } else if (isEditMode) {
      status = activity?.status || 'draft';
      // For past published activities, include completion fields
      if (activity && isPastActivity(activity) && activity.status === 'published') {
        reportMonth = parseInt(activityDetails.reportingMonth);
        reportYear = parseInt(activityDetails.reportingYear);
        attendance = parseInt(activityDetails.attendance);
      }
    }
    
    const payload = {
      activity_type: Number(activityDetails.activityType),
      activity_date_and_time: activityDate.toISOString(),
      activity_details: activityDetails.notes,
      location: locationToSave,
      tanzeemi_unit: Number(activityDetails.tanzeemiUnit),
      status: status,
      report_month: reportMonth,
      report_year: reportYear,
      attendance: attendance,
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
    <ScreenLayout title={getScreenTitle()} onBack={navigateBack}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={true}
        >
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
              options={tanzeemiUnitOptions}
              onSelect={selectTanzeemiUnit}
              dropdownTitle="تنظیمی یونٹ"
              placeholder="تنظیمی یونٹ منتخب کریں"
              selectedValue={activityDetails.tanzeemiUnit}
              dropdownContainerStyle={styles.dropdownContainer}
              disabled={childUnits && childUnits.length === 0}
            />
            
            <CustomDropdown
              options={locationOptions}
              onSelect={selectLocation}
              dropdownTitle="جگہ"
              placeholder="جگہ منتخب کریں"
              selectedValue={activityDetails.location}
              dropdownContainerStyle={styles.dropdownContainer}
            />
            
            {showCustomLocationInput && (
              <FormInput
                inputTitle="دیگر جگہ"
                value={customLocationText}
                onChange={handleCustomLocationChange}
                placeholder="دیگر جگہ کی تفصیل"
                multiline={true}
                numberOfLines={3}
                rightIcon={
                  <TouchableOpacity 
                    onPress={() => {
                      setShowCustomLocationInput(false);
                      setCustomLocationText('');
                      setActivityDetails((prev) => ({
                        ...prev,
                        location: '',
                        locationLabel: '',
                      }));
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                }
              />
            )}
            
            <FormInput
              inputTitle="سرگرمی کی تفصیل"
              value={activityDetails.notes}
              onChange={updateActivityField('notes')}
              placeholder="سرگرمی کی تفصیل"
              multiline={true}
              numberOfLines={3}
            />
            
            {/* Completion fields for report mode or past published activities */}
            {(mode === 'report' || (isEditMode && activity && isPastActivity(activity) && activity.status === 'published')) && (
              <>
                <FormInput
                  inputTitle="حاضری کی تعداد"
                  value={activityDetails.attendance}
                  onChange={selectAttendance}
                  placeholder="حاضری کی تعداد درج کریں"
                  keyboardType="numeric"
                  required
                />
                
                <CustomDropdown
                  options={urduMonths}
                  onSelect={selectReportingMonth}
                  dropdownTitle="رپورٹنگ کا مہینہ"
                  placeholder="مہینہ منتخب کریں"
                  selectedValue={activityDetails.reportingMonth}
                  dropdownContainerStyle={styles.dropdownContainer}
                />
                
                <CustomDropdown
                  options={yearOptions}
                  onSelect={selectReportingYear}
                  dropdownTitle="رپورٹنگ کا سال"
                  placeholder="سال منتخب کریں"
                  selectedValue={activityDetails.reportingYear}
                  dropdownContainerStyle={styles.dropdownContainer}
                />
              </>
            )}
            
            {/* Spacer to ensure content doesn't get hidden behind sticky button */}
            <View style={styles.bottomSpacer} />
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
      </View>
      
      <Dialog
        visible={showConfirmDialog}
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowConfirmDialog(false)}
        title={isEditMode ? "سرگرمی اپڈیٹ کرنے کی تصدیق" : "سرگرمی جمع کروانے کی تصدیق"}
        description={isEditMode 
          ? "کیا آپ واقعاً اس سرگرمی کو اپڈیٹ کرنا چاہتے ہیں؟"
          : "کیا اس سرگرمی کی رپورٹ محفوظ کر لیں؟"
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
          ? "آپ کی سرگرمی اپڈیٹ کر دی گئی ہے!" 
          : "آپ کی سرگرمی جمع کر دی گئی ہے!"
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 4, // Increased padding to account for sticky button height
  },
  content: {
    // Content styling if needed
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
    marginBottom: SPACING.sm,
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
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md, // Extra padding for iOS safe area
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  customLocationContainer: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  closeCustomLocationButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 1,
  },
  bottomSpacer: {
    height: SPACING.xl * 2, // Adjust as needed to create space
  },
});

export default ActivityScreen;