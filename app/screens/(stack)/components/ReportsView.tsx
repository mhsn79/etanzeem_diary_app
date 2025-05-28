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
}

const ReportsView: React.FC<ReportsViewProps> = ({
  showHeader = false,
  title = "رپورٹ مینجمنٹ",
  onBack,
  extraScrollContentStyle = {},
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

  // Redux state
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const reportSubmissions = useSelector(selectReportSubmissions) ?? [];
  const reportMgmtDetails = useSelector(selectManagementReportsList) ?? [];
  const loading = useSelector(selectReportsLoading);
  const error = useSelector(selectReportsError);
  
  // QA module state
  const qaState = useSelector(selectQAState);
  const overallProgress = useSelector(selectOverallProgress);
  
  // Memoized filtered submissions
  const filteredSubmissions = useMemo(() => {
    // First filter by status based on selected tab
    const filtered = reportSubmissions.filter((submission) =>
      selectedTab === 0
        ? submission.status === 'published'
        : submission.status === 'draft' || submission.status === 'pending'
    );
    
    // Then sort by date_created in descending order (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
      const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  }, [reportSubmissions, selectedTab]);

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
        // Check if there's already a published report for this management period
        const latestManagement = reportMgmtDetails[0]?.managements[0];
        const hasPublishedReport = latestManagement && reportSubmissions.some(
          submission => submission.mgmt_id === latestManagement.id && submission.status === 'published'
        );
        
        if (hasPublishedReport) {
          // If report is already submitted, show a message or navigate to view submitted reports
          router.push(ROUTES.ALL_REPORTS);
          return;
        }
        
        // If we have report management details with a template, pass the template ID
        if (reportMgmtDetails.length > 0 && reportMgmtDetails[0]?.template?.id) {
          console.log('Navigating to create report with template ID:', reportMgmtDetails[0].template.id);
          router.push({
            pathname: ROUTES.CREATE_REPORT,
            params: { templateId: reportMgmtDetails[0].template.id.toString() }
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
  }, [router, reportMgmtDetails, reportSubmissions, ensureFreshTokenBeforeOperation]);

  // Combined function to fetch all necessary data with token refresh
  const fetchAllData = useCallback(async (forceQARefresh = false) => {
    console.log('Refreshing data...6666666666',userUnitDetails);
    
    try {
      if (!userUnitDetails) {
        console.error('User unit details not available');
        return;
      }
      
      // First ensure we have a fresh token
      await ensureFreshTokenBeforeOperation();
      
      // Step 1: Fetch reports data
      console.log('Fetching reports data...');
      await dispatch(fetchReportsByUnitId(userUnitDetails.id));
      await dispatch(fetchReportSubmissions());
      console.log('Reports data fetched successfully');
      
      // Step 2: Check if we need to initialize QA data
      // Use the current reportMgmtDetails from props
      const latestReportMgmt = reportMgmtDetails?.[0] || null;
      console.log('Report management details:', latestReportMgmt,);
      
      if (!latestReportMgmt || !latestReportMgmt.template?.id || !latestReportMgmt.managements?.[0]) {
        console.log('No report management details available for QA initialization');
        return;
      }
      
      const templateId = latestReportMgmt.template.id;
      const latestManagement = latestReportMgmt.managements[0];
      
      // Only initialize QA data if:
      // 1. We're forcing a refresh, OR
      // 2. We haven't initialized it yet, OR
      // 3. The template or management ID has changed
      if (
        forceQARefresh || 
        !qaInitializedRef.current || 
        lastTemplateIdRef.current !== templateId ||
        lastMgmtIdRef.current !== latestManagement.id
      ) {
        console.log('Initializing QA data for template:', templateId);
        
        try {
          await dispatch(initializeReportData({
            template_id: templateId,
            unit_id: userUnitDetails.id,
            mgmt_id: latestManagement.id
          }));
          
          // Update our refs to track that we've initialized QA data
          qaInitializedRef.current = true;
          lastTemplateIdRef.current = templateId;
          lastMgmtIdRef.current = latestManagement.id;
          
          console.log('QA data initialized successfully');
        } catch (qaError) {
          console.error('Error initializing QA data:', qaError);
          // Don't rethrow - we want to continue even if QA initialization fails
        }
      } else {
        console.log('Skipping QA data initialization - already initialized for this template/management');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [userUnitDetails, dispatch, ensureFreshTokenBeforeOperation]);

  // Ensure we have a fresh token when the component mounts
  useEffect(() => {
    refreshTokenIfNeeded();
  }, []);

  // Fetch all data on initial mount and clean up on unmount
  useEffect(() => {
    if (userUnitDetails) {
      // On initial mount, force QA refresh
      fetchAllData(true);
    }
    
    // Clean up function to reset state when component unmounts
    return () => {
      highlightedSubmissionsRef.current.clear();
      setLatestSubmissionId(null);
      qaInitializedRef.current = false;
      lastTemplateIdRef.current = null;
      lastMgmtIdRef.current = null;
    };
  }, [userUnitDetails, fetchAllData]);
  
  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('ReportsView is focused, refreshing data...');
      
      // When screen comes into focus, mark that we should reset highlighted submissions
      // This will allow us to highlight new submissions when coming back from CreateReportScreen
      shouldResetHighlightedRef.current = true;
      
      // When coming back from creating/editing a report, force QA refresh
      const shouldForceQARefresh = true;
      
      // Refresh token and then fetch all data
      refreshTokenIfNeeded()
        .then(() => {
          if (userUnitDetails) {
            return fetchAllData(shouldForceQARefresh);
          }
        })
        .catch(error => {
          dispatch(logout());
          console.error('Error refreshing token on focus:', error);
        });
      
      return () => {
        // Cleanup function when screen loses focus (optional)
        console.log('ReportsView lost focus');
      };
    }, [userUnitDetails, fetchAllData, refreshTokenIfNeeded])
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
                if (userUnitDetails) {
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

  const latestManagement = reportMgmtDetails[0]?.managements[0];
  // Use the actual overall progress from QA module instead of mock data
  const completionPercentage = overallProgress || 0;
  const daysRemaining = latestManagement
    ? Math.ceil(
        (new Date(latestManagement.reporting_end_date).getTime() - new Date().getTime()) /
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
            style={styles.reportSummaryContainer}
            onPress={handleCreateReport}
            activeOpacity={0.8}
          >
            {latestManagement && reportMgmtDetails[0]?.template && 
              // Check if there's no published report for this management period
              !reportSubmissions.some(submission => 
                submission.mgmt_id === latestManagement.id && 
                submission.status === 'published'
              ) ? (
              <>
                <UrduText style={styles.reportSummaryItemTitle}>
                  {`${reportMgmtDetails[0].template.report_name}۔ ماہ ${getUrduMonth(
                    latestManagement.month
                  )} ${latestManagement.year}ء`}
                </UrduText>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>مقام</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {userUnitDetails?.Name ?? 'نامعلوم'}
                    </UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {formatExpectedCompletion(latestManagement.reporting_end_date)}
                    </UrduText>
                  </View>
                </View>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>اسٹیٹس</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>{`${completionPercentage}% مکمل`}</UrduText>
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
                <UrduText style={styles.noReportText}>اس وقت کوئی فعال رپورٹ موجود نہیں ہے۔</UrduText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.reportSection}>
          <TabGroup
            tabs={[
              { label: 'سابقہ / جمع شدہ رپورٹس', value: 0 },
              { label: 'ڈیو/اوور ڈیو رپورٹ', value: 1 },
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
            filteredSubmissions.slice(0, 3).map((submission) => {
              const formattedDate = submission.date_created
                ? new Date(submission.date_created).toLocaleDateString('ur-PK')
                : 'تاریخ دستیاب نہیں';
              const management = reportMgmtDetails
                .flatMap((r) => r.managements)
                .find((m) => m.id === submission.mgmt_id);
              
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
                    title={
                      management
                        ? `ماہانہ کارکردگی رپورٹ ۔ ماہ ${management.month}/20/${management.year}ء`
                        : `رپورٹ ${submission.id}`
                    }
                    sumbitDateText={`جمع کروانے کی تاریخ – ${formattedDate}`}
                    location={submission.unitDetails?.Name ?? 'نامعلوم'}
                    status={submission.status === 'published' ? 'جمع شدہ' : 'ڈرافٹ'}
                    statusColor={submission.status === 'published' ? COLORS.success : COLORS.error}
                    onEdit={() => {
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
});

export default ReportsView;