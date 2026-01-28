import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/app/constants/theme';
import FormInput from '@/app/components/FormInput';
import UrduText from '@/app/components/UrduText';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import { 
  fetchContactTypes, 
  selectContactTypes, 
  selectContactTypesStatus 
} from '@/app/features/persons/personSlice';
import { 
  fetchActivityTypes, 
  selectAllActivityTypes, 
  selectActivityTypesStatus 
} from '@/app/features/activityTypes/activityTypesSlice';
import { 
  fetchStrengthTypes, 
  selectStrengthTypes, 
  selectStrengthState 
} from '@/app/features/strength/strengthSlice';
import { fetchActivityCount } from '@/app/features/activities/activitySlice';
import { fetchStrengthCountAndTotals } from '@/app/features/strength/strengthSlice';
import { directApiRequest } from '@/app/services/apiClient';
import i18n from '@/app/i18n';
import { ReportQuestion, ReportAnswer } from '../features/qa/types';
import { saveAnswer } from '../features/qa/qaSlice';
import { calculateAutoValue, getCalculationButtonText } from '../features/qa/utils';
import { AppDispatch } from '../store';
import { selectUserUnitDetails, selectUserUnitHierarchyIds } from '../features/tanzeem/tanzeemSlice';
import { selectManagementReportsList, selectReportSubmissions } from '../features/reports/reportsSlice_new';
import { selectCurrentSubmissionId } from '../features/qa/qaSlice';

interface AutoQuestionInputProps {
  question: ReportQuestion;
  value: string | number;
  submissionId: number | null;
  disabled?: boolean;
  onValueChange?: (value: string | number) => void;
  currentUnitId?: number | null; // Add current unit ID for filtering
}

interface Person {
  id: number;
  Name?: string;
  Phone_Number?: string;
  archived_at?: string;
  status?: string;
  Tanzeemi_Unit?: number;
  contact_type?: number;
  date_created?: string;
  Rukinat_Date?: string;
}

interface Activity {
  id: number;
  activity_type: number;
  activity_date_and_time: string;
  location: string;
  activity_details?: string;
  activity_summary?: string;
  attendance?: number;
  status: string;
  report_month?: number;
  report_year?: number;
  tanzeemi_unit: number;
}

interface StrengthRecord {
  id: number;
  Tanzeemi_Unit: number;
  Type: number;
  Value: number;
  change_type: string; // "plus" or "minus"
  new_total: number;
  Reporting_Time?: string;
}

