import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, InteractionManager, Pressable } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/src/constants/theme';
import UrduText from '@/src/components/UrduText';
import ScreenLayout from '@/src/components/ScreenLayout';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import CustomDropdown from '@/src/components/CustomDropdown';
import FormInput from '@/src/components/FormInput';
import CustomButton from '@/src/components/CustomButton';
// Dialog removed — inline View overlays used instead (no Modal = no Fabric viewState crash)
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getUrduMonth } from '@/src/constants/urduLocalization';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import {
  fetchActivityTypes,
  selectAllActivityTypes,
  selectActivityTypesStatus,
  selectActivityTypesError,
} from '@/src/features/activityTypes/activityTypesSlice';
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
} from '@/src/features/activities/activitySlice';
import DateTimePicker from '@/src/components/DateTimePicker';
import {
  selectUserUnitDetails,
  selectUserTanzeemiLevelDetails,
  selectAllTanzeemiUnits,
  selectChildUnits,
  selectLevelsById,
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
} from '@/src/features/tanzeem/tanzeemSlice';
import { formatUnitName } from '@/src/utils/formatUnitName';

const ActivityScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const mode = (params.mode || 'schedule') as 'report' | 'schedule' | 'edit';
  const activityId = (params.activityId || params.id) ? Number(params.activityId || params.id) : undefined;
  const isEditMode = mode === 'edit' && activityId !== undefined;
  const presetMonth = params.reportMonth ? String(params.reportMonth) : '';
  const presetYear = params.reportYear ? String(params.reportYear) : '';
  const presetActivityType = params.activityType ? String(params.activityType) : '';
  const editContext = params.editContext ? String(params.editContext) as 'schedule' | 'report' : null;
  
  // Get initial date based on mode and preset period
  const getInitialDate = () => {
    if (presetMonth && presetYear) {
      const m = parseInt(presetMonth, 10);
      const y = parseInt(presetYear, 10);
      const today = new Date();
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0);

      if (mode === 'report') {
        // Use today if within the month, else last day of month
        if (today.getFullYear() === y && today.getMonth() + 1 === m) return today;
        return monthEnd; // Past month — default to last day
      }
      if (mode === 'schedule') {
        // Use today if within the month, else first day of month
        if (today.getFullYear() === y && today.getMonth() + 1 === m) return today;
        return monthStart; // Future month — default to first day
      }
    }
    if (mode === 'report') return new Date();
    if (mode === 'schedule') return new Date();
    return new Date(); // Default for edit mode (will be overridden)
  };

  // Initialize state with default values
  const [selectedActivityDate, setSelectedActivityDate] = useState<Date | null>(getInitialDate());
  const [activityDetails, setActivityDetails] = useState({
    activityType: presetActivityType,
    location: '',
    locationLabel: '',
    tanzeemiUnit: '',
    notes: '',
    attendance: '',
    reportingMonth: presetMonth,
    reportingYear: presetYear,
  });
  

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Tanzeem selectors (moved up to be available for state initialization)
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const userTanzeemiLevelDetails = useAppSelector(selectUserTanzeemiLevelDetails);
  const allTanzeemiUnits = useAppSelector(selectAllTanzeemiUnits);
  const levelsById = useAppSelector(selectLevelsById);
  const selectedUnit = useAppSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useAppSelector(selectDashboardSelectedUnitId);
  const displayUnit = selectedUnit || userUnitDetails;
  const displayUnitId = selectedUnitId || userUnitDetails?.id;
  const childUnits = useAppSelector(selectChildUnits(displayUnitId || 0));
  
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

  // Determine effective mode for date bounds:
  // In edit mode, use editContext (which tab the edit was triggered from),
  // then fall back to activity status, then default to schedule.
  const effectiveDateMode = React.useMemo(() => {
    if (isEditMode) {
      if (editContext) return editContext;
      if (activity) return activity.status === 'published' ? 'report' : 'schedule';
      return 'schedule'; // fallback while activity is loading
    }
    return mode === 'edit' ? 'schedule' : mode;
  }, [isEditMode, activity, mode, editContext]);

  // Compute date bounds for the reporting period
  const dateBounds = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (presetMonth && presetYear && !isEditMode) {
      const m = parseInt(presetMonth, 10);
      const y = parseInt(presetYear, 10);
      const monthStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(y, m, 0, 23, 59, 59, 999); // Last day of month

      if (effectiveDateMode === 'report') {
        return {
          minimumDate: monthStart,
          maximumDate: monthEnd < today ? monthEnd : today,
        };
      } else if (effectiveDateMode === 'schedule') {
        return {
          minimumDate: monthStart > todayStart ? monthStart : todayStart,
          maximumDate: monthEnd,
        };
      }
    }

    // Fallback / edit mode: apply rules without month restriction
    if (effectiveDateMode === 'schedule') return { minimumDate: todayStart, maximumDate: undefined };
    if (effectiveDateMode === 'report') return { minimumDate: undefined, maximumDate: today };
    return { minimumDate: undefined, maximumDate: undefined };
  }, [presetMonth, presetYear, effectiveDateMode, isEditMode]);

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

  // Set initial tanzeemi unit to currently selected unit (or fallback to user's unit)
  useEffect(() => {
    if (displayUnitId && !isEditMode) {
      setActivityDetails(prev => ({
        ...prev,
        tanzeemiUnit: String(displayUnitId)
      }));
    }
  }, [displayUnitId, isEditMode]);

  // Auto-fill reporting month and year — preset from Activities screen takes priority
  useEffect(() => {
    // If preset values provided from Activities screen, use them (already set in initial state)
    if (presetMonth && presetYear) return;
    // Otherwise fall back to date-based auto-fill for report mode
    if ((mode === 'report' || (isEditMode && activity && activity.status === 'published')) && selectedActivityDate) {
      const month = selectedActivityDate.getMonth() + 1;
      const year = selectedActivityDate.getFullYear();
      setActivityDetails(prev => ({
        ...prev,
        reportingMonth: String(month),
        reportingYear: String(year),
      }));
    }
  }, [mode, selectedActivityDate, isEditMode, activity, presetMonth, presetYear]);
  
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
        const isUnitId = !isNaN(Number(activity.location)) && activity.location !== '';

        if (isUnitId) {
          locationValue = String(activity.location);
          const unitId = Number(activity.location);

          // Check if it's the currently selected (display) unit
          if (displayUnit && displayUnit.id === unitId) {
            const lvlId = displayUnit.Level_id || displayUnit.level_id;
            const levelName = (lvlId && levelsById[lvlId]) ? levelsById[lvlId].Name || '' : '';
            const unitName = formatUnitName(displayUnit);
            locationLabelValue = levelName ? `${levelName}: ${unitName}` : unitName;
          } else {
            // Check child units
            const childUnit = childUnits?.find(unit => unit.id === unitId);
            if (childUnit) {
              const childLevelId = childUnit.level_id || childUnit.Level_id;
              const childLevelName = (childLevelId && levelsById[childLevelId])
                ? levelsById[childLevelId].Name || ''
                : '';
              const unitName = formatUnitName(childUnit);
              locationLabelValue = childLevelName ? `${childLevelName}: ${unitName}` : unitName;
            } else {
              locationLabelValue = `Unit ${unitId}`;
            }
          }
        } else {
          // Check if it matches any available unit label
          const matchingUnit = locationOptions.find(option => option.label === activity.location);

          if (matchingUnit && matchingUnit.value !== 'custom') {
            locationValue = matchingUnit.value;
            locationLabelValue = matchingUnit.label;
          } else {
            locationValue = 'custom';
            locationLabelValue = activity.location;
            shouldShowCustomInput = true;
            customText = activity.location;
          }
        }
      }
      
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

  // Filter activity types by the SELECTED tanzeemi unit's level
  const filteredActivityTypeOptions = React.useMemo(() => {
    // Find the selected unit's Level_id
    let selectedLevelId: number | null = null;
    const selectedUnitId = activityDetails.tanzeemiUnit ? Number(activityDetails.tanzeemiUnit) : null;

    if (selectedUnitId) {
      if (userUnitDetails && userUnitDetails.id === selectedUnitId) {
        selectedLevelId = userUnitDetails.level_id || userUnitDetails.Level_id || null;
      } else {
        const childUnit = childUnits?.find(u => u.id === selectedUnitId);
        if (childUnit) {
          selectedLevelId = childUnit.level_id || childUnit.Level_id || null;
        }
      }
    }

    // Filter activity types whose Level_id matches the selected unit's level
    const filteredTypes = activityTypes.filter(type => {
      if (!selectedLevelId) return true; // No unit selected yet — show all
      const typeLevelId = type.Level_id || type.level_id;
      if (!typeLevelId) return true; // Generic type with no level — always show
      return typeLevelId === selectedLevelId;
    });

    const options = filteredTypes.map((type) => ({
      id: String(type.id),
      label: type.Name,
      value: String(type.id),
    }));

    // Always add "دیگر" (Other) option at the end
    options.push({
      id: 'other',
      label: 'دیگر',
      value: 'other',
    });

    return options;
  }, [activityTypes, activityDetails.tanzeemiUnit, userUnitDetails, childUnits]);

  // Clear activity type if it's no longer valid for the new unit's level
  React.useEffect(() => {
    if (activityDetails.activityType) {
      const stillValid = filteredActivityTypeOptions.some(
        opt => opt.value === activityDetails.activityType
      );
      if (!stillValid) {
        setActivityDetails(prev => ({ ...prev, activityType: '' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredActivityTypeOptions]);

  // Create tanzeemi unit options using currently selected unit and its level
  const tanzeemiUnitOptions = React.useMemo(() => {
    const options = [];

    // Add currently selected (or user's) unit
    if (displayUnit) {
      const displayLevelId = displayUnit.Level_id || displayUnit.level_id;
      const levelName = displayLevelId && levelsById[displayLevelId]
        ? levelsById[displayLevelId].Name || ''
        : (userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '');
      const unitName = formatUnitName(displayUnit);
      const label = levelName ? `${levelName}: ${unitName}` : unitName;

      options.push({
        id: String(displayUnit.id),
        label: label,
        value: String(displayUnit.id),
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
  }, [displayUnit, childUnits, userTanzeemiLevelDetails, levelsById]);

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

  // Create location options with currently selected (or user's) unit and child units
  const locationOptions = React.useMemo(() => {
    const options = [];

    // Add currently selected unit
    if (displayUnit) {
      const displayLevelId = displayUnit.Level_id || displayUnit.level_id;
      const levelName = displayLevelId && levelsById[displayLevelId]
        ? levelsById[displayLevelId].Name || ''
        : (userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '');
      const unitName = formatUnitName(displayUnit);
      const label = levelName ? `${levelName}: ${unitName}` : unitName;

      options.push({
        id: String(displayUnit.id),
        label: label,
        value: String(displayUnit.id),
      });
    }

    // Add child units with their respective level names
    if (childUnits && childUnits.length > 0) {
      childUnits.forEach(unit => {
        const childLevelId = unit.level_id || unit.Level_id;
        const childLevelName = (childLevelId && levelsById[childLevelId])
          ? levelsById[childLevelId].Name || ''
          : '';

        const unitName = formatUnitName(unit);
        const label = childLevelName ? `${childLevelName}: ${unitName}` : unitName;

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

    return options;
  }, [displayUnit, childUnits, userTanzeemiLevelDetails, levelsById]);

  // Memoize the level name for the currently selected unit in the form
  // Returns a string primitive so useEffect comparisons won't cause infinite loops
  const selectedUnitLevelName = React.useMemo(() => {
    const formUnitId = activityDetails.tanzeemiUnit ? Number(activityDetails.tanzeemiUnit) : null;
    if (formUnitId) {
      if (displayUnit && displayUnit.id === formUnitId) {
        const lvlId = displayUnit.Level_id || displayUnit.level_id;
        if (lvlId && levelsById[lvlId]) return levelsById[lvlId].Name || '';
      } else {
        const childUnit = childUnits?.find(u => u.id === formUnitId);
        if (childUnit) {
          const lvlId = childUnit.level_id || childUnit.Level_id;
          if (lvlId && levelsById[lvlId]) return levelsById[lvlId].Name || '';
        }
      }
    }
    return userTanzeemiLevelDetails?.Name || userTanzeemiLevelDetails?.name || '';
  }, [activityDetails.tanzeemiUnit, displayUnit, childUnits, levelsById, userTanzeemiLevelDetails]);

  // Auto-populate activity details when activity type or unit changes (only for new activities)
  useEffect(() => {
    if (isEditMode) return; // Don't overwrite existing details in edit mode
    if (activityDetails.activityType && activityDetails.activityType !== 'other') {
      const selectedType = activityTypes.find(type => String(type.id) === activityDetails.activityType);

      if (selectedType && selectedUnitLevelName) {
        const activityDetailsText = `${selectedType.Name} - ${selectedUnitLevelName}`;
        setActivityDetails(prev => ({
          ...prev,
          notes: activityDetailsText,
        }));
      }
    }
  }, [activityDetails.activityType, activityTypes, selectedUnitLevelName, isEditMode]);

  const navigateBack = () => {
    // Defer to avoid Fabric "Unable to find viewState for tag" when going back
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigation.goBack(), 50);
    });
  };

  const handleDateTimeChange = (date: Date) => {
    // Create a new Date object to avoid mutating the original
    const newDate = new Date(date);
    
    // Adjust the date based on mode
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Always set seconds and milliseconds to 0
    newDate.setSeconds(0, 0);
    
    if (effectiveDateMode === 'report' && newDate > new Date()) {
      // For report mode, don't allow future dates
      newDate.setHours(today.getHours(), 0, 0, 0);
    } else if (effectiveDateMode === 'schedule' && isSameDay(newDate, today) && newDate.getHours() <= today.getHours()) {
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
      return 'تاریخ اور وقت منتخب کریں۔';
    }
    if (!activityDetails.activityType) {
      return 'شائع کرنے سے پہلے سرگرمی کی قسم منتخب کریں۔';
    }
    if (!activityDetails.tanzeemiUnit) {
      return 'تنظیمی یونٹ منتخب کریں۔';
    }
    if (!activityDetails.location) {
      return 'براہ کرم جگہ منتخب کریں۔';
    }
    if (activityDetails.location === 'custom' && !activityDetails.locationLabel) {
      return 'براہ کرم دیگر جگہ کی تفصیل درج کریں۔';
    }
    
    // Additional validation for report mode or report-context edits
    if (mode === 'report' || effectiveDateMode === 'report') {
      if (!activityDetails.attendance) {
        return 'براہ کرم حاضری درج کریں۔';
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
    // Always derive report month/year from the selected activity date
    // so changing the date moves the activity to the correct reporting month
    let reportMonth = activityDate.getMonth() + 1;
    let reportYear = activityDate.getFullYear();
    let attendance = null;

    if (mode === 'report') {
      status = 'published';
      // For new reports, use preset month/year (reporting period from Activities screen)
      if (activityDetails.reportingMonth) reportMonth = parseInt(activityDetails.reportingMonth);
      if (activityDetails.reportingYear) reportYear = parseInt(activityDetails.reportingYear);
      attendance = parseInt(activityDetails.attendance);
    } else if (isEditMode) {
      status = activity?.status || 'draft';
      // Include attendance and reporting month/year for report-context edits or published activities
      if (effectiveDateMode === 'report' || (activity && activity.status === 'published')) {
        attendance = parseInt(activityDetails.attendance);
        if (activityDetails.reportingMonth) reportMonth = parseInt(activityDetails.reportingMonth);
        if (activityDetails.reportingYear) reportYear = parseInt(activityDetails.reportingYear);
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
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => navigation.goBack(), 50);
    });
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
            {/* Reporting period info bar */}
            {presetMonth && presetYear && (
              <View style={styles.periodInfoBar}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <UrduText style={styles.periodInfoText}>
                  رپورٹنگ مدت: {getUrduMonth(parseInt(presetMonth))} {presetYear}
                </UrduText>
              </View>
            )}

            <DateTimePicker
              key={`date-picker-${selectedActivityDate?.getTime() || 'initial'}`}
              label="تاریخ اور وقت"
              placeholder="تاریخ اور وقت منتخب کریں"
              mode="datetime"
              initialDate={selectedActivityDate || undefined}
              onDateChange={handleDateTimeChange}
              minimumDate={dateBounds.minimumDate}
              maximumDate={dateBounds.maximumDate}
              disabled={false}
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
            
            {/* Attendance field for report mode, report-context edits, or published activities in edit mode */}
            {(mode === 'report' || effectiveDateMode === 'report') && (
              <FormInput
                inputTitle="حاضری"
                value={activityDetails.attendance}
                onChange={selectAttendance}
                placeholder="حاضری درج کریں"
                keyboardType="numeric"
                required
              />
            )}

            {/* Month/year dropdowns in report mode (no presets) or report-context edits */}
            {((mode === 'report' && !presetMonth && !presetYear) || (isEditMode && effectiveDateMode === 'report')) && (
              <>
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
      
      {/* Confirm submission — inline overlay, NO Modal */}
      {showConfirmDialog && (
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Pressable style={styles.overlayBackdrop} onPress={() => !isSubmitting && setShowConfirmDialog(false)} />
          <View style={styles.overlayCenter}>
            <View style={styles.dialogBox}>
              <View style={styles.dialogIconWrapWarning}>
                <MaterialIcons name="warning" size={30} color={COLORS.white} />
              </View>
              <UrduText style={styles.dialogTitle}>
                {isEditMode ? "سرگرمی اپڈیٹ کرنے کی تصدیق" : "سرگرمی جمع کروانے کی تصدیق"}
              </UrduText>
              <UrduText style={styles.dialogDesc}>
                {isEditMode
                  ? "کیا آپ واقعاً اس سرگرمی کو اپڈیٹ کرنا چاہتے ہیں؟"
                  : "کیا اس سرگرمی کی رپورٹ محفوظ کر لیں؟"}
              </UrduText>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, isSubmitting && styles.dialogBtnDisabled]}
                onPress={handleConfirmSubmit}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <UrduText style={styles.dialogConfirmText}>
                    {isEditMode ? "ہاں، اپڈیٹ کریں" : "ہاں، جمع کروائیں"}
                  </UrduText>
                )}
              </TouchableOpacity>
              {!isSubmitting && (
                <TouchableOpacity onPress={() => setShowConfirmDialog(false)} activeOpacity={0.7}>
                  <UrduText style={styles.dialogCancelText}>نہیں، واپس جائیں</UrduText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Success — inline overlay, NO Modal */}
      {showSuccessDialog && (
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <View style={styles.overlayBackdrop} />
          <View style={styles.overlayCenter}>
            <View style={styles.dialogBox}>
              <View style={styles.dialogIconWrapSuccess}>
                <Ionicons name="checkmark-circle" size={30} color={COLORS.white} />
              </View>
              <UrduText style={styles.dialogTitle}>
                {isEditMode
                  ? "آپ کی سرگرمی اپڈیٹ کر دی گئی ہے!"
                  : "آپ کی سرگرمی جمع کر دی گئی ہے!"}
              </UrduText>
              <UrduText style={styles.dialogDesc}>
                {isEditMode
                  ? "آپ کی سرگرمی کامیابی سے اپڈیٹ ہو چکی ہے۔"
                  : "آپ کی سرگرمی کامیابی سے سبمٹ ہو چکی ہے۔"}
              </UrduText>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={handleSuccessDialogConfirm}
                activeOpacity={0.7}
              >
                <UrduText style={styles.dialogConfirmText}>ٹھیک ہے</UrduText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl * 2,
  },
  content: {
    // Content styling if needed
  },
  datePickerContainer: {
  },
  dropdownContainer: {
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
  periodInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightPrimary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  periodInfoText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontFamily: 'JameelNooriNastaleeq',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
  // --- Inline overlay styles (replaces Modal-based Dialog) ---
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  dialogBox: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }),
    ...(Platform.OS === 'android' ? { elevation: 12 } : {}),
  },
  dialogIconWrapWarning: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dialogIconWrapSuccess: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dialogTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  dialogDesc: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  dialogConfirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    width: '80%',
    alignItems: 'center',
  },
  dialogBtnDisabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.7,
  },
  dialogConfirmText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
  },
  dialogCancelText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    paddingVertical: SPACING.sm,
  },
});

export default ActivityScreen;