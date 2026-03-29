/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Animated, TouchableOpacity, Clipboard, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import { useNavigation, useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { ROUTES } from '@/app/constants/navigation';
import { startNavigationMetric } from '@/app/utils/navigationMetrics';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
import Dialog from '@/app/components/Dialog';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/app/constants/theme';
import {
  initializeReportData,
  selectOverallProgress,
  selectQAState,
  clearAnswers,
  selectAnswersBySubmissionId,
  selectSectionsWithProgress,
  selectQuestionsArray,
  selectAnswers,
  selectStatus,
  selectError,
  selectSaveStatus,
  selectSaveError,
  selectSubmitStatus,
  selectSubmitError,
  selectCurrentSubmissionId,
  submitReport,
  batchAutoFillAnswers,
  selectBatchFillStatus,
  selectBatchFillProgress,
} from '@/app/features/qa/qaSlice';
import { selectUserUnitDetails, selectUserTanzeemiLevelDetails } from '@/app/features/tanzeem/tanzeemSlice';
import { selectManagementReportsList } from '@/app/features/reports/reportsSlice';
import { useTokenRefresh } from '@/app/utils/tokenRefresh';
import SectionList from '@/app/components/SectionList';
import ScreenLayout from '@/app/components/ScreenLayout';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import { ensureFreshToken, directApiRequest } from '@/app/services/apiClient';
import { setError } from '@/app/features/auth/authSlice';

export type CreateReportInitialParams = {
  submissionId: number;
  templateId: number;
  managementId: number;
  unitId: number;
  mode: 'edit' | 'view';
  status?: string;
};

type CreateReportScreenProps = {
  /** Optional params for direct embedding; route params remain the default source. */
  initialParams?: CreateReportInitialParams | null;
};

const CreateReportScreen = ({ initialParams: initialParamsProp }: CreateReportScreenProps = {}) => {
  // Log mount immediately to confirm CreateReportScreen ever renders
  console.log('[CreateReportScreen] MOUNT/RE-RENDER', { hasInitialParams: !!initialParamsProp, submissionId: initialParamsProp?.submissionId });
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const fromRouter = params.submissionId != null || params.templateId != null;
  const submissionId = fromRouter ? (params.submissionId ? Number(params.submissionId) : null) : (initialParamsProp?.submissionId ?? null);
  const templateId = fromRouter ? (params.templateId ? Number(params.templateId) : null) : (initialParamsProp?.templateId ?? null);
  const managementId = fromRouter ? (params.managementId ? Number(params.managementId) : null) : (initialParamsProp?.managementId ?? null);
  const unitId = fromRouter ? (params.unitId ? Number(params.unitId) : null) : (initialParamsProp?.unitId ?? null);
  const mode = (fromRouter ? params.mode : initialParamsProp?.mode) as 'view' | 'edit' | undefined;
  
  // Helper function to format unit name with description
  const formatUnitName = (unit: any) => {
    const name = unit.Name || unit.name || '';
    const description = unit.Description || unit.description || '';
    
    // If description exists and is different from name, append it
    if (description && description !== name) {
      return `${name} (${description})`;
    }
    
    return name;
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  // Log params on mount/change to debug report not opening (always use submission's own mgmt_id)
  useEffect(() => {
    console.log('[CreateReportScreen] Params received:', {
      submissionId,
      templateId,
      managementId,
      unitId,
      mode,
      fromInitialParams: !!initialParamsProp,
      rawParams: params
    });
  }, [submissionId, templateId, managementId, unitId, mode, params, initialParamsProp]);

  // Use our token refresh hook
  const { refreshTokenIfNeeded, ensureFreshTokenBeforeOperation } = useTokenRefresh();
  
  // Dialog states
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showLowProgressWarning, setShowLowProgressWarning] = useState(false);
  
  // State to store fetched management details for historical submissions
  const [fetchedManagementDetails, setFetchedManagementDetails] = useState<any>(null);
  
  // Animation ref for button press
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Selectors
  const sectionsWithProgress = useAppSelector((state) => selectSectionsWithProgress(state, templateId || undefined));
  const questionsArray = useAppSelector(selectQuestionsArray);
  const storedAnswers = useAppSelector(selectAnswers);
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const userTanzeemiLevelDetails = useAppSelector(selectUserTanzeemiLevelDetails);
  const latestReportMgmt = useAppSelector(selectManagementReportsList);
  const status = useAppSelector(selectStatus);
  const error = useAppSelector(selectError);
  const saveStatus = useAppSelector(selectSaveStatus);
  const saveError = useAppSelector(selectSaveError);
  const submitStatus = useAppSelector(selectSubmitStatus);
  const submitError = useAppSelector(selectSubmitError);
  const currentSubmissionId = useAppSelector(selectCurrentSubmissionId);
  const overallProgress = useAppSelector(selectOverallProgress);
  const batchFillStatus = useAppSelector(selectBatchFillStatus);
  const batchFillProgress = useAppSelector(selectBatchFillProgress);

  // Get submission-specific answers
  const submissionAnswers = useAppSelector((state) => 
    currentSubmissionId ? selectAnswersBySubmissionId(state, currentSubmissionId) : []
  );

  // Memoized values
  const unitName = useMemo(() => {
    if (!userUnitDetails?.Name) return '';
    
    // Get level name if available
    const levelName = userTanzeemiLevelDetails?.Name || '';
    
    // Format: "Level Name: Unit Name" or just "Unit Name" if no level
    return levelName ? `${levelName}: ${formatUnitName(userUnitDetails)}` : formatUnitName(userUnitDetails);
  }, [userUnitDetails?.Name, userTanzeemiLevelDetails?.Name]);
  // Function to fetch management details if not available in state
  const fetchManagementDetails = useCallback(async (mgmtId: number) => {
    try {
      console.log('[CreateReportScreen] Fetching management details for mgmt_id:', mgmtId);
      const response = await directApiRequest<{ data: any }>(
        `/items/reports_mgmt/${mgmtId}`,
        'GET'
      );
      
      if (response?.data) {
        console.log('[CreateReportScreen] Successfully fetched management details:', response.data);
        setFetchedManagementDetails(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('[CreateReportScreen] Error fetching management details:', error);
    }
    return null;
  }, []);

  // Effect to clear fetched management details when submission changes
  useEffect(() => {
    setFetchedManagementDetails(null);
  }, [submissionId]);

  const reportingPeriod = useMemo(() => {
    // If we have a specific managementId (from submission), use that management's period
    if (managementId) {
      // First check if we have fetched management details for this submission
      if (fetchedManagementDetails && fetchedManagementDetails.id === managementId) {
        console.log('[CreateReportScreen] Using fetched management period:', {
          managementId,
          month: fetchedManagementDetails.month,
          year: fetchedManagementDetails.year,
          period: `${getUrduMonth(fetchedManagementDetails.month)} ${fetchedManagementDetails.year}`
        });
        return `${getUrduMonth(fetchedManagementDetails.month)} ${fetchedManagementDetails.year}`;
      }
      
      // Then check if we have it in the current state
      const management = latestReportMgmt.find(report => 
        report.managements.some(mgmt => mgmt.id === managementId)
      )?.managements.find(mgmt => mgmt.id === managementId);
      
      if (management) {
        console.log('[CreateReportScreen] Using specific management period:', {
          managementId,
          month: management.month,
          year: management.year,
          period: `${getUrduMonth(management.month)} ${management.year}`
        });
        return `${getUrduMonth(management.month)} ${management.year}`;
      } else {
        console.log('[CreateReportScreen] Management not found for ID:', managementId);
        // If management not found in state, trigger an async fetch
        if (managementId && !fetchedManagementDetails) {
          fetchManagementDetails(managementId);
        }
      }
    }
    
    // Fallback to latest management period
    const fallbackPeriod = latestReportMgmt[0]?.managements[0]
      ? `${getUrduMonth(latestReportMgmt[0]?.managements[0]?.month)} ${latestReportMgmt[0]?.managements[0].year}`
      : '';
    
    console.log('[CreateReportScreen] Using fallback period:', {
      managementId,
      fallbackPeriod,
      latestMgmt: latestReportMgmt[0]?.managements[0]
    });
    
    return fallbackPeriod;
  }, [latestReportMgmt, managementId, fetchedManagementDetails, fetchManagementDetails]);

  // Extract raw month/year for batch auto-fill
  const reportingPeriodValues = useMemo(() => {
    if (managementId) {
      if (fetchedManagementDetails && fetchedManagementDetails.id === managementId) {
        return { month: fetchedManagementDetails.month, year: fetchedManagementDetails.year };
      }
      const mgmt = latestReportMgmt.find(report =>
        report.managements.some((m: any) => m.id === managementId)
      )?.managements.find((m: any) => m.id === managementId);
      if (mgmt) return { month: mgmt.month, year: mgmt.year };
    }
    const fallback = latestReportMgmt[0]?.managements[0];
    return fallback ? { month: fallback.month, year: fallback.year } : null;
  }, [latestReportMgmt, managementId, fetchedManagementDetails]);

  // Force token refresh on screen focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[CreateReportScreen] useFocusEffect RUN (screen focused)', { submissionId });
      // Clear answers when screen comes into focus to ensure clean state
      if (submissionId && currentSubmissionId !== submissionId) {
        console.log('[CreateReportScreen] Clearing QA state for new submission:', {
          currentSubmissionId,
          newSubmissionId: submissionId
        });
        dispatch(clearAnswers());
      }
      
      ensureFreshToken()
        .then(() => console.log('[CreateReportScreen] useFocusEffect ensureFreshToken resolved'))
        .catch((error) => {
          console.log('[CreateReportScreen] useFocusEffect ensureFreshToken REJECTED', error?.message ?? error);
          dispatch(setError('Your session has expired. Please log in again.'));
          router.replace('/screens/LoginScreen');
        });
      return () => console.log('[CreateReportScreen] useFocusEffect CLEANUP (screen unfocused / unmount)');
    }, [dispatch, submissionId, currentSubmissionId])
  );

  // Ensure we have a fresh token before initializing report data
  useEffect(() => {
    const inEditOrViewWithSubmission = (isEditMode || isViewMode) && !!submissionId;

    console.log('[CreateReportScreen] Initializing with params:', {
      submissionId,
      templateId,
      unitId,
      managementId,
      mode,
      isEditMode,
      isViewMode,
      currentSubmissionId
    });

    // If we're in edit or view mode and have a submissionId, we need to load existing data
    if (inEditOrViewWithSubmission) {
      // Always initialize with the existing submission ID to get fresh data
      if (templateId && unitId && managementId && submissionId) {
        const initParams = {
          template_id: templateId,
          unit_id: unitId,
          mgmt_id: managementId,
          submission_id: submissionId
        };

        console.log('[CreateReportScreen] Loading existing submission with params:', initParams);

        // First ensure we have a fresh token
        ensureFreshTokenBeforeOperation()
          .then(() => {
            // Then initialize the report data with the existing submission ID
            return dispatch(initializeReportData(initParams)).unwrap();
          })
          .then((result) => {
            console.log('[CreateReportScreen] Existing report data loaded successfully:', {
              submissionId: result.submission.id,
              sectionsCount: result.sections.length,
              questionsCount: result.questions.length,
              answersCount: result.answers.length
            });
          })
          .catch((error) => {
            console.error('[CreateReportScreen] Error loading existing report data:', error);
          });
      } else {
        console.error('[CreateReportScreen] Missing required parameters for loading existing submission:', {
          templateId,
          unitId,
          managementId,
          submissionId
        });
      }

      return;
    }

    // For new report creation only: require templateId, userUnitDetails, latestReportMgmt
    if (templateId && userUnitDetails?.id && latestReportMgmt[0]?.managements[0]?.id) {
      const initParams = {
        template_id: templateId,
        unit_id: userUnitDetails.id,
        mgmt_id: latestReportMgmt[0]?.managements[0]?.id
      };

      ensureFreshTokenBeforeOperation()
        .then(() => {
          return dispatch(initializeReportData(initParams)).unwrap();
        })
        .then((result) => {
          console.log('[CreateReportScreen] Report data initialized successfully:', {
            submissionId: result.submission.id,
            sectionsCount: result.sections.length,
            questionsCount: result.questions.length,
            answersCount: result.answers.length
          });
        })
        .catch((error) => {
          console.error('[CreateReportScreen] Error initializing report data:', error);
        });
    } else {
      console.log('[CreateReportScreen] Missing required parameters for initialization:', {
        templateId,
        userUnitId: userUnitDetails?.id,
        mgmtId: latestReportMgmt[0]?.managements[0]?.id
      });
    }

    // Do not auto-redirect: when opening from (tabs)/Reports, params can be delayed or missing from useLocalSearchParams(), and redirecting sent the user back immediately. Show error state instead if new-report params are missing (handled by status/error UI below).
  }, [templateId, userUnitDetails?.id, latestReportMgmt[0]?.managements[0]?.id, submissionId, isEditMode, isViewMode]);

  // Handle report submission
  const handleSubmit = useCallback(() => {
    if (!currentSubmissionId) {
      console.error('رپورٹ ابھی تک شروع نہیں ہوئی ہے');
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Refresh token if needed before showing the dialog
    refreshTokenIfNeeded()
      .then(() => {
        // Show low progress warning if below 70%
        if (overallProgress < 70) {
          setShowLowProgressWarning(true);
        } else {
          setShowSubmitDialog(true);
        }
      })
      .catch((error) => {
        console.error('Error refreshing token before submission:', error);
      });
  }, [currentSubmissionId, scaleAnim, refreshTokenIfNeeded, overallProgress]);
  
  // Handle confirm submission
  const handleConfirmSubmit = useCallback(() => {
    if (!currentSubmissionId) return;
    
    setShowSubmitDialog(false);
    
    // First ensure we have a fresh token
    ensureFreshTokenBeforeOperation()
      .then(() => {
        // Then submit the report
        return dispatch(submitReport({ submission_id: currentSubmissionId })).unwrap();
      })
      .then(() => {
        console.log('رپورٹ کامیابی سے جمع کروا دی گئی ہے');
        // Show success dialog and navigate back after it's closed or auto-closed
        setShowSuccessDialog(true);
      })
      .catch((error) => {
        console.error('Error submitting report:', error);
        console.error('رپورٹ جمع نہیں ہو سکی');
      });
  }, [currentSubmissionId, dispatch, ensureFreshTokenBeforeOperation, templateId, unitId, managementId]);

  // Handle batch auto-fill from existing data
  const handleBatchAutoFill = useCallback(async () => {
    if (!reportingPeriodValues || !currentSubmissionId) return;

    const reportUnitId = unitId || userUnitDetails?.id;
    if (!reportUnitId) return;

    try {
      const result = await dispatch(batchAutoFillAnswers({
        unitId: reportUnitId,
        month: reportingPeriodValues.month,
        year: reportingPeriodValues.year,
      })).unwrap();

      console.log(`[CreateReportScreen] Batch auto-fill: ${result.filled}/${result.total} filled`);
      if (result.errors.length > 0) {
        console.warn('[CreateReportScreen] Batch auto-fill errors:', result.errors);
      }
    } catch (error: any) {
      console.error('[CreateReportScreen] Batch auto-fill failed:', error);
    }
  }, [dispatch, reportingPeriodValues, unitId, userUnitDetails?.id, currentSubmissionId]);

  // Must be called before any early return (React hooks rule)
  const handleBack = useCallback(() => {
    const completeMetric = startNavigationMetric('create_report_back_to_route_change');
    if (router.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace(ROUTES.DASHBOARD);
    }
    requestAnimationFrame(completeMetric);
  }, [router, navigation]);

  // Show loading state (after all hooks)
  const isFormReady = 
    status === 'succeeded' && 
    ((submissionId != null && currentSubmissionId === submissionId) || 
     (submissionId == null && currentSubmissionId != null));

  if (status === 'loading' || !isFormReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>معلومات حاصل کی جا رہی ہیں...</UrduText>
      </View>
    );
  }

  // Show error state
  if (status === 'failed' && error) {
    return (
      <View style={styles.errorContainer}>
        <UrduText style={styles.errorText}>{error}</UrduText>
        <CustomButton
          text="دوبارہ کوشش کریں"
          onPress={handleBack}
          viewStyle={{
            backgroundColor: COLORS.primary,
            marginTop: SPACING.md,
          }}
          textStyle={{
            color: COLORS.white,
          }}
        />
      </View>
    );
  }
  return (
    <ScreenLayout
      title={isViewMode ? 'رپورٹ دیکھیں' : isEditMode ? 'رپورٹ بنائیں' : 'رپورٹ بنائیں'}
      onBack={handleBack}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {__DEV__ && (
            <TouchableOpacity
              style={styles.copyDebugButton}
              onPress={() => {
                const debugStr = `[CreateReportScreen] Submission ID: ${currentSubmissionId ?? 'NULL'}, Params: ${submissionId ?? 'NULL'}, Template: ${templateId}, Unit: ${unitId}, Mgmt: ${managementId}`;
                Clipboard.setString(debugStr);
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                  Alert.alert('کاپی ہو گیا', 'ڈیبگ معلومات کاپی ہو گئی۔');
                }
              }}
            >
              <UrduText style={styles.copyDebugButtonText}>ڈیبگ معلومات کاپی کریں</UrduText>
            </TouchableOpacity>
          )}

          <View style={styles.headerInfoContainer}>
            <FormInput
              inputTitle="تنظیمی یونٹ"
              value={unitName}
              editable={false}
              onChange={() => {}}
              layout="one-line"
            />
            <FormInput
              inputTitle="رپورٹنگ ماہ و سال"
              value={reportingPeriod}
              editable={false}
              onChange={() => {}}
              layout="one-line"
            />
          </View>

          {!isViewMode && (
            <View style={styles.batchFillContainer}>
              <CustomButton
                text={batchFillStatus === 'loading'
                  ? `ڈیٹا حاصل کیا جا رہا ہے... (${batchFillProgress.current}/${batchFillProgress.total})`
                  : 'موجود ڈیٹا سے رپورٹ بنائیں'}
                onPress={handleBatchAutoFill}
                viewStyle={{
                  backgroundColor: batchFillStatus === 'succeeded' ? COLORS.success : COLORS.primary,
                  flex: 1,
                }}
                textStyle={{ color: COLORS.white }}
                loading={batchFillStatus === 'loading'}
                disabled={batchFillStatus === 'loading'}
              />
            </View>
          )}

          <SectionList
            sections={sectionsWithProgress}
            questions={questionsArray}
            answers={submissionAnswers}
            disabled={isViewMode}
            currentUnitId={unitId}
            submissionId={currentSubmissionId}
          />
        </ScrollView>

        {!isViewMode && (
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                // When rendered in-tab (onBackOverride), the TabBar is position:absolute
                // so we need extra bottom margin to clear it (paddingTop + button height + bottom padding)
                marginBottom: 0,
                paddingBottom: Math.max(insets.bottom, SPACING.sm),
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <CustomButton
              text="جمع کروائیں"
              onPress={handleSubmit}
              viewStyle={{
                backgroundColor: COLORS.primary,
                flex: 1,
                marginHorizontal: SPACING.sm,
              }}
              textStyle={{
                color: COLORS.white,
              }}
              disabled={submitStatus === 'loading'}
              loading={submitStatus === 'loading'}
            />
          </Animated.View>
        )}
        
        {/* Global Auto-Save Status indicator */}
        <View style={styles.globalSaveIndicatorContainer}>
          {saveStatus === 'loading' && (
            <View style={[styles.statusBadge, styles.loadingBadge]}>
              <ActivityIndicator size="small" color={COLORS.primary} style={{ transform: [{ scale: 0.7 }] }} />
              <UrduText style={styles.statusBadgeText}>محفوظ ہو رہا ہے...</UrduText>
            </View>
          )}
          {saveStatus === 'succeeded' && (
            <View style={[styles.statusBadge, styles.successBadge]}>
              <UrduText style={styles.statusBadgeSuccessText}>تمام تبدیلیاں محفوظ ہو گئیں</UrduText>
            </View>
          )}
          {saveStatus === 'failed' && (
            <View style={[styles.statusBadge, styles.errorBadge]}>
              <UrduText style={styles.statusBadgeErrorText}>محفوظ کرنے میں ناکامی</UrduText>
            </View>
          )}
        </View>

        {/* Low Progress Warning Dialog */}
        {!isViewMode && (
          <Dialog
            visible={showLowProgressWarning}
            onConfirm={() => {
              setShowLowProgressWarning(false);
              setShowSubmitDialog(true);
            }}
            onCancel={() => setShowLowProgressWarning(false)}
            onClose={() => setShowLowProgressWarning(false)}
            title="نامکمل رپورٹ"
            description={`رپورٹ صرف ${overallProgress}% مکمل ہے۔ کیا آپ پھر بھی جمع کروانا چاہتے ہیں؟`}
            confirmText="جمع کروائیں"
            cancelText="واپس جائیں"
            type="confirm"
            showWarningIcon={true}
          />
        )}

        {/* Submit Confirmation Dialog */}
        {!isViewMode && (
          <Dialog
            visible={showSubmitDialog}
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowSubmitDialog(false)}
            onClose={() => setShowSubmitDialog(false)}
            title="رپورٹ جمع کروائیں"
            description="کیا آپ رپورٹ جمع کروانا چاہتے ہیں؟"
            confirmText="جمع کروائیں"
            cancelText="منسوخ کریں"
            type="confirm"
            showWarningIcon={true}
          />
        )}
        
        {/* Success Dialog */}
        {!isViewMode && (
          <Dialog
            visible={showSuccessDialog}
            onConfirm={() => {
              setShowSuccessDialog(false);
              handleBack();
            }}
            onClose={() => {
              setShowSuccessDialog(false);
              handleBack();
            }}
            title="رپورٹ جمع ہو گئی"
            description="آپ کی رپورٹ جمع کروا دی گئی ہے۔"
            confirmText="ٹھیک ہے"
            type="success"
            showSuccessIcon={true}
            autoClose={true}
            autoCloseTime={2000}
            showCloseButton={false}
          />
        )}
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Google Forms like light grey background
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.md,
  },
  headerInfoContainer: {
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  batchFillContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  statusIndicator: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightPrimary,
  },
  successIndicator: {
    backgroundColor: COLORS.success + '20', // 20% opacity
  },
  errorIndicator: {
    backgroundColor: COLORS.error + '20', // 20% opacity
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  successText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
  },
  copyDebugButton: {
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
  },
  copyDebugButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  globalSaveIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderBottomLeftRadius: BORDER_RADIUS.md,
    borderBottomRightRadius: BORDER_RADIUS.md,
  },
  loadingBadge: {
    backgroundColor: '#E0F2FE', // Light blue
  },
  successBadge: {
    backgroundColor: '#D1FAE5', // Light green
  },
  errorBadge: {
    backgroundColor: '#FEE2E2', // Light red
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginLeft: 4,
    writingDirection: 'rtl',
  },
  statusBadgeSuccessText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#065F46', // Dark green
    writingDirection: 'rtl',
  },
  statusBadgeErrorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#991B1B', // Dark red
    writingDirection: 'rtl',
  },
});

export default CreateReportScreen;