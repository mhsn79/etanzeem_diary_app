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
} from '@/app/features/reports/reportsSlice_new';
import { selectUserUnitDetails } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';
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
  selectOverallProgress, 
  selectQAState 
} from '@/app/features/qa/qaSlice';

interface ReportsViewProps {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
  extraScrollContentStyle?: object;
  selectedUnit?: any;
  selectedUnitId?: number;
}

// Helper function to determine if a management period is currently open
const isManagementPeriodOpen = (management: any): boolean => {
  if (!management || !management.reporting_start_date || !management.reporting_end_date) {
    console.log('[ReportsView] Invalid management data:', management);
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
  
  console.log('[ReportsView] Management period check:', {
    managementId: management.id,
    now: now.toISOString(),
    nowNormalized: nowNormalized.toISOString(),
    startDate: startDate.toISOString(),
    startDateNormalized: startDateNormalized.toISOString(),
    endDate: endDate.toISOString(),
    endDateNormalized: endDateNormalized.toISOString(),
    extendedDays: management.extended_days || 0,
    isOpen,
    rawDates: {
      reporting_start_date: management.reporting_start_date,
      reporting_end_date: management.reporting_end_date
    }
  });
  
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
  const overallProgress = useSelector(selectOverallProgress);
  
  // Get tanzeem state for level information
  const tanzeemState = useSelector((state: any) => state.tanzeem);

  // Use selected unit if available, otherwise fall back to user unit
  const displayUnit = selectedUnit || userUnitDetails;
  const displayUnitId = selectedUnitId || userUnitDetails?.id;

  // Debug log for unit selection (only log when unit changes)
  useEffect(() => {
    console.log('[ReportsView] Unit selection:', {
      selectedUnitId,
      userUnitId: userUnitDetails?.id,
      displayUnitId,
      displayUnitName: displayUnit?.Name
    });
  }, [selectedUnitId, userUnitDetails?.id, displayUnitId, displayUnit?.Name]);

  // Find currently open management and existing draft submission
  const currentlyOpenManagement = useMemo(() => {
    if (reportMgmtDetails.length === 0) {
      return null;
    }
    
    const allManagements = reportMgmtDetails.flatMap(report => report.managements);
    const openManagement = findCurrentlyOpenManagement(allManagements);
    
    return openManagement;
  }, [reportMgmtDetails.length, reportMgmtDetails[0]?.managements?.length]);

  // Find the latest submitted report for the selected unit
  const latestSubmittedReport = useMemo(() => {
    if (!displayUnitId) return null;
    
    // Filter submissions for the selected unit and get the latest published one
    const unitSubmissions = reportSubmissions.filter(submission => 
      submission.unit_id === displayUnitId && submission.status === 'published'
    );
    
    if (unitSubmissions.length === 0) return null;
    
    // Sort by date_created and get the latest
    const sorted = unitSubmissions.sort((a, b) => {
      const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
      const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
      return dateB - dateA;
    });
    
    return sorted[0];
  }, [reportSubmissions.length, displayUnitId]);

  // Find existing draft submission for the selected unit and current management
  const existingDraftSubmission = useMemo(() => {
    if (!currentlyOpenManagement || !displayUnitId) return null;
    
    const draft = reportSubmissions.find(submission => 
      submission.unit_id === displayUnitId &&
      submission.mgmt_id === currentlyOpenManagement.id && 
      (submission.status === 'draft' || submission.status === 'pending')
    );
    
    return draft;
  }, [reportSubmissions.length, currentlyOpenManagement?.id, displayUnitId]);

  // Determine if we should show the current report section
  const shouldShowCurrentReport = useMemo(() => {
    const shouldShow = currentlyOpenManagement && 
           reportMgmtDetails.length > 0 && 
           reportMgmtDetails[0]?.template &&
           displayUnitId;
    
    // Show if we have any management data and a selected unit
    const forceShow = reportMgmtDetails.length > 0 && reportMgmtDetails[0]?.template && displayUnitId;
    const showDuringLoading = loading && reportMgmtDetails.length > 0 && displayUnitId;
    
    return forceShow || shouldShow || showDuringLoading;
  }, [currentlyOpenManagement?.id, reportMgmtDetails.length, loading, displayUnitId]);

  // Memoized filtered submissions
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
    
    // Then sort by date_created in descending order (newest first)
    return statusFiltered.sort((a, b) => {
      const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
      const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  }, [reportSubmissions.length, selectedTab, displayUnitId]);

  // Default back handler if none provided
  const defaultBackHandler = useCallback(() => {
    router.canGoBack() ? router.back() : router.push(ROUTES.DASHBOARD);
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
    // Ensure we have a fresh token before navigation
    ensureFreshTokenBeforeOperation()
      .then(() => {
        // Use the currently open management period
        const currentMgmt = currentlyOpenManagement || reportMgmtDetails[0]?.managements[0];
        
        if (!currentMgmt) {
          console.warn('No management period available for report creation');
          router.push(ROUTES.ALL_REPORTS);
          return;
        }
        
        // Check if there's already a published report for this management period and unit
        const hasPublishedReport = reportSubmissions.some(
          submission => submission.mgmt_id === currentMgmt.id && 
                       submission.status === 'published' && 
                       submission.unit_id === displayUnitId
        );
        
        if (hasPublishedReport) {
          // If report is already submitted for this unit, navigate to view submitted reports
          router.push(ROUTES.ALL_REPORTS);
          return;
        }
        
        // Check if there's already a draft submission for this management period
        const existingDraft = existingDraftSubmission;
        
        if (existingDraft && existingDraft.id) {
          // If there's already a draft, navigate to edit it
          console.log('Navigating to edit existing draft submission:', existingDraft.id);
          router.push({
            pathname: ROUTES.CREATE_REPORT,
            params: {
              submissionId: existingDraft.id.toString(),
              templateId: existingDraft.template_id.toString(),
              managementId: existingDraft.mgmt_id.toString(),
              unitId: existingDraft.unit_id.toString(),
              status: existingDraft.status,
              mode: 'edit'
            }
          });
          return;
        }
        
        // If we have report management details with a template, create a new submission
        if (reportMgmtDetails.length > 0 && reportMgmtDetails[0]?.template?.id) {
          console.log('Navigating to create new report with template ID:', reportMgmtDetails[0].template.id);
          router.push({
            pathname: ROUTES.CREATE_REPORT,
            params: { 
              templateId: reportMgmtDetails[0].template.id.toString(),
              managementId: currentMgmt.id.toString(),
              unitId: displayUnit?.id?.toString() || ''
            }
          });
        } else {
          // If no template is available, just navigate without params
          console.warn('No template available for report creation');
          router.push(ROUTES.CREATE_REPORT);
        }
      })
      .catch(error => {
        console.error('Error refreshing token before navigation:', error);
      });
  }, [router, reportMgmtDetails, reportSubmissions, currentlyOpenManagement?.id, existingDraftSubmission?.id, displayUnit?.id, ensureFreshTokenBeforeOperation]);

  // Combined function to fetch all necessary data with token refresh
  const fetchAllData = useCallback(async (forceQARefresh = false) => {
    try {
      if (!displayUnit?.id) {
        console.error('[ReportsView] Display unit details not available');
        return;
      }
      
      // Debounce: skip if called again within 2 seconds
      const now = Date.now();
      if (!forceQARefresh && lastFetchedUnitIdRef.current === displayUnit.id && now - lastFetchTimeRef.current < 2000) {
        return;
      }
      
      // Mark fetch
      lastFetchedUnitIdRef.current = displayUnit.id;
      lastFetchTimeRef.current = now;
      
      // First ensure we have a fresh token
      await ensureFreshTokenBeforeOperation();
      
      // Step 1: Fetch reports data
      const reportsResult = await dispatch(fetchReportsByUnitId(displayUnit.id));
      const submissionsResult = await dispatch(fetchReportSubmissions());
      
              // Step 2: Check if we need to initialize QA data
        // Use the currently open management period
        const currentReportMgmt = reportMgmtDetails?.[0] || null;
        const currentManagement = currentlyOpenManagement || currentReportMgmt?.managements?.[0];
        
        if (!currentReportMgmt || !currentReportMgmt.template?.id || !currentManagement) {
          return;
        }
        
        const templateId = currentReportMgmt.template.id;
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
            console.error('Error initializing QA data:', qaError);
            // Don't rethrow - we want to continue even if QA initialization fails
          }
        }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [displayUnit?.id, dispatch, ensureFreshTokenBeforeOperation, currentlyOpenManagement?.id]);

  // Ensure we have a fresh token when the component mounts
  useEffect(() => {
    refreshTokenIfNeeded();
  }, []);

  // Only trigger fetch on unit change or force
  useEffect(() => {
    if (displayUnit?.id) {
      if (lastFetchedUnitIdRef.current !== displayUnit.id) {
        lastFetchedUnitIdRef.current = null;
        lastFetchTimeRef.current = 0;
      }
      fetchAllData(true);
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
  }, [displayUnit?.id, fetchAllData]);
  
  // Only fetch on focus if not already fetched for this unit
  useFocusEffect(
    useCallback(() => {
      shouldResetHighlightedRef.current = true;
      if (displayUnit?.id && !loading && lastFetchedUnitIdRef.current !== displayUnit.id) {
        refreshTokenIfNeeded()
          .then(() => fetchAllData(false))
          .catch(error => {
            dispatch(logout());
            console.error('Error refreshing token on focus:', error);
          });
      }
      return () => {
        // Cleanup function when screen loses focus (optional)
      };
    }, [displayUnit?.id, fetchAllData, refreshTokenIfNeeded, loading])
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

  // Render loading state
  if (loading || qaState.status === 'loading') {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
      </View>
    );
  }

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

  // Use the currently open management instead of just the first one
  // If no currently open management, fall back to the most recent one
  const currentManagement = currentlyOpenManagement || reportMgmtDetails[0]?.managements[0];
  
  console.log('[ReportsView] Current management selection:', {
    currentlyOpenManagement: currentlyOpenManagement ? {
      id: currentlyOpenManagement.id,
      month: currentlyOpenManagement.month,
      year: currentlyOpenManagement.year
    } : null,
    fallbackManagement: reportMgmtDetails[0]?.managements[0] ? {
      id: reportMgmtDetails[0].managements[0].id,
      month: reportMgmtDetails[0].managements[0].month,
      year: reportMgmtDetails[0].managements[0].year
    } : null,
    selectedManagement: currentManagement ? {
      id: currentManagement.id,
      month: currentManagement.month,
      year: currentManagement.year
    } : null
  });
  // Use the actual overall progress from QA module instead of mock data
  const completionPercentage = overallProgress || 0;
  const daysRemaining = currentManagement
    ? Math.ceil(
        (new Date(currentManagement.reporting_end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

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
              existingDraftSubmission && styles.activeReportContainer
            ]}
            onPress={handleCreateReport}
            activeOpacity={0.8}
          >
            {shouldShowCurrentReport ? (
              <>
                <UrduText style={styles.reportSummaryItemTitle}>
                  {`${reportMgmtDetails[0].template.report_name}۔ ماہ ${getUrduMonth(
                    (currentlyOpenManagement || reportMgmtDetails[0]?.managements[0])?.month
                  )} ${(currentlyOpenManagement || reportMgmtDetails[0]?.managements[0])?.year}ء`}
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
                        
                        // Format unit name with level: "Level Name: Unit Name" or just "Unit Name" if no level
                        return unitLevelName 
                          ? `${unitLevelName}: ${displayUnit?.Name || 'نامعلوم'}`
                          : displayUnit?.Name || 'نامعلوم';
                      })()}
                    </UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {formatExpectedCompletion((currentlyOpenManagement || reportMgmtDetails[0]?.managements[0])?.reporting_end_date)}
                    </UrduText>
                  </View>
                </View>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>اسٹیٹس</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {existingDraftSubmission ? 'زیرِ تکمیل' : 
                       latestSubmittedReport ? 'آخری جمع شدہ رپورٹ' : 'نئی رپورٹ'}
                    </UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText
                      style={[
                        styles.reportSummaryItemValue,
                        { color: daysRemaining < 5 ? '#E63946' : COLORS.success },
                      ]}
                    >
                      {daysRemaining > 0
                        ? `${daysRemaining} دن باقی ہیں`
                        : `${Math.abs(daysRemaining)} دن گزر چکے ہیں`}
                    </UrduText>
                  </View>
                </View>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>پروگریس</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>{`${completionPercentage}% مکمل`}</UrduText>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
                  </View>
                </View>
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
          <TouchableOpacity onPress={handleViewAllReports} style={styles.viewAllButton}>
            <UrduText style={styles.sectionTitle}>تمام رپورٹس دیکھیں</UrduText>
          </TouchableOpacity>
        </View>

        <View style={styles.reportContainer}>
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.slice(0, 3).map((submission, index) => {
              // Add detailed logging for each submission
              console.log(`[ReportsView] Rendering submission at index ${index}:`, {
                id: submission.id,
                template_id: submission.template_id,
                mgmt_id: submission.mgmt_id,
                unit_id: submission.unit_id,
                status: submission.status,
                date_created: submission.date_created,
                hasSubmissionData: !!submission.submission_data
              });
              
              const formattedDate = submission.date_created
                ? new Date(submission.date_created).toLocaleDateString('ur-PK')
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
              
              // Format unit name with level: "Level Name: Unit Name" or just "Unit Name" if no level
              const unitNameWithLevel = unitLevelName 
                ? `${unitLevelName}: ${submission.unitDetails?.Name || 'نامعلوم'}`
                : submission.unitDetails?.Name || 'نامعلوم';
              
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
            
              } : {};

              // Create a dynamic title that matches the current report card format
              const cardTitle = management && template
                ? `${template.report_name}۔ ماہ ${getUrduMonth(management.month)} ${management.year}ء`
                : management
                ? `ماہانہ کارکردگی رپورٹ ۔ ماہ ${getUrduMonth(management.month)} ${management.year}ء`
                : `رپورٹ ${submission.id}`;

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
                    onEdit={() => {
                      // Log detailed information before navigation
                      console.log(`[ReportsView] Editing submission at index ${index}:`, {
                        id: submission.id,
                        template_id: submission.template_id,
                        mgmt_id: submission.mgmt_id,
                        unit_id: submission.unit_id,
                        status: submission.status,
                        submissionData: submission.submission_data ? 'Present' : 'Not present'
                      });
                      
                      // Navigate to CREATE_REPORT in edit mode
                      router.push({
                        pathname: ROUTES.CREATE_REPORT,
                        params: {
                          submissionId: submission.id,
                          templateId: submission.template_id,
                          managementId: submission.mgmt_id,
                          unitId: submission.unit_id,
                          status: submission.status,
                          mode: 'edit',
                          submissionData: submission.submission_data ? JSON.stringify(submission.submission_data) : undefined
                        }
                      });
                    }}
                    onView={() => {
                      // Log detailed information before navigation
                      console.log(`[ReportsView] Viewing submission at index ${index}:`, {
                        id: submission.id,
                        template_id: submission.template_id,
                        mgmt_id: submission.mgmt_id,
                        unit_id: submission.unit_id,
                        status: submission.status,
                        submissionData: submission.submission_data ? 'Present' : 'Not present'
                      });
                      
                      // Navigate to CREATE_REPORT in view mode
                      router.push({
                        pathname: ROUTES.CREATE_REPORT,
                        params: {
                          submissionId: submission.id,
                          templateId: submission.template_id,
                          managementId: submission.mgmt_id,
                          unitId: submission.unit_id,
                          status: submission.status,
                          mode: 'view',
                          submissionData: submission.submission_data ? JSON.stringify(submission.submission_data) : undefined
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
              <UrduText style={styles.noReportText}>اس وقت کوئی فعال رپورٹ موجود نہیں ہے۔</UrduText>
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
    fontSize: TYPOGRAPHY.fontSize.lg,
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
  reportSummaryItemValueContainerItem: {
    flexDirection: 'row',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: SIZES.button.height / 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.tertiary,
    borderRadius: BORDER_RADIUS.sm,
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
});

export default ReportsView;