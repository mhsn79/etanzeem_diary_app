import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  fetchBaitulmalTypes,
  selectBaitulmalTypes
} from '@/app/features/baitulmal/baitulmalSlice';
import { directApiRequest } from '@/app/services/apiClient';
import { router } from 'expo-router';
import i18n from '@/app/i18n';
import { ReportQuestion, ReportAnswer } from '../features/qa/types';
import { saveAnswer } from '../features/qa/qaSlice';
import { getCalculationButtonText } from '../features/qa/utils';
import { AppDispatch } from '../store';
import { selectUserUnitDetails, selectUserUnitHierarchyIds } from '../features/tanzeem/tanzeemSlice';
import { selectManagementReportsList, selectReportSubmissions } from '../features/reports/reportsSlice';
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
  plus_value: number;
  minus_value: number;
  previous_total: number;
  new_total: number;
  report_year: number;
  report_month: number;
}

interface BaitulmalRecord {
  id: number;
  Type: number;
  amount: number;
  notes?: string | null;
  status: string;
  report_month: number;
  report_year: number;
  Tanzeemi_Unit: number;
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
  const baitulmalTypes = useAppSelector(selectBaitulmalTypes);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationSuccess, setCalculationSuccess] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(String(value || ''));

  // Debounce timer for typing in editable auto questions
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, []);
  
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

  // Popup state for baitulmal
  const [showBaitulmalPopup, setShowBaitulmalPopup] = useState(false);
  const [baitulmalList, setBaitulmalList] = useState<BaitulmalRecord[]>([]);
  const [baitulmalLoading, setBaitulmalLoading] = useState(false);
  const [baitulmalError, setBaitulmalError] = useState<string | null>(null);

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
    if (baitulmalTypes.length === 0) {
      dispatch(fetchBaitulmalTypes());
    }
  }, [dispatch, contactTypes.length, activityTypes.length, strengthTypes.length, baitulmalTypes.length]);

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

  // Get contact type label for the current question
  const getContactTypeLabel = useCallback(() => {
    if (!question.linked_to_id || !contactTypes.length) {
      return 'افراد'; // Default fallback
    }

    const contactType = contactTypes.find(type => type.id === question.linked_to_id);
    if (contactType) {
      // Try to get plural label from the correct field
      return contactType.label_plural || i18n.t(contactType.type) || contactType.type;
    }

    return 'افراد'; // Default fallback
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
      return 'قوت'; // Default fallback
    }

    const strengthType = strengthTypes.find(type => type.id === Number(question.linked_to_id));

    if (strengthType) {
      return strengthType.Name_Plural || strengthType.Name_Singular || 'قوت';
    }

    return 'قوت'; // Default fallback
  }, [question.linked_to_id, strengthTypes]);

  // Get baitulmal type label for the current question
  const getBaitulmalTypeLabel = useCallback(() => {
    if (!question.linked_to_id || !baitulmalTypes.length) {
      return 'بیت المال'; // Default fallback
    }

    const baitulmalType = baitulmalTypes.find(type => type.id === question.linked_to_id);
    if (baitulmalType) {
      return baitulmalType.Name || 'بیت المال';
    }

    return 'بیت المال'; // Default fallback
  }, [question.linked_to_id, baitulmalTypes]);

  // Fetch contacts for popup
  const fetchContactsForPopup = useCallback(async (): Promise<Person[]> => {
    if (!question.linked_to_id) {
      setContactsError('سوال درست طریقے سے ترتیب نہیں دیا گیا');
      return [];
    }

    setContactsLoading(true);
    setContactsError(null);

    try {
      const reportingPeriod = getCurrentReportingPeriod();
      
      // Build filter based on aggregate function
      let dateFilter = {};
      
      if (question.aggregate_func === 'plus') {
        // Rukun uses Rukinat_Date, Umeedwar/Karkun use date_created
        const ct = contactTypes.find((c: any) => c.id === question.linked_to_id);
        const isRukun = ct?.type === 'rukun';
        const dateField = isRukun ? 'Rukinat_Date' : 'date_created';

        const unitIdToUse = currentUnitId || userUnitDetails?.id;
        const lastDayOfMonth = new Date(reportingPeriod.year, reportingPeriod.month, 0).getDate();
        const startDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-01`;
        const endDate = `${reportingPeriod.year}-${String(reportingPeriod.month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

        dateFilter = {
          _and: [
            { status: { _neq: 'archived' } },
            { Tanzeemi_Unit: { _eq: unitIdToUse } },
            { [dateField]: { _nnull: true } },
            { [dateField]: { _gte: startDate } },
            { [dateField]: { _lte: endDate } },
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
      
      const response = await directApiRequest<{ data: Person[] }>(
        url,
        'GET'
      );

      if (response.data) {
        setContactsList(response.data);
        return response.data;
      } else {
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
  }, [question.linked_to_id, question.aggregate_func, getCurrentReportingPeriod, userUnitDetails?.id, currentUnitId, contactTypes, getContactTypeLabel]);

  // Fetch activities for popup
  const fetchActivitiesForPopup = useCallback(async (): Promise<Activity[]> => {
    if (!question.linked_to_id) {
      setActivitiesError('سوال درست طریقے سے ترتیب نہیں دیا گیا');
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
      
      const response = await directApiRequest<{ data: Activity[] }>(
        url,
        'GET'
      );

      if (response.data) {
        setActivitiesList(response.data);
        return response.data;
      } else {
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

  // Fetch baitulmal records for popup
  const fetchBaitulmalForPopup = useCallback(async (): Promise<BaitulmalRecord[]> => {
    if (!question.linked_to_id) {
      setBaitulmalError('سوال درست طریقے سے ترتیب نہیں دیا گیا');
      return [];
    }

    setBaitulmalLoading(true);
    setBaitulmalError(null);

    try {
      const reportingPeriod = getCurrentReportingPeriod();
      const unitId = currentUnitId || userUnitDetails?.id;

      const filter = {
        _and: [
          { Type: { _eq: question.linked_to_id } },
          { Tanzeemi_Unit: { _eq: unitId } },
          { report_month: { _eq: reportingPeriod.month } },
          { report_year: { _eq: reportingPeriod.year } },
          { status: { _neq: 'archived' } },
        ],
      };

      const params = new URLSearchParams();
      params.append('filter', JSON.stringify(filter));
      params.append('fields', 'id,Type,amount,notes,status,report_month,report_year,Tanzeemi_Unit');
      params.append('limit', '-1');

      const url = `/items/baitulmal_records?${params.toString()}`;

      const response = await directApiRequest<{ data: BaitulmalRecord[] }>(
        url,
        'GET'
      );

      if (response.data) {
        setBaitulmalList(response.data);
        return response.data;
      } else {
        setBaitulmalList([]);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching baitulmal records:', error);
      setBaitulmalError(`${getBaitulmalTypeLabel()} حاصل کرنے میں ناکامی`);
      return [];
    } finally {
      setBaitulmalLoading(false);
    }
  }, [question.linked_to_id, getCurrentReportingPeriod, currentUnitId, userUnitDetails?.id, getBaitulmalTypeLabel]);

  // Fetch single monthly strength record for a given type/unit/month
  const fetchMonthlyStrengthRecord = useCallback(async (): Promise<StrengthRecord | null> => {
    if (!question.linked_to_id) return null;

    const reportingPeriod = getCurrentReportingPeriod();
    const unitIdToUse = currentUnitId || userUnitDetails?.id;

    const filter = JSON.stringify({
      _and: [
        { Type: { _eq: question.linked_to_id } },
        { Tanzeemi_Unit: { _eq: unitIdToUse } },
        { report_year: { _eq: reportingPeriod.year } },
        { report_month: { _eq: reportingPeriod.month } },
      ],
    });

    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}&limit=1`,
      'GET'
    );

    return response.data?.[0] || null;
  }, [question.linked_to_id, getCurrentReportingPeriod, currentUnitId, userUnitDetails?.id]);

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

  // Handle popup open for baitulmal
  const handleBaitulmalPopupOpen = useCallback(() => {
    setShowBaitulmalPopup(true);
    fetchBaitulmalForPopup();
  }, [fetchBaitulmalForPopup]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setShowContactsPopup(false);
    setShowActivitiesPopup(false);
    setShowBaitulmalPopup(false);
    setContactsList([]);
    setActivitiesList([]);
    setBaitulmalList([]);
    setContactsError(null);
    setActivitiesError(null);
    setBaitulmalError(null);
  }, []);

  // Fetch count based on linked_to_type and update input value
  const handleFetchCount = useCallback(async () => {
    // For contacts, show popup instead of direct calculation
    if (question.linked_to_type === 'contacts') {
      handleContactsPopupOpen();
      return;
    }

    // For activities, show popup
    if (question.linked_to_type === 'activity') {
      handleActivitiesPopupOpen();
      return;
    }

    // For baitulmal, show popup
    if (question.linked_to_type === 'baitulmal') {
      handleBaitulmalPopupOpen();
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);
    setCalculationSuccess(null);
    try {
      if (!question.linked_to_id) {
        setCalculationError('سوال درست طریقے سے ترتیب نہیں دیا گیا');
        setIsCalculating(false);
        return;
      }

      let result: any;

      // Handle different linked_to_type cases
      if (question.linked_to_type === 'strength') {
        const reportingPeriod = getCurrentReportingPeriod();

        if (question.aggregate_func === 'avg') {
          // For avg, aggregate across hierarchy units for the month
          const aggResult = await dispatch(fetchStrengthCountAndTotals({
            linkedToId: question.linked_to_id ?? 0,
            year: reportingPeriod.year,
            month: reportingPeriod.month,
          })).unwrap();
          result = aggResult.avg;
          setCalculationSuccess(`${getStrengthTypeLabel()} کی معلومات کامیابی سے حاصل ہو گئیں`);
        } else {
          // For plus, minus, total, sum, count - fetch the single monthly record
          const monthlyRecord = await fetchMonthlyStrengthRecord();

          if (monthlyRecord) {
            switch (question.aggregate_func) {
              case 'plus':
                result = monthlyRecord.plus_value || 0;
                break;
              case 'minus':
                result = monthlyRecord.minus_value || 0;
                break;
              case 'total':
              case 'sum':
              case 'count':
              default:
                result = monthlyRecord.new_total || 0;
                break;
            }
            setCalculationSuccess(`${getStrengthTypeLabel()} کی تعداد کامیابی سے حاصل ہو گئی`);
          } else {
            result = 0;
            setCalculationSuccess(`${getStrengthTypeLabel()} کے لیے اس مہینے کوئی اندراج نہیں ملا`);
          }
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
          setCalculationSuccess(`${getContactTypeLabel()} کے لیے کوئی اندراج نہیں ملا`);
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
        } else if (question.aggregate_func === 'avg') {
          // Calculate average attendance of published activities
          const publishedWithAttendance = activities.filter(
            (a: any) => a.status === 'published' && a.attendance != null && a.attendance > 0
          );
          if (publishedWithAttendance.length > 0) {
            const totalAttendance = publishedWithAttendance.reduce(
              (sum: number, a: any) => sum + Number(a.attendance), 0
            );
            result = Math.round(totalAttendance / publishedWithAttendance.length);
          } else {
            result = 0;
          }
          setCalculationSuccess(`${getActivityTypeLabel()} کی اوسط حاضری کامیابی سے حاصل ہو گئی`);
        } else if (question.aggregate_func === 'array') {
          // Comma-separated list of attendance values from published activities
          const publishedWithAttendance = activities.filter(
            (a: any) => a.status === 'published' && a.attendance != null
          );
          const attendanceList = publishedWithAttendance.map((a: any) => String(a.attendance)).join(', ');
          // Set as string value directly (bypass numeric result)
          setInputValue(attendanceList);
          if (onValueChange) {
            onValueChange(attendanceList);
          }
          setCalculationSuccess(`${getActivityTypeLabel()} کی حاضری کی فہرست کامیابی سے حاصل ہو گئی`);
          setTimeout(() => setCalculationSuccess(null), 3000);
          setIsCalculating(false);
          return;
        } else {
          result = 0;
          setCalculationSuccess(`${getActivityTypeLabel()} کے لیے کوئی اندراج نہیں ملا`);
        }
      } else {
        setCalculationError('سوال کی قسم نامعلوم ہے');
        setIsCalculating(false);
        return;
      }

      setInputValue(String(result));
      if (onValueChange) {
        onValueChange(result);
      }
      setTimeout(() => setCalculationSuccess(null), 3000);
    } catch (error: any) {
      setCalculationError('تعداد حاصل کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsCalculating(false);
    }
  }, [dispatch, question, onValueChange, handleContactsPopupOpen, handleActivitiesPopupOpen, handleBaitulmalPopupOpen, fetchMonthlyStrengthRecord, getCurrentReportingPeriod, fetchContactsForPopup, fetchActivitiesForPopup, getStrengthTypeLabel, getContactTypeLabel, getActivityTypeLabel]);

  // Navigate to the source screen for this question's linked data
  const handleNavigateToSource = useCallback(() => {
    const period = getCurrentReportingPeriod();

    switch (question.linked_to_type) {
      case 'strength':
        router.push({
          pathname: '/screens/Workforce',
          params: {
            preSelectedMonth: String(period.month),
            preSelectedYear: String(period.year),
          },
        });
        break;
      case 'contacts': {
        const ct = contactTypes.find((c: any) => c.id === question.linked_to_id);
        router.push(`/screens/(tabs)/Arkan?contactType=${ct?.type || ''}`);
        break;
      }
      case 'activity':
        router.push({
          pathname: '/screens/(tabs)/Activities',
          params: {
            preSelectedTab: '1',
            preSelectedMonth: String(period.month),
            preSelectedYear: String(period.year),
          },
        });
        break;
      case 'baitulmal':
        router.push({
          pathname: '/screens/Baitulmal',
          params: {
            preSelectedMonth: String(period.month),
            preSelectedYear: String(period.year),
          },
        });
        break;
    }
  }, [question.linked_to_type, question.linked_to_id, getCurrentReportingPeriod, contactTypes]);

  // Get button text based on aggregate function
  const buttonText = getCalculationButtonText(question.aggregate_func || null);

  // Get icon based on aggregate function
  const buttonIcon = useMemo(() => {
    switch (question.aggregate_func) {
      case 'sum':
      case 'total':
        return 'add-circle-outline';
      case 'count':
        return 'list-outline';
      case 'avg':
        return 'analytics-outline';
      case 'plus':
        return 'add-circle-outline';
      case 'minus':
        return 'remove-circle-outline';
      case 'array':
        return 'list-outline';
      default:
        return 'calculator-outline';
    }
  }, [question.aggregate_func]);

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
      case 'baitulmal':
        return getBaitulmalTypeLabel();
      default:
        return '';
    }
  }, [question.linked_to_type, getContactTypeLabel, getActivityTypeLabel, getStrengthTypeLabel, getBaitulmalTypeLabel]);

  // Get the appropriate singular label based on linked_to_type
  const getTypeSingularLabel = useCallback(() => {
    switch (question.linked_to_type) {
      case 'contacts':
        return getContactTypeLabel(); // Use same for contacts
      case 'activity':
        return getActivityTypeLabel(); // Use same for activity
      case 'strength':
        return getStrengthTypeSingularLabel();
      case 'baitulmal':
        return getBaitulmalTypeLabel();
      default:
        return '';
    }
  }, [question.linked_to_type, getContactTypeLabel, getActivityTypeLabel, getStrengthTypeSingularLabel, getBaitulmalTypeLabel]);

  // Urdu labels for linked_to_type (fallback)
  const linkedTypeUrdu: Record<string, string> = {
    activity: 'سرگرمی',
    contacts: 'رابطہ',
    strength: 'قوت',
    baitulmal: 'بیت المال',
  };

  // Memoize published activities count to avoid repeated filtering in JSX
  const publishedActivitiesCount = useMemo(
    () => activitiesList.filter(a => a.status === 'published').length,
    [activitiesList]
  );

  // Compute the popup result value based on aggregate_func
  const activitiesPopupValue = useMemo(() => {
    const published = activitiesList.filter(a => a.status === 'published');
    if (question.aggregate_func === 'avg') {
      const withAttendance = published.filter((a: any) => a.attendance != null && a.attendance > 0);
      if (withAttendance.length === 0) return 0;
      const total = withAttendance.reduce((sum: number, a: any) => sum + Number(a.attendance), 0);
      return Math.round(total / withAttendance.length);
    }
    if (question.aggregate_func === 'array') {
      const withAttendance = published.filter((a: any) => a.attendance != null);
      return withAttendance.map((a: any) => String(a.attendance)).join(', ');
    }
    return published.length;
  }, [activitiesList, question.aggregate_func]);

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
    setInputValue(String(activitiesPopupValue));
    if (onValueChange) {
      onValueChange(activitiesPopupValue);
    }
    setShowActivitiesPopup(false);
    setCalculationSuccess(`${buttonText} (${getTypeLabel()}): ${activitiesPopupValue}`);
    setTimeout(() => setCalculationSuccess(null), 3000);
  }, [activitiesPopupValue, onValueChange, getTypeLabel, buttonText]);

  // Compute the baitulmal popup result value based on aggregate_func
  const baitulmalPopupValue = useMemo(() => {
    if (question.aggregate_func === 'count') {
      return baitulmalList.length;
    }
    // sum/total - sum all amounts
    return baitulmalList.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [baitulmalList, question.aggregate_func]);

  // Handle OK button in baitulmal popup
  const handleBaitulmalPopupOK = useCallback(() => {
    setInputValue(String(baitulmalPopupValue));
    if (onValueChange) {
      onValueChange(baitulmalPopupValue);
    }
    setShowBaitulmalPopup(false);
    const label = question.aggregate_func === 'count'
      ? `${getBaitulmalTypeLabel()} کی کل تعداد: ${baitulmalPopupValue}`
      : `${getBaitulmalTypeLabel()} کی کل رقم: ${baitulmalPopupValue.toLocaleString('en-US')}`;
    setCalculationSuccess(label);
    setTimeout(() => setCalculationSuccess(null), 3000);
  }, [baitulmalPopupValue, onValueChange, getBaitulmalTypeLabel, question.aggregate_func]);

  // Check if this question has auto-calculate capability
  const hasAutoCalculateCapability = Boolean(question.linked_to_type && question.linked_to_id);
  
  // Get the appropriate label for linked_to_type if question has auto-calculate capability
  const typeLabel = hasAutoCalculateCapability
    ? getTypeLabel()
    : '';

  // Right icon: fetch button + navigate button
  const rightIcon = (
    <View style={styles.rightButtonContainer}>
      {/* Navigate to source screen */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={handleNavigateToSource}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="open-outline" size={18} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Fetch value */}
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
              name={buttonIcon as any}
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
    </View>
  );

  // Render contact item for popup
  const renderContactItem = useCallback(({ item }: { item: Person }) => {
    // Use only the fields that exist in the API
    const personName = item.Name || 'نام نہیں ملا';
    const personPhone = item.Phone_Number || 'فون نمبر نہیں ملا';

    return (
      <View style={styles.contactItem}>
        <UrduText style={styles.contactName}>{personName}</UrduText>
        <Text style={styles.contactPhone}>{personPhone}</Text>
      </View>
    );
  }, []);

  // Render activity item for popup
  const renderActivityItem = useCallback(({ item }: { item: Activity }) => {
    const activityDate = item.activity_date_and_time 
      ? new Date(item.activity_date_and_time).toLocaleDateString('ur-PK')
      : 'تاریخ دستیاب نہیں';
    const activityStatus = item.status === 'published' ? 'جمع شدہ' : 
                          item.status === 'draft' ? 'مسودہ' : 
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
  }, [activityTypes]);

  // Render baitulmal item for popup
  const renderBaitulmalItem = useCallback(({ item }: { item: BaitulmalRecord }) => {
    const typeName = baitulmalTypes.find(t => t.id === item.Type)?.Name || 'نامعلوم';
    const formattedAmount = Number(item.amount).toLocaleString('en-US');

    return (
      <View style={styles.baitulmalItem}>
        <View style={styles.baitulmalItemLeft}>
          <UrduText style={styles.baitulmalTypeName}>{typeName}</UrduText>
          {item.notes ? (
            <UrduText style={styles.baitulmalNotes} numberOfLines={1}>{item.notes}</UrduText>
          ) : null}
        </View>
        <UrduText style={styles.baitulmalAmount}>{formattedAmount} روپے</UrduText>
      </View>
    );
  }, [baitulmalTypes]);

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
            // Debounce save to avoid API call per keystroke
            if (typingDebounceRef.current) {
              clearTimeout(typingDebounceRef.current);
            }
            typingDebounceRef.current = setTimeout(() => {
              onValueChange(text);
            }, 500);
          }
        }}
        onBlur={() => {
          // On blur, flush pending debounce and save immediately
          if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
            typingDebounceRef.current = null;
          }
          if (onValueChange && inputValue !== String(value || '')) {
            onValueChange(inputValue);
          }
        }}
        placeholder={hasAutoCalculateCapability ? (isEditable ? "نمبر درج کریں یا ڈیٹا کےلئے بٹن کلک کریں" : "ڈیٹا کےلئے بٹن کلک کریں") : "ڈیٹا کےلئے بٹن کلک کریں"}
        keyboardType={question.input_type === 'number' ? 'numeric' : 'default'}
        editable={isEditable}
        disabled={disabled}
        loading={isCalculating}
        rightIcon={hasAutoCalculateCapability ? rightIcon : undefined}
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
                <UrduText style={styles.loadingText}>معلومات حاصل کی جا رہی ہیں...</UrduText>
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
                      <UrduText style={styles.emptyText}>کوئی {getContactTypeLabel()} نہیں ملے</UrduText>
                    </View>
                  }
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
                <UrduText style={styles.loadingText}>معلومات حاصل کی جا رہی ہیں...</UrduText>
              </View>
            ) : activitiesError ? (
              <View style={styles.errorContainer}>
                <UrduText style={styles.errorText}>{activitiesError}</UrduText>
              </View>
            ) : (
              <>
                <View style={styles.listHeader}>
                  <UrduText style={styles.listHeaderText}>
                    کل {activitiesList.length} سرگرمی (جمع شدہ: {publishedActivitiesCount})
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
                      <UrduText style={styles.emptyText}>کوئی سرگرمی نہیں ملی</UrduText>
                    </View>
                  }
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
                    <UrduText style={styles.okButtonText}>ٹھیک ہے ({activitiesPopupValue})</UrduText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Baitulmal Popup Modal */}
      <Modal
        visible={showBaitulmalPopup}
        transparent={true}
        animationType="slide"
        onRequestClose={handlePopupClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <UrduText style={styles.modalTitle}>
                {getBaitulmalTypeLabel()}
              </UrduText>
              <TouchableOpacity onPress={handlePopupClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {baitulmalLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <UrduText style={styles.loadingText}>معلومات حاصل کی جا رہی ہیں...</UrduText>
              </View>
            ) : baitulmalError ? (
              <View style={styles.errorContainer}>
                <UrduText style={styles.errorText}>{baitulmalError}</UrduText>
              </View>
            ) : (
              <>
                <View style={styles.listHeader}>
                  <UrduText style={styles.listHeaderText}>
                    {question.aggregate_func === 'count'
                      ? `کل ${baitulmalList.length} اندراجات`
                      : `کل رقم: ${baitulmalPopupValue.toLocaleString('en-US')} روپے (${baitulmalList.length} اندراجات)`}
                  </UrduText>
                </View>

                <FlatList
                  data={baitulmalList}
                  renderItem={renderBaitulmalItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.contactsList}
                  contentContainerStyle={styles.contactsListContent}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <UrduText style={styles.emptyText}>کوئی {getBaitulmalTypeLabel()} کا اندراج نہیں ملا</UrduText>
                    </View>
                  }
                  getItemLayout={(data, index) => ({
                    length: 50,
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
                    onPress={handleBaitulmalPopupOK}
                  >
                    <UrduText style={styles.okButtonText}>
                      ٹھیک ہے ({question.aggregate_func === 'count' ? baitulmalList.length : baitulmalPopupValue.toLocaleString('en-US')})
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
  rightButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    height: 40,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.white,
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
  // Baitulmal item styles
  baitulmalItem: {
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
  baitulmalItemLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  baitulmalTypeName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  baitulmalNotes: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  baitulmalAmount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
});

export default AutoQuestionInput; 