import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Clipboard,
  Alert,
  InteractionManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';


import {
  fetchReportsByUnitId,
  selectManagementReportsList,
  selectReportSubmissions,
  selectReportsError,
  selectReportsLoading,
  fetchReportSubmissions,
} from '@/app/features/reports/reportsSlice';
import { selectUserUnitDetails } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store/types';
import { formatExpectedCompletion, getUrduMonth } from '@/app/constants/urduLocalization';
import { useTokenRefresh } from '@/app/utils/tokenRefresh';
import { ROUTES } from '@/app/constants/navigation';
import UrduText from '@/app/components/UrduText';
import Header from '@/app/components/Header';
import { BORDER_RADIUS, COLORS, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import { COMMON_IMAGES } from '@/app/constants/images';
import { TabGroup } from '@/app/components/Tab';
import ReportCard from './ReportCard';
import { logout } from '@/app/features/auth/authSlice';
import {
  initializeReportData,
  selectOverallProgressForSubmission,
  selectCurrentSubmissionId,
  selectQAState
} from '@/app/features/qa/qaSlice';

export type OpenReportParams = {
  submissionId: number;
  templateId: number;
  managementId: number;
  unitId: number;
  mode: 'edit' | 'view';
  status?: string;
};

interface ReportsViewProps {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
  extraScrollContentStyle?: object;
  selectedUnit?: any;
  selectedUnitId?: number;
  /** When set, opening current report calls this instead of router (keeps flow inside Reports tab). */
  onOpenReport?: (params: OpenReportParams) => void;
}

// Helper function to determine if a management period is currently open
const isManagementPeriodOpen = (management: any): boolean => {
  if (!management || !management.reporting_start_date || !management.reporting_end_date) {
    return false;
  }
  
  const now = new Date();
  const startDate = new Date(management.reporting_start_date);
  const endDate = new Date(management.reporting_end_date);
  
  // Add extended days to end date if available
  if (management.extended_days && management.extended_days > 0) {
    endDate.setDate(endDate.getDate() + management.extended_days);
  }
  
  // Normalize dates to start of day for comparison (remove time component)
  const nowNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  const isOpen = nowNormalized >= startDateNormalized && nowNormalized <= endDateNormalized;
  
  return isOpen;
};

// Helper function to find the currently open management period
const findCurrentlyOpenManagement = (managements: any[]): any => {
  if (!managements || managements.length === 0) {
    return null;
  }
  
  // Sort managements by start date (newest first)
  const sortedManagements = [...managements].sort((a, b) => {
    const dateA = new Date(a.reporting_start_date).getTime();
    const dateB = new Date(b.reporting_start_date).getTime();
    return dateB - dateA;
  });
  
  // Find the first management period that is currently open
  return sortedManagements.find(management => isManagementPeriodOpen(management)) || null;
};

// Helper function to check if the deadline (reporting_end_date + extended_days) has passed
const isDeadlinePassed = (management: any): boolean => {
  if (!management || !management.reporting_end_date) {
    return true; // No deadline info = treat as passed (read-only)
  }

  const now = new Date();
  const endDate = new Date(management.reporting_end_date);

  // Add extended days to end date if available
  if (management.extended_days && management.extended_days > 0) {
    endDate.setDate(endDate.getDate() + management.extended_days);
  }

  // Normalize dates to start of day for comparison
  const nowNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  return nowNormalized > endDateNormalized;
};

// Helper function to find existing draft submission for a management period
const findDraftSubmissionForManagement = (submissions: any[], mgmtId: number): any => {
  return submissions.find(submission => 
    submission.mgmt_id === mgmtId && 
    (submission.status === 'draft' || submission.status === 'pending')
  );
};

const ReportsView: React.FC<ReportsViewProps> = ({
  showHeader = false,
  title = "رپورٹ مینجمنٹ",
  onBack,
  extraScrollContentStyle = {},
  selectedUnit,
  selectedUnitId,
  onOpenReport,
}) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Use our token refresh hook
  const { refreshTokenIfNeeded, ensureFreshTokenBeforeOperation } = useTokenRefresh();
  
  // Track the latest submission ID to highlight it
  const [latestSubmissionId, setLatestSubmissionId] = useState<number | null>(null);
  
  // Animation value for highlighting new submissions
  const highlightAnim = useRef(new Animated.Value(0)).current;
  
  // Ref to track which submissions we've already highlighted
  const highlightedSubmissionsRef = useRef<Set<number>>(new Set());
  
  // Ref to track if we need to reset the highlighted submissions
  const shouldResetHighlightedRef = useRef(false);
  
  // Ref to track if we've already initialized QA data in this session
  const qaInitializedRef = useRef<boolean>(false);
  
  // Ref to track the last template ID we initialized QA data for
  const lastTemplateIdRef = useRef<number | null>(null);
  
  // Ref to track the last management ID we initialized QA data for
  const lastMgmtIdRef = useRef<number | null>(null);
  
  // Ref to track if we've already fetched data for the current unit
  const lastFetchedUnitIdRef = useRef<number | null>(null);
  
  // Ref to track the last fetch time to prevent rapid successive calls
  const lastFetchTimeRef = useRef<number>(0);



  // Redux state
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const reportSubmissions = useSelector(selectReportSubmissions) ?? [];
  const reportMgmtDetails = useSelector(selectManagementReportsList) ?? [];
  const loading = useSelector(selectReportsLoading);
  const error = useSelector(selectReportsError);
  
  // QA module state
  const qaState = useSelector(selectQAState);
  const currentSubmissionId = useSelector(selectCurrentSubmissionId);
  
  // Debug loading state
  useEffect(() => {
    console.log('[ReportsView] Loading state changed:', {
      loading,
      error,
      reportMgmtDetailsLength: reportMgmtDetails.length,
      reportSubmissionsLength: reportSubmissions.length,
      qaStateStatus: qaState.status,
      qaStateError: qaState.error
    });
  }, [loading, error, reportMgmtDetails.length, reportSubmissions.length, qaState.status, qaState.error]);
  
  // Get tanzeem state for level information
  const tanzeemState = useSelector((state: any) => state.tanzeem);

  // Use selected unit if available, otherwise fall back to user unit
  const displayUnit = selectedUnit || userUnitDetails;
  const displayUnitId = selectedUnitId || userUnitDetails?.id;
  


  // Find the correct template and management for the selected unit's level
  const currentTemplateAndManagement = useMemo(() => {
    console.log('[ReportsView] currentTemplateAndManagement check:', {
      displayUnitLevelId: displayUnit?.Level_id,
      reportMgmtDetailsLength: reportMgmtDetails.length,
      displayUnit
    });
    
    if (!displayUnit?.Level_id || reportMgmtDetails.length === 0) {
      console.log('[ReportsView] No unit level or report management details available');
      return { template: null, management: null };
    }
    
    // Find the template that matches the unit's level
    const matchingTemplate = reportMgmtDetails.find(report => 
      report.template.unit_level_id === displayUnit.Level_id
    );
    
    console.log('[ReportsView] Template search result:', {
      matchingTemplate: matchingTemplate ? {
        templateId: matchingTemplate.template?.id,
        templateName: matchingTemplate.template?.report_name,
        unitLevelId: matchingTemplate.template?.unit_level_id,
        managementsCount: matchingTemplate.managements?.length
      } : null,
      allTemplates: reportMgmtDetails.map(report => ({
        templateId: report.template?.id,
        templateName: report.template?.report_name,
        unitLevelId: report.template?.unit_level_id
      })),
      unitLevelId: displayUnit.Level_id,
      unitName: displayUnit.Name
    });
    
    if (!matchingTemplate) {
      console.log('[ReportsView] No matching template found for level:', displayUnit.Level_id);
      return { template: null, management: null };
    }
    
    // Find the latest open management for this template
    const openManagement = findCurrentlyOpenManagement(matchingTemplate.managements);
    
    // If no open management found, use the most recent management as fallback (copy before sort - Redux state is immutable)
    const fallbackManagement = matchingTemplate.managements.length > 0 
      ? [...matchingTemplate.managements].sort((a, b) => {
          const dateA = new Date(a.reporting_start_date).getTime();
          const dateB = new Date(b.reporting_start_date).getTime();
          return dateB - dateA;
        })[0]
      : null;
    
    const management = openManagement || fallbackManagement;
    
    console.log('[ReportsView] Template and management found:', {
      templateId: matchingTemplate.template?.id,
      templateName: matchingTemplate.template?.report_name,
      managementId: management?.id,
      managementStatus: management?.status,
      isOpen: openManagement ? true : false,
      usingFallback: !openManagement && fallbackManagement ? true : false
    });
    
    return {
      template: matchingTemplate.template,
      management: management
    };
  }, [displayUnit?.Level_id, reportMgmtDetails]);

  // Find currently open management for the selected unit's level (used only for picking "current vs most recent" submission)
  const currentlyOpenManagement = currentTemplateAndManagement.management;
  const currentTemplate = currentTemplateAndManagement.template;

  // Find existing submission for the selected unit (current management, else most recent)
  const existingSubmission = useMemo(() => {
    if (!displayUnitId) {
      console.log('[ReportsView] No display unit ID for existing submission check');
      return null;
    }
    
    // First try to find submission for current management if available
    if (currentlyOpenManagement) {
      const existing = reportSubmissions.find(submission => 
        submission.unit_id === displayUnitId &&
        submission.mgmt_id === currentlyOpenManagement.id
      );
      
      if (existing) {
        console.log('[ReportsView] Found submission for current management:', {
          managementId: currentlyOpenManagement.id,
          unitId: displayUnitId,
          submissionId: existing.id,
          submissionStatus: existing.status
        });
        return existing;
      }
    }
    
    // If no submission found for current management, find the most recent submission for this unit
    const unitSubmissions = reportSubmissions.filter(submission => 
      submission.unit_id === displayUnitId
    );
    
    if (unitSubmissions.length > 0) {
      // Sort by date_created in descending order and take the most recent (copy before sort - avoid mutating selector data)
      const mostRecent = [...unitSubmissions].sort((a, b) => {
        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
        return dateB - dateA;
      })[0];
      
      console.log('[ReportsView] Found most recent submission for unit:', {
        unitId: displayUnitId,
        submissionId: mostRecent.id,
        submissionStatus: mostRecent.status,
        managementId: mostRecent.mgmt_id
      });
      
      return mostRecent;
    }
    
    console.log('[ReportsView] No submission found for unit:', {
      unitId: displayUnitId,
      submissionsCount: reportSubmissions.length
    });
    
    return null;
  }, [reportSubmissions.length, currentlyOpenManagement?.id, displayUnitId]);

  // Management and template for the selected submission (always use submission's own mgmt_id, never mix with open mgmt)
  const submissionManagementAndTemplate = useMemo(() => {
    if (!existingSubmission) return { management: null, template: null };
    const management = reportMgmtDetails
      .flatMap((r) => r.managements)
      .find((m) => m.id === existingSubmission.mgmt_id);
    const template = reportMgmtDetails.find(
      (r) => r.template?.id === existingSubmission.template_id
    )?.template;
    return { management, template };
  }, [existingSubmission?.id, existingSubmission?.mgmt_id, existingSubmission?.template_id, reportMgmtDetails]);

  // Find existing draft submission for the selected unit
  const existingDraftSubmission = useMemo(() => {
    if (!displayUnitId) return null;
    
    // First try to find draft submission for current management if available
    if (currentlyOpenManagement) {
      const draft = reportSubmissions.find(submission => 
        submission.unit_id === displayUnitId &&
        submission.mgmt_id === currentlyOpenManagement.id && 
        (submission.status === 'draft' || submission.status === 'pending')
      );
      
      if (draft) return draft;
    }
    
    // If no draft found for current management, find the most recent draft for this unit
    const unitDrafts = reportSubmissions.filter(submission => 
      submission.unit_id === displayUnitId &&
      (submission.status === 'draft' || submission.status === 'pending')
    );
    
    if (unitDrafts.length > 0) {
      // Sort by date_created in descending order and take the most recent (copy before sort - avoid mutating selector data)
      return [...unitDrafts].sort((a, b) => {
        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
        return dateB - dateA;
      })[0];
    }
    
    return null;
  }, [reportSubmissions.length, currentlyOpenManagement?.id, displayUnitId]);



  // Show موجودہ رپورٹ for any selected unit that has a submission
  const shouldShowCurrentReport = useMemo(() => {
    const shouldShow = Boolean(
      existingSubmission &&
      displayUnitId
    );
    console.log('[ReportsView] shouldShowCurrentReport check:', {
      existingSubmission: existingSubmission?.id,
      displayUnitId,
      shouldShow
    });
    return shouldShow;
  }, [existingSubmission?.id, displayUnitId]);

  // Memoized filtered submissions - exclude active submission from the list
  const filteredSubmissions = useMemo(() => {
    // First filter by unit (only show reports for the selected unit)
    const unitFiltered = reportSubmissions.filter((submission) => 
      submission.unit_id === displayUnitId
    );
    
    // Then filter by status based on selected tab
    const statusFiltered = unitFiltered.filter((submission) =>
      selectedTab === 0
        ? submission.status === 'draft' || submission.status === 'pending'
        : submission.status === 'published'
    );
    
    // Exclude the active submission from the filtered list
    const excludeActive = statusFiltered.filter((submission) => {
      // If we have an active submission, exclude it from the list below
      if (existingSubmission && submission.id === existingSubmission.id) {
        return false; // Exclude active submission
      }
      return true; // Include all other submissions
    });
    
    // Sort by parent reports_mgmt's start_date in descending order (newest first) (copy before sort - avoid mutating selector data)
    return [...excludeActive].sort((a, b) => {
      // Find management for submission A
      const managementA = reportMgmtDetails
        .flatMap((r) => r.managements)
        .find((m) => m.id === a.mgmt_id);
      
      // Find management for submission B  
      const managementB = reportMgmtDetails
        .flatMap((r) => r.managements)
        .find((m) => m.id === b.mgmt_id);
      
      // Get reporting_start_date for both managements
      const startDateA = managementA?.reporting_start_date ? new Date(managementA.reporting_start_date).getTime() : 0;
      const startDateB = managementB?.reporting_start_date ? new Date(managementB.reporting_start_date).getTime() : 0;
      
      // Sort in descending order (newest start_date first)
      return startDateB - startDateA;
    });
  }, [reportSubmissions.length, selectedTab, displayUnitId, existingSubmission?.id, reportMgmtDetails.length]);

  // Default back handler if none provided (defer to avoid Fabric viewState crash)
  const defaultBackHandler = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      router.canGoBack() ? router.back() : router.push(ROUTES.DASHBOARD);
    });
  }, [router]);

  // Use provided onBack or default handler
  const handleBack = onBack || defaultBackHandler;

  const handleViewAllReports = useCallback(() => {
    // Ensure we have a fresh token before navigation
    refreshTokenIfNeeded().then(() => {
      router.push(ROUTES.ALL_REPORTS);
    });
  }, [router, refreshTokenIfNeeded]);

  const handleEdit = useCallback(() => {
    // Ensure we have a fresh token before navigation
    refreshTokenIfNeeded().then(() => {
      router.push(ROUTES.SUBMITTED_REPORT);
    });
  }, [router, refreshTokenIfNeeded]);

  const handleCreateReport = useCallback(() => {
    // Always use the selected report submission's own mgmt_id (do not mix with open mgmt id)
    ensureFreshTokenBeforeOperation()
      .then(() => {
        if (existingSubmission && existingSubmission.id) {
          // Allow edit for draft reports, or for published reports if deadline hasn't passed
          const submissionMgmt = submissionManagementAndTemplate.management;
          const canEdit = existingSubmission.status === 'draft' ||
            (existingSubmission.status === 'published' && !isDeadlinePassed(submissionMgmt));
          const mode = canEdit ? 'edit' : 'view';
          const params = {
            submissionId: existingSubmission.id.toString(),
            templateId: existingSubmission.template_id.toString(),
            managementId: existingSubmission.mgmt_id.toString(),
            unitId: existingSubmission.unit_id.toString(),
            status: existingSubmission.status ?? '',
            mode
          };
          console.log('[ReportsView] Opening report (using submission mgmt_id):', {
            ...params,
            submissionMgmtId: existingSubmission.mgmt_id,
            submissionTemplateId: existingSubmission.template_id
          });
          if (onOpenReport) {
            console.log('[ReportsView] Calling onOpenReport (in-tab flow), submissionId:', existingSubmission.id);
            onOpenReport({
              submissionId: existingSubmission.id!,
              templateId: existingSubmission.template_id,
              managementId: existingSubmission.mgmt_id,
              unitId: existingSubmission.unit_id,
              mode,
              status: existingSubmission.status
            });
            return;
          }
          router.replace({
            pathname: ROUTES.CREATE_REPORT,
            params
          });
          return;
        }
        const currentMgmt = currentlyOpenManagement;
        if (!currentMgmt) {
          console.warn('[ReportsView] No management period available for report creation');
          router.push(ROUTES.ALL_REPORTS);
          return;
        }
        if (currentTemplate?.id) {
          router.push({
            pathname: ROUTES.CREATE_REPORT,
            params: {
              templateId: currentTemplate.id.toString(),
              managementId: currentMgmt.id.toString(),
              unitId: displayUnit?.id?.toString() || ''
            }
          });
        } else {
          router.push(ROUTES.CREATE_REPORT);
        }
      })
      .catch(error => {
        console.error('[ReportsView] Error before opening report:', error);
      });
  }, [router, existingSubmission, currentlyOpenManagement?.id, displayUnit?.id, ensureFreshTokenBeforeOperation, currentTemplate?.id, submissionManagementAndTemplate.management]);

  // Combined function to fetch all necessary data with token refresh
  const fetchAllData = useCallback(async (forceQARefresh = false) => {
    try {
      if (!displayUnit?.id) {
        console.error('[ReportsView] Display unit details not available');
        return;
      }
      
      // Skip fetch if same unit and we loaded recently (keeps data in memory on quick tab switches)
      const now = Date.now();
      const REFETCH_ON_FOCUS_INTERVAL_MS = 60 * 1000; // 1 minute
      if (!forceQARefresh && lastFetchedUnitIdRef.current === displayUnit.id && now - lastFetchTimeRef.current < REFETCH_ON_FOCUS_INTERVAL_MS) {
        return;
      }
      
      // Mark fetch
      lastFetchedUnitIdRef.current = displayUnit.id;
      lastFetchTimeRef.current = now;
      
      // Only ensure fresh token if we're forcing refresh or haven't checked recently
      if (forceQARefresh || now - lastFetchTimeRef.current > 30000) { // 30 seconds
        await ensureFreshTokenBeforeOperation();
      }
      
      // Step 1: Fetch reports data
      await dispatch(fetchReportsByUnitId(displayUnit.id));
      
      // Step 2: Fetch submissions
      await dispatch(fetchReportSubmissions());
      
      // Step 3: Check if we need to initialize QA data
      // Get current template and management from the updated state
      const currentState = (dispatch as any).getState?.() || {};
      const currentReportMgmtDetails = currentState.reports?.reports || [];
      const currentSubmissions = currentState.reports?.reportSubmissions || [];
      
      // Find the current template and management
      const currentTemplate = currentReportMgmtDetails.find((report: any) => 
        report.template?.unit_level_id === displayUnit.Level_id
      )?.template;
      
      const currentManagement = currentTemplate ? 
        findCurrentlyOpenManagement(currentReportMgmtDetails.find((report: any) => 
          report.template?.id === currentTemplate.id
        )?.managements || []) : null;
      
      if (!currentTemplate?.id || !currentManagement) {
        return;
      }
      
      const templateId = currentTemplate.id;
      const managementId = currentManagement.id;
      
      // Only initialize QA data if:
      // 1. We're forcing a refresh, OR
      // 2. We haven't initialized it yet, OR
      // 3. The template or management ID has changed
      if (
        forceQARefresh || 
        !qaInitializedRef.current || 
        lastTemplateIdRef.current !== templateId ||
        lastMgmtIdRef.current !== managementId
      ) {
        try {
          await dispatch(initializeReportData({
            template_id: templateId,
            unit_id: displayUnit.id,
            mgmt_id: managementId
          }));
          
          // Update our refs to track that we've initialized QA data
          qaInitializedRef.current = true;
          lastTemplateIdRef.current = templateId;
          lastMgmtIdRef.current = managementId;
        } catch (qaError) {
          console.error('[ReportsView] Error initializing QA data:', qaError);
          // Don't rethrow - we want to continue even if QA initialization fails
        }
      }
    } catch (error) {
      console.error('[ReportsView] Error in fetchAllData:', error);
    }
  }, [displayUnit?.id, displayUnit?.Level_id, dispatch, ensureFreshTokenBeforeOperation]);



  // Only trigger fetch on unit change or force
  useEffect(() => {
    if (displayUnit?.id) {
      // Only fetch if we haven't fetched for this unit recently
      const now = Date.now();
      if (lastFetchedUnitIdRef.current !== displayUnit.id || now - lastFetchTimeRef.current > 5000) {
        console.log('[ReportsView] Unit changed or timeout reached, fetching data');
        lastFetchedUnitIdRef.current = null;
        lastFetchTimeRef.current = 0;
        fetchAllData(true);
      }
    }
    return () => {
      highlightedSubmissionsRef.current.clear();
      setLatestSubmissionId(null);
      qaInitializedRef.current = false;
      lastTemplateIdRef.current = null;
      lastMgmtIdRef.current = null;
      lastFetchedUnitIdRef.current = null;
      lastFetchTimeRef.current = 0;
    };
  }, [displayUnit?.id]);
  
  // Fetch on focus only if data is stale. Defer so we don't run in same frame as tab transition (avoids Fabric "Unable to find viewState for tag" when switching from Activities).
  useFocusEffect(
    useCallback(() => {
      console.log('[ReportsView] useFocusEffect triggered');
      shouldResetHighlightedRef.current = true;
      const id = setTimeout(() => {
        if (displayUnit?.id) {
          fetchAllData(false)
            .catch(error => {
              console.error('[ReportsView] Error fetching data on focus:', error);
            });
        } else {
          console.log('[ReportsView] No display unit ID available on focus');
        }
      }, 100);
      return () => {
        clearTimeout(id);
        console.log('[ReportsView] Screen losing focus');
      };
    }, [fetchAllData, displayUnit?.id])
  );
  
  // Effect to highlight the latest submission when reportSubmissions changes
  useEffect(() => {
    // Only run this effect if we have submissions
    if (reportSubmissions.length > 0) {
      // If we should reset highlighted submissions (e.g., when coming back from CreateReportScreen)
      if (shouldResetHighlightedRef.current) {
        highlightedSubmissionsRef.current.clear();
        shouldResetHighlightedRef.current = false;
      }
      
      // Sort submissions by date (newest first)
      const sortedSubmissions = [...reportSubmissions].sort((a, b) => {
        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
        return dateB - dateA;
      });
      
      // Get the latest submission ID
      const latest = sortedSubmissions[0];
      if (latest && latest.id && !highlightedSubmissionsRef.current.has(latest.id)) {
        // Mark this submission as highlighted
        highlightedSubmissionsRef.current.add(latest.id);
        
        // Set the latest submission ID for highlighting
        setLatestSubmissionId(latest.id);
        
        // Start highlight animation
        highlightAnim.setValue(0);
        Animated.sequence([
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Clear the latest submission ID after animation completes
          setTimeout(() => setLatestSubmissionId(null), 2000);
        });
      }
    }
  }, [reportSubmissions, highlightAnim]);

  // Use the selected submission's own management for card title and days (never mix with open mgmt)
  const currentManagement = submissionManagementAndTemplate.management ?? currentlyOpenManagement;

  // Calculate progress for the موجودہ رپورٹ card ONLY when QA state belongs to the current report.
  // When the user opens a different report (old/overdue), QA state gets overwritten with that
  // report's data. We cache the current report's progress so it doesn't get corrupted.
  const currentReportSubmissionId = existingSubmission?.id || null;
  const [cachedCurrentReportProgress, setCachedCurrentReportProgress] = useState(0);

  const qaProgressForCurrentReport = useSelector((state: any) =>
    currentReportSubmissionId ? (selectOverallProgressForSubmission(state, currentReportSubmissionId) || 0) : 0
  );

  useEffect(() => {
    // Only update cached progress when QA state actually contains the current report's data
    if (currentReportSubmissionId && currentSubmissionId === currentReportSubmissionId) {
      setCachedCurrentReportProgress(qaProgressForCurrentReport);
    }
  }, [currentSubmissionId, currentReportSubmissionId, qaProgressForCurrentReport]);

  const completionPercentage = cachedCurrentReportProgress;

  // Determine progress color based on completion percentage
  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return '#DC2626'; // Decent red
    if (percentage < 70) return '#F59E0B'; // Yellow
    return '#10B981'; // Green
  };
  const daysRemaining = currentManagement
    ? Math.ceil(
        (new Date(currentManagement.reporting_end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Keep a visible fallback state while unit context is restoring after navigation.
  if (!displayUnitId) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>یونٹ ڈیٹا بحال ہو رہا ہے...</UrduText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            refreshTokenIfNeeded()
              .then(() => fetchAllData(true))
              .catch((retryError) => {
                console.error('[ReportsView] Retry failed while unit context missing:', retryError);
              });
          }}
        >
          <UrduText style={styles.retryButtonText}>دوبارہ کوشش کریں</UrduText>
        </TouchableOpacity>
      </View>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>رپورٹس لوڈ ہو رہی ہیں...</UrduText>
      </View>
    );
  }

  // Don't block the UI if QA is loading - let the reports screen show
  // The QA data will load in the background
  // if (qaState.status === 'loading') {
  //   return (
  //     <View style={[styles.container, styles.loadingContainer]}>
  //       <ActivityIndicator size="large" color={COLORS.primary} />
  //       <UrduText style={styles.loadingText}>رپورٹ ڈیٹا لوڈ ہو رہا ہے...</UrduText>
  //     </View>
  //   );
  // }

  // Render error state
  if (error || qaState.error) {
    const errorMessage = error || qaState.error;
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <UrduText style={styles.errorText}>خرابی: {errorMessage}</UrduText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            // Reset QA initialization flags to force a fresh fetch
            qaInitializedRef.current = false;
            lastTemplateIdRef.current = null;
            lastMgmtIdRef.current = null;
            
            // Ensure we have a fresh token before retrying
            refreshTokenIfNeeded()
              .then(() => {
                if (displayUnit) {
                  // Force QA refresh on retry
                  return fetchAllData(true);
                }
              })
              .catch(error => {
                console.error('Error refreshing token before retry:', error);
              });
          }}
        >
          <UrduText style={styles.retryButtonText}>دوبارہ کوشش کریں</UrduText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, extraScrollContentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {showHeader && <Header title={title} onBack={handleBack} />}
        <View style={styles.content}>
          <UrduText style={styles.subTitle}>موجودہ رپورٹ</UrduText>
          <TouchableOpacity
            style={[
              styles.reportSummaryContainer,
              existingSubmission && styles.activeReportContainer
            ]}
            onPress={handleCreateReport}
            activeOpacity={0.8}
          >
            {shouldShowCurrentReport ? (
              <>
                <UrduText style={styles.reportSummaryItemTitle}>
                  {submissionManagementAndTemplate.template && submissionManagementAndTemplate.management
                    ? `${submissionManagementAndTemplate.template.report_name}۔ ماہ ${getUrduMonth(submissionManagementAndTemplate.management.month)} ${submissionManagementAndTemplate.management.year}ء`
                    : existingSubmission
                      ? `ماہانہ رپورٹ ${existingSubmission.id}`
                      : 'ماہانہ رپورٹ'
                  }
                </UrduText>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    {/* <UrduText style={styles.reportSummaryItemValue}>مقام</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText> */}
                    <UrduText style={styles.reportSummaryItemValue}>
                      {(() => {
                        // Get the level information for the display unit
                        const unitLevelId = displayUnit?.Level_id;
                        let unitLevelName = '';
                        
                        if (unitLevelId && typeof unitLevelId === 'number') {
                          // Try to get level name from the levelsById storage
                          if (tanzeemState && tanzeemState.levelsById) {
                            const levelDetails = tanzeemState.levelsById[unitLevelId];
                            if (levelDetails) {
                              unitLevelName = levelDetails.Name || '';
                            }
                          }
                        }
                        
                        // Format unit name with level and description: "Level Name: Unit Name - Unit Description"
                        const unitName = displayUnit?.Name || '';
                        const unitDescription = displayUnit?.Description || '';
                        
                        let formattedUnitName = unitLevelName 
                          ? `${unitLevelName}: ${unitName}`
                          : unitName;
                          
                        // Append description if available
                        if (unitDescription && unitDescription.trim()) {
                          formattedUnitName += ` - ${unitDescription}`;
                        }
                        
                        return formattedUnitName;
                      })()}
                    </UrduText>
                  </View>
                </View>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>اسٹیٹس</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={[
                      styles.reportSummaryItemValue,
                      existingSubmission?.status === 'published' && { color: COLORS.success },
                    ]}>
                      {existingSubmission ?
                        (existingSubmission.status === 'published' ? 'جمع شدہ' :
                         existingSubmission.status === 'draft' || existingSubmission.status === 'pending' ? 'زیرِ تکمیل' :
                         'نئی رپورٹ') :
                       'نئی رپورٹ'}
                    </UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText
                      style={[
                        styles.reportSummaryItemValue,
                        existingSubmission?.status === 'published'
                          ? { color: COLORS.success }
                          : { color: daysRemaining < 5 ? '#E63946' : COLORS.success },
                      ]}
                    >
                      {existingSubmission?.status === 'published'
                        ? 'جمع شدہ'
                        : currentManagement?.reporting_end_date
                          ? (daysRemaining > 0
                              ? `${daysRemaining} دن باقی ہیں`
                              : `${Math.abs(daysRemaining)} دن گزر چکے ہیں`)
                          : existingSubmission?.status === 'draft' || existingSubmission?.status === 'pending'
                            ? 'زیرِ تکمیل'
                            : 'تاریخ دستیاب نہیں'
                      }
                    </UrduText>
                  </View>
                </View>
                <View style={[styles.reportSummaryItemValueContainer, styles.reportSummaryItemValueContainerThirdRow]}>
                  <View style={[styles.reportSummaryItemValueContainerItem, styles.reportSummaryItemLeft]}>
                    <UrduText style={styles.reportSummaryItemValue}>پروگریس</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>{`${completionPercentage}% مکمل`}</UrduText>
                  </View>
                  <View style={[styles.reportSummaryItemValueContainerItem, styles.reportSummaryItemRight]}>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {existingSubmission?.status === 'published' ? 'جمع کرنے کی تاریخ' : 'آخری تاریخ'}
                    </UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {existingSubmission?.status === 'published'
                        ? (existingSubmission.date_updated
                            ? new Date(existingSubmission.date_updated).toLocaleDateString('ur-PK', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })
                            : existingSubmission.date_created
                              ? new Date(existingSubmission.date_created).toLocaleDateString('ur-PK', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })
                              : 'تاریخ دستیاب نہیں')
                        : currentManagement?.reporting_end_date
                          ? formatExpectedCompletion(currentManagement.reporting_end_date, { label: '' })
                          : 'تاریخ دستیاب نہیں'}
                    </UrduText>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${completionPercentage}%`,
                          backgroundColor: getProgressColor(completionPercentage)
                        }
                      ]} 
                    />
                  </View>
                </View>
                {__DEV__ && (
                  <TouchableOpacity
                    style={styles.copyDebugButton}
                    onPress={() => {
                      const submissionMgmtId = existingSubmission?.mgmt_id ?? 'NULL';
                      const submissionTemplateId = existingSubmission?.template_id ?? 'NULL';
                      const debugStr = `[ReportsView] Submission ID: ${existingSubmission?.id ?? 'NULL'}, Mgmt ID (submission): ${submissionMgmtId}, Template ID (submission): ${submissionTemplateId}, Unit: ${displayUnitId}, QA Current: ${currentSubmissionId ?? 'NULL'}, CurrentReport: ${currentReportSubmissionId ?? 'NULL'}, Progress: ${completionPercentage}%`;
                      Clipboard.setString(debugStr);
                      if (Platform.OS === 'ios' || Platform.OS === 'android') {
                        Alert.alert('کاپی ہو گیا', 'ڈیبگ معلومات کاپی ہو گئی۔');
                      }
                    }}
                  >
                    <UrduText style={styles.copyDebugButtonText}>ڈیبگ معلومات کاپی کریں</UrduText>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.noReportsContainer}>
                <Image
                  source={COMMON_IMAGES.noReport}
                  style={styles.noReportImage}
                  resizeMode="contain"
                />
                <UrduText style={styles.noReportText}>
                  {loading ? 'ڈیٹا لوڈ ہو رہا ہے...' : 'اس وقت کوئی Pending رپورٹ موجود نہیں ہے۔'}
                </UrduText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.reportSection}>
          <TabGroup
            tabs={[
              { label: 'ڈیو/اوور ڈیو رپورٹس', value: 0 },
              { label: 'سابقہ/جمع شدہ رپورٹس', value: 1 },
            ]}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
          {/* <TouchableOpacity onPress={handleViewAllReports} style={styles.viewAllButton}>
            <UrduText style={styles.sectionTitle}>تمام رپورٹس دیکھیں</UrduText>
          </TouchableOpacity> */}
        </View>

        <View style={styles.reportContainer}>
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.slice(0, 3).map((submission, index) => {
              const formattedDate = submission.date_created
                ? new Date(submission.date_created).toLocaleDateString('ur-PK', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                : 'تاریخ دستیاب نہیں';
              const management = reportMgmtDetails
                .flatMap((r) => r.managements)
                .find((m) => m.id === submission.mgmt_id);
              
              // Find the template for this submission
              const template = reportMgmtDetails
                .find((r) => r.template?.id === submission.template_id)?.template;
              
              // Get the level information for the unit
              const unitLevelId = submission.unitDetails?.Level_id;
              let unitLevelName = '';
              
              if (unitLevelId && typeof unitLevelId === 'number') {
                // Try to get level name from the levelsById storage
                if (tanzeemState && tanzeemState.levelsById) {
                  const levelDetails = tanzeemState.levelsById[unitLevelId];
                  if (levelDetails) {
                    unitLevelName = levelDetails.Name || '';
                  }
                }
              }
              
              // Format unit name with level and description: "Level Name: Unit Name - Unit Description"
              const unitName = submission.unitDetails?.Name || '';
              const unitDescription = submission.unitDetails?.Description || '';
              
              let unitNameWithLevel = unitLevelName 
                ? `${unitLevelName}: ${unitName}`
                : unitName;
                
              // Append description if available
              if (unitDescription && unitDescription.trim()) {
                unitNameWithLevel += ` - ${unitDescription}`;
              }
              
              // Check if this is the latest submission to highlight
              const isLatestSubmission = submission.id === latestSubmissionId;
              
              // Create animated style for highlighting
              const animatedStyle = isLatestSubmission ? {
                transform: [
                  {
                    scale: highlightAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.03],
                    }),
                  },
                ],
                shadowOpacity: highlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3],
                }),
              } : {};

              // Create a dynamic title that matches the current report card format
              const cardTitle = management && template
                ? `${template.report_name}۔ ماہ ${getUrduMonth(management.month)} ${management.year}ء`
                : management
                ? `ماہانہ کارکردگی رپورٹ ۔ ماہ ${getUrduMonth(management.month)} ${management.year}ء`
                : `ماہانہ رپورٹ`;

              // Allow edit for draft reports, or for published reports if deadline hasn't passed
              const canEditSubmission = submission.status === 'draft' ||
                (submission.status === 'published' && !isDeadlinePassed(management));

              return (
                <Animated.View
                  key={`submission-container-${submission.id}`}
                  style={[
                    isLatestSubmission && styles.highlightedCard,
                    animatedStyle
                  ]}
                >
                  <ReportCard
                    key={`submission-${submission.id}`}
                    title={cardTitle}
                    sumbitDateText={`جمع کروانے کی تاریخ – ${formattedDate}`}
                    location={unitNameWithLevel}
                    status={submission.status === 'published' ? 'جمع شدہ' : 'ڈرافٹ'}
                    statusColor={submission.status === 'published' ? COLORS.success : COLORS.error}
                    showEdit={canEditSubmission}
                    onEdit={() => {
                      const mode = canEditSubmission ? 'edit' : 'view';
                      router.push({
                        pathname: ROUTES.CREATE_REPORT,
                        params: {
                          submissionId: submission.id,
                          templateId: submission.template_id,
                          managementId: submission.mgmt_id,
                          unitId: submission.unit_id,
                          status: submission.status,
                          mode: mode
                        }
                      });
                    }}
                    onView={() => {
                      const mode = canEditSubmission ? 'edit' : 'view';
                      router.push({
                        pathname: ROUTES.CREATE_REPORT,
                        params: {
                          submissionId: submission.id,
                          templateId: submission.template_id,
                          managementId: submission.mgmt_id,
                          unitId: submission.unit_id,
                          status: submission.status,
                          mode: mode
                        }
                      });
                    }}
                  />
                </Animated.View>
              );
            })
          ) : (
            <View style={[styles.noReportsContainer, { backgroundColor: COLORS.white }]}>
              <Image
                source={COMMON_IMAGES.noReport}
                style={styles.noReportImage}
                resizeMode="contain"
              />
              <UrduText style={styles.noReportText}>اس وقت کوئی رپورٹ موجود نہیں ہے۔</UrduText>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  subTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: '600',
    marginLeft: SPACING.lg,
    color: COLORS.background,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  reportSummaryContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    ...SHADOWS.small,
  },
  reportSummaryItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 40,
  },
  reportSummaryItemValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  reportSummaryItemValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportSummaryItemValueContainerThirdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  reportSummaryItemValueContainerItem: {
    flexDirection: 'row',
  },
  reportSummaryItemLeft: {
    flex: 0,
    alignSelf: 'flex-start',
  },
  reportSummaryItemRight: {
    flex: 0,
    alignSelf: 'flex-end',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: SIZES.button.height / 4,
    backgroundColor: COLORS.shadow,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
    // backgroundColor is now set dynamically based on completion percentage
  },
  reportSection: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDecorationLine: 'underline',
    color: COLORS.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: SPACING.sm,
  },
  reportContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
  noReportsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  noReportImage: {
    width: 120,
    height: 120,
    marginBottom: SPACING.md,
  },
  noReportText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  highlightedCard: {
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  activeReportContainer: {
    borderWidth: 2,
    borderColor: COLORS.tertiary,
    backgroundColor: COLORS.lightGray,
  },
  copyDebugButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  copyDebugButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
});

export default ReportsView;