const AutoQuestionInput: React.FC<AutoQuestionInputProps> = ({
  question,
  value,
  submissionId,
  disabled = false,
  onValueChange,
  currentUnitId
}) => {
  const dispatch = useAppDispatch();
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const latestReportMgmt = useAppSelector(selectManagementReportsList);
  const contactTypes = useAppSelector(selectContactTypes);
  const contactTypesStatus = useAppSelector(selectContactTypesStatus);
  const activityTypes = useAppSelector(selectAllActivityTypes);
  const activityTypesStatus = useAppSelector(selectActivityTypesStatus);
  const strengthTypes = useAppSelector(selectStrengthTypes);
  const strengthState = useAppSelector(selectStrengthState);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationSuccess, setCalculationSuccess] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(String(value || ''));
  
  // Popup state for contacts
  const [showContactsPopup, setShowContactsPopup] = useState(false);
  const [contactsList, setContactsList] = useState<Person[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Popup state for activities
  const [showActivitiesPopup, setShowActivitiesPopup] = useState(false);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Popup state for strength records
  const [showStrengthPopup, setShowStrengthPopup] = useState(false);
  const [strengthRecordsList, setStrengthRecordsList] = useState<StrengthRecord[]>([]);
  const [strengthLoading, setStrengthLoading] = useState(false);
  const [strengthError, setStrengthError] = useState<string | null>(null);

  // // Debug contactsList changes
  // useEffect(() => {
  //   console.log('[AutoQuestionInput] contactsList changed:', {
  //     length: contactsList.length,
  //     firstFew: contactsList.slice(0, 3)
  //   });
  // }, [contactsList]);

  // // Debug strengthRecordsList changes
  // useEffect(() => {
  //   console.log('[AutoQuestionInput] strengthRecordsList changed:', {
  //     length: strengthRecordsList.length,
  //     firstFew: strengthRecordsList.slice(0, 3)
  //   });
  // }, [strengthRecordsList]);

  // Fetch contact types, activity types, and strength types on component mount
  useEffect(() => {
    if (contactTypes.length === 0) {
      dispatch(fetchContactTypes());
    }
    if (activityTypes.length === 0) {
      dispatch(fetchActivityTypes());
    }
    if (strengthTypes.length === 0) {
      dispatch(fetchStrengthTypes());
    }
  }, [dispatch, contactTypes.length, activityTypes.length, strengthTypes.length]);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  // Get current submission details
  const currentSubmissionId = useAppSelector(selectCurrentSubmissionId);
  

  const reportSubmissions = useAppSelector(selectReportSubmissions);
  const reportMgmtDetails = useAppSelector(selectManagementReportsList);
  
  // Get current reporting month and year from the current submission's management
  const getCurrentReportingPeriod = useCallback(() => {
    // Find the current submission
    const currentSubmission = reportSubmissions.find((sub: any) => sub.id === currentSubmissionId);
    
    if (currentSubmission) {
      // Find the management details for this submission in state
      const managementDetails = reportMgmtDetails.find(report => 
        report.managements.some(mgmt => mgmt.id === currentSubmission.mgmt_id)
      );
      
      if (managementDetails) {
        const management = managementDetails.managements.find(mgmt => mgmt.id === currentSubmission.mgmt_id);
        if (management) {
          return {
            month: management.month,
            year: management.year
          };
        }
      }
    }
    
    // Fallback to current date
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  }, [reportMgmtDetails, currentSubmissionId, reportSubmissions]);

  // Fetch contacts for popup
  const fetchContactsForPopup = useCallback(async (): Promise<Person[]> => {
    if (!question.linked_to_id) {
      setContactsError('linked_to_id میسر نہیں ہے');
      return [];
    }

    setContactsLoading(true);
    setContactsError(null);

    try {
      const reportingPeriod = getCurrentReportingPeriod();
      
      // Build filter based on aggregate function
      let dateFilter = {};
      
      if (question.aggregate_func === 'plus') {
        // For plus function, show persons whose date_created OR Rukinat_Date is within current reporting month
        const unitIdToUse = currentUnitId || userUnitDetails?.id;
        // Calculate the last day of the month
        const lastDayOfMonth = new Date(reportingPeriod.year, reportingPeriod.month, 0).getDate();
        const startDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-01`;
        const endDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
        
        dateFilter = {
          _and: [
            { Tanzeemi_Unit: { _eq: unitIdToUse } },
            {
              _and: [
                { Rukinat_Date: { _nnull: true } },
                { Rukinat_Date: { _gte: startDate } },
                { Rukinat_Date: { _lte: endDate } }
              ]
            }
          ]
        };
      } else if (question.aggregate_func === 'minus') {
        // For minus function, show persons whose archived_at is within current reporting month
        // AND belong to the current unit
        // Calculate the last day of the month
        const lastDayOfMonth = new Date(reportingPeriod.year, reportingPeriod.month, 0).getDate();
        const startDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-01`;
        const endDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
        
        const unitIdToUse = currentUnitId || userUnitDetails?.id;
        
        dateFilter = {
          _and: [
            { Tanzeemi_Unit: { _eq: unitIdToUse } },
            { archived_at: { _nnull: true } },
            { archived_at: { _gte: startDate } },
            { archived_at: { _lte: endDate } }
          ]
        };
      } else {
        // Default case: show all persons not archived and belonging to current tanzeemi unit
        const unitIdToUse = currentUnitId || userUnitDetails?.id;
        dateFilter = {
          _and: [
            { status: { _neq: 'archived' } },
            { Tanzeemi_Unit: { _eq: unitIdToUse } }
          ]
        };
      }

      const filter = {
        _and: [
          { contact_type: { _eq: question.linked_to_id } },
          dateFilter
        ]
      };

      // console.log('[AutoQuestionInput] Fetching contacts with filter:', JSON.stringify(filter, null, 2));
      // console.log('[AutoQuestionInput] Current unit ID:', currentUnitId);
      // console.log('[AutoQuestionInput] User unit ID:', userUnitDetails?.id);
      // console.log('[AutoQuestionInput] Reporting period:', reportingPeriod);
      // console.log('[AutoQuestionInput] Aggregate function:', question.aggregate_func);
      
      // Build the query string manually to ensure proper encoding
      const params = new URLSearchParams();
      
      // Add filter as JSON string
      params.append('filter', JSON.stringify(filter));
      
      // Add fields - only use the correct field names that exist in the API
      params.append('fields', 'id,Name,Phone_Number,archived_at,status,Tanzeemi_Unit,contact_type,date_created,Rukinat_Date');
      
      // Add limit to get all results
      params.append('limit', '-1');
      
      const queryString = params.toString();
      const url = `/items/Person?${queryString}`;
      
      // console.log('[AutoQuestionInput] API URL:', url);
      
      const response = await directApiRequest<{ data: Person[] }>(
        url,
        'GET'
      );

      // console.log('[AutoQuestionInput] API response:', {
      //   dataLength: response.data?.length || 0,
      //   firstFewItems: response.data?.slice(0, 3) || [],
      //   fullResponse: response
      // });

      if (response.data) {
        // console.log('[AutoQuestionInput] Setting contacts list with', response.data.length, 'items');
        setContactsList(response.data);
        return response.data;
      } else {
        // console.log('[AutoQuestionInput] No data in response, setting empty list');
        setContactsList([]);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setContactsError(`${getContactTypeLabel()} حاصل کرنے میں ناکامی`);
      return [];
    } finally {
      setContactsLoading(false);
    }
  }, [question.linked_to_id, question.aggregate_func, getCurrentReportingPeriod, userUnitDetails?.id, currentUnitId]);

  // Fetch activities for popup
  const fetchActivitiesForPopup = useCallback(async (): Promise<Activity[]> => {
    if (!question.linked_to_id) {
      setActivitiesError('linked_to_id میسر نہیں ہے');
      return [];
    }

    setActivitiesLoading(true);
    setActivitiesError(null);

    try {
      const reportingPeriod = getCurrentReportingPeriod();
      const unitIdToUse = currentUnitId || userUnitDetails?.id;
      
      // Build filter for activities
      const filter = {
        _and: [
          { activity_type: { _eq: question.linked_to_id } },
          { tanzeemi_unit: { _eq: unitIdToUse } },
          { report_month: { _eq: reportingPeriod.month } },
          { report_year: { _eq: reportingPeriod.year } }
        ]
      };

      // console.log('[AutoQuestionInput] Fetching activities with filter:', JSON.stringify(filter, null, 2));
      // console.log('[AutoQuestionInput] Current unit ID:', currentUnitId);
      // console.log('[AutoQuestionInput] User unit ID:', userUnitDetails?.id);
      // console.log('[AutoQuestionInput] Reporting period:', reportingPeriod);
      
      // Build the query string manually to ensure proper encoding
      const params = new URLSearchParams();
      
      // Add filter as JSON string
      params.append('filter', JSON.stringify(filter));
      
      // Add fields
      params.append('fields', 'id,activity_type,activity_date_and_time,location,activity_details,activity_summary,attendance,status,report_month,report_year');
      
      // Add limit to get all results
      params.append('limit', '-1');
      
      const queryString = params.toString();
      const url = `/items/Activities?${queryString}`;
      
      // console.log('[AutoQuestionInput] API URL:', url);
      
      const response = await directApiRequest<{ data: Activity[] }>(
        url,
        'GET'
      );

      // console.log('[AutoQuestionInput] API response:', {
      //   dataLength: response.data?.length || 0,
      //   firstFewItems: response.data?.slice(0, 3) || [],
      //   fullResponse: response
      // });

      if (response.data) {
        // console.log('[AutoQuestionInput] Setting activities list with', response.data.length, 'items');
        setActivitiesList(response.data);
        return response.data;
      } else {
        // console.log('[AutoQuestionInput] No data in response, setting empty list');
        setActivitiesList([]);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      setActivitiesError(`${getActivityTypeLabel()} حاصل کرنے میں ناکامی`);
      return [];
    } finally {
      setActivitiesLoading(false);
    }
  }, [question.linked_to_id, getCurrentReportingPeriod, currentUnitId, userUnitDetails?.id]);

  // Fetch strength records for popup
  const fetchStrengthRecordsForPopup = useCallback(async () => {
    if (!question.linked_to_id) {
      setStrengthError('linked_to_id میسر نہیں ہے');
      return;
    }

    setStrengthLoading(true);
    setStrengthError(null);

    try {
      const reportingPeriod = getCurrentReportingPeriod();
      const unitIdToUse = currentUnitId || userUnitDetails?.id;
      
      // Calculate the last day of the month
      const lastDayOfMonth = new Date(reportingPeriod.year, reportingPeriod.month, 0).getDate();
      const startDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-01`;
      const endDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
      
      const filter = {
        _and: [
          { Type: { _eq: question.linked_to_id } },
          { Tanzeemi_Unit: { _eq: unitIdToUse } },
          { Reporting_Time: { _nnull: true } },
          { Reporting_Time: { _gte: startDate } },
          { Reporting_Time: { _lte: endDate } }
        ]
      };

      // console.log('[AutoQuestionInput] Fetching strength records with filter:', JSON.stringify(filter, null, 2));
      // console.log('[AutoQuestionInput] Current unit ID:', currentUnitId);
      // console.log('[AutoQuestionInput] User unit ID:', userUnitDetails?.id);
      // console.log('[AutoQuestionInput] Reporting period:', reportingPeriod);
      
      // Build the query string manually to ensure proper encoding
      const params = new URLSearchParams();
      
      // Add filter as JSON string
      params.append('filter', JSON.stringify(filter));
      
      // Add fields
      params.append('fields', 'id,Tanzeemi_Unit,Type,Value,change_type,new_total,Reporting_Time');
      
      // Add limit to get all results
      params.append('limit', '-1');
      
      const queryString = params.toString();
      const url = `/items/Strength_Records?${queryString}`;
      
      // console.log('[AutoQuestionInput] API URL:', url);
      
      const response = await directApiRequest<{ data: StrengthRecord[] }>(
        url,
        'GET'
      );

      // console.log('[AutoQuestionInput] API response:', {
      //   dataLength: response.data?.length || 0,
      //   firstFewItems: response.data?.slice(0, 3) || [],
      //   fullResponse: response
      // });

      if (response.data) {
        // console.log('[AutoQuestionInput] Setting strength records list with', response.data.length, 'items');
        setStrengthRecordsList(response.data);
      } else {
        // console.log('[AutoQuestionInput] No data in response, setting empty list');
        setStrengthRecordsList([]);
      }
    } catch (error: any) {
      console.error('Error fetching strength records:', error);
      setStrengthError(`${getStrengthTypeLabel()} حاصل کرنے میں ناکامی`);
    } finally {
      setStrengthLoading(false);
    }
  }, [question.linked_to_id, getCurrentReportingPeriod, userUnitDetails?.id, currentUnitId]);

  // Handle popup open for contacts
  const handleContactsPopupOpen = useCallback(() => {
    setShowContactsPopup(true);
    fetchContactsForPopup();
  }, [fetchContactsForPopup]);

  // Handle popup open for activities
  const handleActivitiesPopupOpen = useCallback(() => {
    setShowActivitiesPopup(true);
    fetchActivitiesForPopup();
  }, [fetchActivitiesForPopup]);

  // Handle popup open for strength records
  const handleStrengthPopupOpen = useCallback(() => {
    setShowStrengthPopup(true);
    fetchStrengthRecordsForPopup();
  }, [fetchStrengthRecordsForPopup]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setShowContactsPopup(false);
    setShowActivitiesPopup(false);
    setShowStrengthPopup(false);
    setContactsList([]);
    setActivitiesList([]);
    setStrengthRecordsList([]);
    setContactsError(null);
    setActivitiesError(null);
    setStrengthError(null);
  }, []);

  // Fetch latest strength record for total/sum/count functions
  const fetchLatestStrengthRecord = useCallback(async () => {
    if (!question.linked_to_id) {
      throw new Error('linked_to_id میسر نہیں ہے');
    }

    const unitIdToUse = currentUnitId || userUnitDetails?.id;
    
    const filter = {
      _and: [
        { Type: { _eq: question.linked_to_id } },
        { Tanzeemi_Unit: { _eq: unitIdToUse } }
      ]
    };

    const params = new URLSearchParams();
    params.append('filter', JSON.stringify(filter));
    params.append('fields', 'id,Tanzeemi_Unit,Type,Value,change_type,new_total,Reporting_Time');
    params.append('sort', '-Reporting_Time');
    params.append('limit', '1');
    
    const queryString = params.toString();
    const url = `/items/Strength_Records?${queryString}`;
    
    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      url,
      'GET'
    );

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  }, [question.linked_to_id, currentUnitId, userUnitDetails?.id]);

  // Fetch count based on linked_to_type and update input value
  const handleFetchCount = useCallback(async () => {
    // For contacts, show popup instead of direct calculation
    if (question.linked_to_type === 'contacts') {
      handleContactsPopupOpen();
      return;
    }

    // For activities, show popup instead of direct calculation
    if (question.linked_to_type === 'activity') {
      handleActivitiesPopupOpen();
      return;
    }

    // For strength, show popup for plus/minus functions, or fetch latest record for total/sum/count
    if (question.linked_to_type === 'strength') {
      if (question.aggregate_func === 'plus' || question.aggregate_func === 'minus') {
        handleStrengthPopupOpen();
        return;
      }
    }

    setIsCalculating(true);
    setCalculationError(null);
    setCalculationSuccess(null);
    try {
      if (!question.linked_to_id) {
        setCalculationError('linked_to_id میسر نہیں ہے');
        setIsCalculating(false);
        return;
      }

      let result: any;

      // Handle different linked_to_type cases
      if (question.linked_to_type === 'strength') {
        // For total, sum, or count functions, fetch the latest record and use new_total
        if (question.aggregate_func === 'total' || question.aggregate_func === 'sum' || question.aggregate_func === 'count') {
          const latestRecord = await fetchLatestStrengthRecord();
          if (latestRecord) {
            result = latestRecord.new_total;
            setCalculationSuccess(`${getStrengthTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی`);
          } else {
            result = 0;
            setCalculationSuccess(`${getStrengthTypeLabel()} کے لیے کوئی ریکارڈ نہیں ملا`);
          }
        } else {
          // For other functions, use the existing logic
          result = await dispatch(fetchStrengthCountAndTotals({
            linkedToId: question.linked_to_id ?? 0
          })).unwrap();
          let displayValue = '';
          if (question.aggregate_func === 'avg') {
            displayValue = String(result.avg);
          } else {
            displayValue = String(result.sum); // default to sum
          }
          setInputValue(displayValue);
          setCalculationSuccess(`${getStrengthTypeLabel()} کی معلومات کامیابی سے حاصل ہو گئیں`);
          if (onValueChange) {
            onValueChange(displayValue);
          }
          setTimeout(() => setCalculationSuccess(null), 3000);
          return;
        }
      } else if (question.linked_to_type === 'contacts') {
        // For contacts, fetch data first then calculate
        const contacts = await fetchContactsForPopup();
        const contactsCount = contacts.length;
        if (question.aggregate_func === 'total' || question.aggregate_func === 'count') {
          result = contactsCount;
          setCalculationSuccess(`${getContactTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی`);
        } else if (question.aggregate_func === 'sum') {
          result = contactsCount;
          setCalculationSuccess(`${getContactTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی`);
        } else {
          result = 0;
          setCalculationSuccess(`${getContactTypeLabel()} کے لیے کوئی ریکارڈ نہیں ملا`);
        }
      } else if (question.linked_to_type === 'activity') {
        // For activities, fetch data first then calculate
        const activities = await fetchActivitiesForPopup();
        const activitiesCount = activities.length;
        if (question.aggregate_func === 'total' || question.aggregate_func === 'count') {
          result = activitiesCount;
          setCalculationSuccess(`${getActivityTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی`);
        } else if (question.aggregate_func === 'sum') {
          result = activitiesCount;
          setCalculationSuccess(`${getActivityTypeLabel()} کی کل تعداد کامیابی سے حاصل ہو گئی`);
        } else {
          result = 0;
          setCalculationSuccess(`${getActivityTypeLabel()} کے لیے کوئی ریکارڈ نہیں ملا`);
        }
      } else {
        setCalculationError('نامعلوم linked_to_type');
        setIsCalculating(false);
        return;
      }

      setInputValue(String(result));
      if (onValueChange) {
        // console.log('[AutoQuestionInput] Calling onValueChange with result:', {
        //   result,
        //   resultType: typeof result,
        //   questionId: question.id,
        //   submissionId
        // });
        onValueChange(result);
      }
      setTimeout(() => setCalculationSuccess(null), 3000);
    } catch (error: any) {
      setCalculationError('تعداد حاصل کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsCalculating(false);
    }
  }, [dispatch, question, onValueChange, handleContactsPopupOpen, handleStrengthPopupOpen, fetchLatestStrengthRecord, fetchContactsForPopup, fetchActivitiesForPopup, contactsList, activitiesList]);

  // Get button text based on aggregate function
  const buttonText = getCalculationButtonText(question.aggregate_func || null);

  // Get icon based on aggregate function
  const getButtonIcon = () => {
    switch (question.aggregate_func) {
      case 'sum':
        return 'add-circle-outline';
      case 'count':
        return 'list-outline';
      case 'avg':
        return 'analytics-outline';
      case 'plus':
        return 'add-circle-outline';
      case 'minus':
        return 'remove-circle-outline';
      default:
        return 'calculator-outline';
    }
  };

  // Get contact type label for the current question
  const getContactTypeLabel = useCallback(() => {
    if (!question.linked_to_id || !contactTypes.length) {
      return 'رابطے'; // Default fallback
    }
    
    const contactType = contactTypes.find(type => type.id === question.linked_to_id);
    if (contactType) {
      // Try to get plural label from the correct field
      return contactType.label_plural || i18n.t(contactType.type) || contactType.type;
    }
    
    return 'رابطے'; // Default fallback
  }, [question.linked_to_id, contactTypes]);

  // Get activity type label for the current question
  const getActivityTypeLabel = useCallback(() => {
    if (!question.linked_to_id || !activityTypes.length) {
      return 'سرگرمیاں'; // Default fallback
    }
    
    const activityType = activityTypes.find(type => type.id === question.linked_to_id);
    if (activityType) {
      return activityType.Name_plural || activityType.Name || 'سرگرمیاں';
    }
    
    return 'سرگرمیاں'; // Default fallback
  }, [question.linked_to_id, activityTypes]);

  // Get strength type label for the current question
  const getStrengthTypeLabel = useCallback(() => {
    if (!question.linked_to_id || !strengthTypes.length) {
      return 'تعداد'; // Default fallback
    }
    
    const strengthType = strengthTypes.find(type => type.id === Number(question.linked_to_id));
    
    if (strengthType) {
      return strengthType.Name_Plural || strengthType.Name_Singular || 'تعداد';
    }
    
    return 'تعداد'; // Default fallback
  }, [question.linked_to_id, strengthTypes]);

  // Get strength type singular label for the current question
  const getStrengthTypeSingularLabel = useCallback(() => {
    if (!question.linked_to_id || !strengthTypes.length) {
      return 'قوت'; // Default fallback
    }
    
    const strengthType = strengthTypes.find(type => type.id === Number(question.linked_to_id));
    if (strengthType) {
      return strengthType.Name_Singular || strengthType.Name_Plural || 'قوت';
    }
    
    return 'قوت'; // Default fallback
  }, [question.linked_to_id, strengthTypes]);

  // Get the appropriate label based on linked_to_type
  const getTypeLabel = useCallback(() => {
    switch (question.linked_to_type) {
      case 'contacts':
        return getContactTypeLabel();
      case 'activity':
        return getActivityTypeLabel();
      case 'strength':
        return getStrengthTypeLabel();
      default:
        return '';
    }
  }, [question.linked_to_type, getContactTypeLabel, getActivityTypeLabel, getStrengthTypeLabel]);

  // Get the appropriate singular label based on linked_to_type
  const getTypeSingularLabel = useCallback(() => {
    switch (question.linked_to_type) {
      case 'contacts':
        return getContactTypeLabel(); // Use same for contacts
      case 'activity':
        return getActivityTypeLabel(); // Use same for activity
      case 'strength':
        return getStrengthTypeSingularLabel();
      default:
        return '';
    }
  }, [question.linked_to_type, getContactTypeLabel, getActivityTypeLabel, getStrengthTypeSingularLabel]);

  // Urdu labels for linked_to_type (fallback)
  const linkedTypeUrdu: Record<string, string> = {
    activity: 'سرگرمی',
    contacts: 'رابطہ',
    strength: 'قوت',
  };



  // Handle OK button in contacts popup
  const handleContactsPopupOK = useCallback(() => {
    const count = contactsList.length;
    setInputValue(String(count));
    if (onValueChange) {
      onValueChange(count);
    }
    setShowContactsPopup(false);
    setCalculationSuccess(`کل ${count} ${getTypeLabel()}`);
    setTimeout(() => setCalculationSuccess(null), 3000);
  }, [contactsList.length, onValueChange, getTypeLabel]);

  // Handle OK button in activities popup
  const handleActivitiesPopupOK = useCallback(() => {
    // Count only published activities
    const publishedCount = activitiesList.filter(activity => activity.status === 'published').length;
    setInputValue(String(publishedCount));
    if (onValueChange) {
      onValueChange(publishedCount);
    }
    setShowActivitiesPopup(false);
    setCalculationSuccess(`کل ${publishedCount} ${getTypeLabel()}`);
    setTimeout(() => setCalculationSuccess(null), 3000);
  }, [activitiesList, onValueChange, getTypeLabel]);

  // Handle OK button in strength popup
  const handleStrengthPopupOK = useCallback(() => {
    const count = strengthRecordsList.length;
    // Get the latest record's new_total for display
    const latestRecord = strengthRecordsList.length > 0 ? strengthRecordsList[0] : null;
    const totalValue = latestRecord ? latestRecord.new_total : 0;
    
    setInputValue(String(totalValue));
    if (onValueChange) {
      onValueChange(totalValue);
    }
    setShowStrengthPopup(false);
    setCalculationSuccess(`کل ${totalValue} ${getTypeLabel()}`);
    setTimeout(() => setCalculationSuccess(null), 3000);
  }, [strengthRecordsList, onValueChange, getTypeLabel]);

  // Check if this question has auto-calculate capability
  const hasAutoCalculateCapability = Boolean(question.linked_to_type && question.linked_to_id);
  
  // Get the appropriate label for linked_to_type if question has auto-calculate capability
  const typeLabel = hasAutoCalculateCapability
    ? getTypeLabel()
    : '';

  // Right icon triggers handleFetchCount
  const rightIcon = (
    <TouchableOpacity
      style={[
        styles.rightButton,
        isCalculating && styles.rightButtonLoading,
        disabled && styles.rightButtonDisabled
      ]}
      onPress={handleFetchCount}
      disabled={disabled || isCalculating}
      activeOpacity={0.7}
    >
      {isCalculating ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons 
            name={getButtonIcon() as any}
            size={16} 
            color={COLORS.white} 
            style={styles.buttonIcon}
          />
          <UrduText style={styles.buttonText} numberOfLines={1}>
            {buttonText}
            {typeLabel ? ` (${typeLabel})` : ''}
          </UrduText>
        </View>
      )}
    </TouchableOpacity>
  );

  // Debug logging
  // console.log('[AutoQuestionInput] Auto-calculate check:', {
  //   questionId: question.id,
  //   linked_to_type: question.linked_to_type,
  //   linked_to_id: question.linked_to_id,
  //   category: question.category,
  //   hasAutoCalculateCapability,
  //   isEditable: question.category === 'manual',
  //   rightIconExists: !!rightIcon,
  //   buttonText,
  //   typeLabel,
  //   questionId33: question.id === 33 ? 'THIS IS QUESTION 33' : 'not 33'
  // });

  // Render contact item for popup
  const renderContactItem = ({ item }: { item: Person }) => {
    // console.log('[AutoQuestionInput] Rendering contact item:', item);
    
    // Use only the fields that exist in the API
    const personName = item.Name || 'نام نہیں ملا';
    const personPhone = item.Phone_Number || 'فون نمبر نہیں ملا';
    
    // console.log('[AutoQuestionInput] Person name:', personName, 'Phone:', personPhone);
    
    return (
      <View style={styles.contactItem}>
        <UrduText style={styles.contactName}>{personName}</UrduText>
        <Text style={styles.contactPhone}>{personPhone}</Text>
      </View>
    );
  };

  // Render activity item for popup
  const renderActivityItem = ({ item }: { item: Activity }) => {
    // console.log('[AutoQuestionInput] Rendering activity item:', item);
    
    const activityDate = item.activity_date_and_time 
      ? new Date(item.activity_date_and_time).toLocaleDateString('ur-PK')
      : 'تاریخ دستیاب نہیں';
    const activityStatus = item.status === 'published' ? 'جمع شدہ' : 
                          item.status === 'draft' ? 'ڈرافٹ' : 
                          item.status === 'archived' ? 'محفوظ شدہ' : item.status;
    
    // Get activity type name
    const activityType = activityTypes.find(type => type.id === item.activity_type);
    const activityTypeName = activityType?.name || item.activity_details;
    
    return (
      <View style={styles.activityItem}>
        <View style={styles.activityItemLeft}>
          <UrduText style={styles.activityTypeName}>{activityTypeName}</UrduText>
        </View>
        <View style={styles.activityItemRight}>
          <UrduText style={styles.activityDate}>{activityDate}</UrduText>
          <UrduText style={[
            styles.activityStatus, 
            { color: item.status === 'published' ? COLORS.success : COLORS.error }
          ]}>
            {activityStatus}
          </UrduText>
        </View>
      </View>
    );
  };

  // Render strength record item for popup
  const renderStrengthRecordItem = ({ item }: { item: StrengthRecord }) => {
    // console.log('[AutoQuestionInput] Rendering strength record item:', item);
    
    const changeTypeText = item.change_type === 'plus' ? 'اضافہ' : 'کمی';
    const changeTypeColor = item.change_type === 'plus' ? COLORS.success : COLORS.error;
    const value = item.Value || 0;
    const newTotal = item.new_total || 0;
    
    // Format the reporting time
    const reportingTime = item.Reporting_Time ? new Date(item.Reporting_Time).toLocaleDateString('ur-PK') : 'تاریخ نہیں ملی';
    
    return (
      <View style={styles.strengthRecordItem}>
        <View style={styles.strengthRecordLeft}>
          <View style={[styles.changeTypeBadge, { backgroundColor: changeTypeColor }]}>
            <UrduText style={styles.changeTypeText}>{changeTypeText}</UrduText>
          </View>
          <UrduText style={styles.strengthRecordValue}>{value}</UrduText>
        </View>
        <View style={styles.strengthRecordRight}>
          <UrduText style={styles.strengthRecordTotal}>کل: {newTotal}</UrduText>
          <Text style={styles.strengthRecordDate}>{reportingTime}</Text>
        </View>
      </View>
    );
  };

  // Determine if input should be editable based on category only
  const isEditable = question.category === 'manual';
  
  return (
    <View style={styles.container}>
      <FormInput
        inputTitle={question.question_text}
        value={inputValue}
        onChange={(text) => {
          setInputValue(text);
          if (onValueChange) {
            onValueChange(text);
          }
        }}
        placeholder={hasAutoCalculateCapability ? "آٹو کیلکولیٹ کریں یا جواب یہاں لکھیں" : "جواب یہاں لکھیں"}
        keyboardType="numeric"
        editable={isEditable}
        disabled={disabled}
        loading={isCalculating}
        rightIcon={hasAutoCalculateCapability ? rightIcon : undefined}
        // Debug: Force show button for testing
        // rightIcon={rightIcon}
      />

      {/* Error message */}
      {calculationError && (
        <View style={styles.messageContainer}>
          <UrduText style={styles.errorMessage}>{calculationError}</UrduText>
        </View>
      )}

      {/* Success message */}
      {calculationSuccess && (
        <View style={styles.messageContainer}>
          <UrduText style={styles.successMessage}>{calculationSuccess}</UrduText>
        </View>
      )}

      {/* Contacts Popup Modal */}
      <Modal
        visible={showContactsPopup}
        transparent={true}
        animationType="slide"
        onRequestClose={handlePopupClose}
        onShow={() => {
          // console.log('[AutoQuestionInput] Modal opened, contactsList:', {
          //   length: contactsList.length,
          //   firstFew: contactsList.slice(0, 3),
          //   hasData: contactsList.length > 0
          // });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <UrduText style={styles.modalTitle}>
                {question.aggregate_func === 'plus' ? `نئے ${getContactTypeLabel()}` : 
                 question.aggregate_func === 'minus' ? `کمی ${getContactTypeLabel()}` : 
                 `کل ${getContactTypeLabel()}`}
              </UrduText>
              <TouchableOpacity onPress={handlePopupClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {contactsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
              </View>
            ) : contactsError ? (
              <View style={styles.errorContainer}>
                <UrduText style={styles.errorText}>{contactsError}</UrduText>
              </View>
            ) : (
              <>
                <View style={styles.listHeader}>
                  <UrduText style={styles.listHeaderText}>
                    کل {contactsList.length} {getTypeLabel()}
                  </UrduText>
                </View>
                
                <FlatList
                  data={contactsList}
                  renderItem={renderContactItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.contactsList}
                  contentContainerStyle={styles.contactsListContent}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <UrduText style={styles.emptyText}>کوئی {getContactTypeLabel()} نہیں ملے ({contactsList.length})</UrduText>
                    </View>
                  }
                  // onLayout={() => console.log('[AutoQuestionInput] FlatList onLayout, data length:', contactsList.length)}
                  // onContentSizeChange={() => console.log('[AutoQuestionInput] FlatList onContentSizeChange, data length:', contactsList.length)}
                  getItemLayout={(data, index) => ({
                    length: 50, // Height of each compact item
                    offset: 50 * index,
                    index,
                  })}

                />

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handlePopupClose}
                  >
                    <UrduText style={styles.cancelButtonText}>منسوخ کریں</UrduText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.okButton}
                    onPress={handleContactsPopupOK}
                  >
                    <UrduText style={styles.okButtonText}>ٹھیک ہے ({contactsList.length})</UrduText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Activities Popup Modal */}
      <Modal
        visible={showActivitiesPopup}
        transparent={true}
        animationType="slide"
        onRequestClose={handlePopupClose}
        onShow={() => {
          // console.log('[AutoQuestionInput] Activities Modal opened, activitiesList:', {
          //   length: activitiesList.length,
          //   firstFew: activitiesList.slice(0, 3),
          //   hasData: activitiesList.length > 0
          // });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <UrduText style={styles.modalTitle}>
                {`${getActivityTypeLabel()} کی سرگرمیاں`}
              </UrduText>
              <TouchableOpacity onPress={handlePopupClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {activitiesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
              </View>
            ) : activitiesError ? (
              <View style={styles.errorContainer}>
                <UrduText style={styles.errorText}>{activitiesError}</UrduText>
              </View>
            ) : (
              <>
                <View style={styles.listHeader}>
                  <UrduText style={styles.listHeaderText}>
                    کل {activitiesList.length} سرگرمی (جمع شدہ: {activitiesList.filter(a => a.status === 'published').length})
                  </UrduText>
                </View>
                
                <FlatList
                  data={activitiesList}
                  renderItem={renderActivityItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.contactsList}
                  contentContainerStyle={styles.contactsListContent}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <UrduText style={styles.emptyText}>کوئی سرگرمی نہیں ملی ({activitiesList.length})</UrduText>
                    </View>
                  }
                  // onLayout={() => console.log('[AutoQuestionInput] Activities FlatList onLayout, data length:', activitiesList.length)}
                  // onContentSizeChange={() => console.log('[AutoQuestionInput] Activities FlatList onContentSizeChange, data length:', activitiesList.length)}
                  getItemLayout={(data, index) => ({
                    length: 60, // Height of each activity item
                    offset: 60 * index,
                    index,
                  })}
                />

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handlePopupClose}
                  >
                    <UrduText style={styles.cancelButtonText}>منسوخ کریں</UrduText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.okButton}
                    onPress={handleActivitiesPopupOK}
                  >
                    <UrduText style={styles.okButtonText}>ٹھیک ہے ({activitiesList.filter(a => a.status === 'published').length})</UrduText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Strength Records Popup Modal */}
      <Modal
        visible={showStrengthPopup}
        transparent={true}
        animationType="slide"
        onRequestClose={handlePopupClose}
        onShow={() => {
          // console.log('[AutoQuestionInput] Strength Modal opened, strengthRecordsList:', {
          //   length: strengthRecordsList.length,
          //   firstFew: strengthRecordsList.slice(0, 3),
          //   hasData: strengthRecordsList.length > 0
          // });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <UrduText style={styles.modalTitle}>
                {question.aggregate_func === 'plus' ? `${getStrengthTypeSingularLabel()} اضافہ` : 
                 question.aggregate_func === 'minus' ? `${getStrengthTypeSingularLabel()} کمی` : 
                 `${getStrengthTypeLabel()} ریکارڈز`}
              </UrduText>
              <TouchableOpacity onPress={handlePopupClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {strengthLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
              </View>
            ) : strengthError ? (
              <View style={styles.errorContainer}>
                <UrduText style={styles.errorText}>{strengthError}</UrduText>
              </View>
            ) : (
              <>
                <View style={styles.listHeader}>
                  <UrduText style={styles.listHeaderText}>
                    کل {strengthRecordsList.length} {getStrengthTypeSingularLabel()} ریکارڈ
                  </UrduText>
                </View>
                
                <FlatList
                  data={strengthRecordsList}
                  renderItem={renderStrengthRecordItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.contactsList}
                  contentContainerStyle={styles.contactsListContent}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <UrduText style={styles.emptyText}>کوئی {getStrengthTypeSingularLabel()} ریکارڈ نہیں ملا ({strengthRecordsList.length})</UrduText>
                    </View>
                  }
                  // onLayout={() => console.log('[AutoQuestionInput] Strength FlatList onLayout, data length:', strengthRecordsList.length)}
                  // onContentSizeChange={() => console.log('[AutoQuestionInput] Strength FlatList onContentSizeChange, data length:', strengthRecordsList.length)}
                  getItemLayout={(data, index) => ({
                    length: 60, // Height of each strength record item
                    offset: 60 * index,
                    index,
                  })}
                />

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handlePopupClose}
                  >
                    <UrduText style={styles.cancelButtonText}>منسوخ کریں</UrduText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.okButton}
                    onPress={handleStrengthPopupOK}
                  >
                    <UrduText style={styles.okButtonText}>
                      ٹھیک ہے ({strengthRecordsList.length > 0 ? strengthRecordsList[0].new_total : 0})
                    </UrduText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  rightButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 100,
    maxWidth: 150,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    ...SHADOWS.small,
  },
  rightButtonLoading: {
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  rightButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageContainer: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  errorMessage: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'right',
  },
  successMessage: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'right',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: '90%',
    maxHeight: '90%',
    minHeight: 500,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
  },
  errorContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
    textAlign: 'center',
  },
  listHeader: {
    padding: SPACING.xs,
    backgroundColor: COLORS.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  contactsList: {
    flex: 1,
    maxHeight: 600,
    backgroundColor: '#f0f0f0', // Debug background color
  },
  contactsListContent: {
    flexGrow: 1,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    minHeight: 50,
  },
  contactPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
    flex: 1,
    writingDirection: 'rtl',

  },
  contactName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'left',
    flex: 1,
    marginLeft: SPACING.sm,
    writingDirection: 'rtl',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.xs,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  okButton: {
    flex: 1,
    padding: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Strength record styles
  strengthRecordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    minHeight: 60,
  },
  strengthRecordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  changeTypeBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  changeTypeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  strengthRecordValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  strengthRecordRight: {
    alignItems: 'flex-end',
  },
  strengthRecordTotal: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  strengthRecordDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  // Activity item styles
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    minHeight: 60,
  },
  activityItemLeft: {
    alignItems: 'flex-start',
    flex: 1,
  },
  activityTypeName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
  },
  activityDate: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activityStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  activityItemRight: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: SPACING.md,
    gap: SPACING.xs,
  },
  activityLocation: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
  },
});

export default AutoQuestionInput; 