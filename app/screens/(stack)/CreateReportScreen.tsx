/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
import Dialog from '@/app/components/Dialog';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/app/constants/theme';
import { AppDispatch } from '@/app/store';
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
  saveAnswer,
  submitReport
} from '@/app/features/qa/qaSlice';
import { selectUserUnitDetails, selectUserTanzeemiLevelDetails } from '@/app/features/tanzeem/tanzeemSlice';
import { selectManagementReportsList } from '@/app/features/reports/reportsSlice_new';
import { useTokenRefresh } from '@/app/utils/tokenRefresh';
import SectionList from '@/app/components/SectionList';
import ScreenLayout from '@/app/components/ScreenLayout';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import { ensureFreshToken, directApiRequest } from '@/app/services/apiClient';
import { setError } from '@/app/features/auth/authSlice';

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  
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


  
  const templateId = params.templateId ? Number(params.templateId) : null;
  const submissionId = params.submissionId ? Number(params.submissionId) : null;
  const managementId = params.managementId ? Number(params.managementId) : null;
  const unitId = params.unitId ? Number(params.unitId) : null;
  const mode = params.mode as 'view' | 'edit' | undefined;
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  

  // Use our token refresh hook
  const { refreshTokenIfNeeded, ensureFreshTokenBeforeOperation } = useTokenRefresh();
  
  // Dialog states
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // State to store fetched management details for historical submissions
  const [fetchedManagementDetails, setFetchedManagementDetails] = useState<any>(null);
  
  // Animation ref for button press
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Selectors
  const sectionsWithProgress = useSelector((state) => selectSectionsWithProgress(state, templateId || undefined));
  const questionsArray = useSelector(selectQuestionsArray);
  const storedAnswers = useSelector(selectAnswers);
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const userTanzeemiLevelDetails = useSelector(selectUserTanzeemiLevelDetails);
  const latestReportMgmt = useSelector(selectManagementReportsList);
  const status = useSelector(selectStatus);
  const error = useSelector(selectError);
  const saveStatus = useSelector(selectSaveStatus);
  const saveError = useSelector(selectSaveError);
  const submitStatus = useSelector(selectSubmitStatus);
  const submitError = useSelector(selectSubmitError);
  const currentSubmissionId = useSelector(selectCurrentSubmissionId);
  
  // // Debug currentSubmissionId changes
  // useEffect(() => {
  //   console.log('[CreateReportScreen] currentSubmissionId changed:', {
  //     currentSubmissionId,
  //     submissionId,
  //     templateId,
  //     unitId,
  //     managementId
  //   });
  // }, [currentSubmissionId, submissionId, templateId, unitId, managementId]);

  // Get submission-specific answers
  const submissionAnswers = useSelector((state) => 
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

  // Force token refresh on screen focus
  useFocusEffect(
    React.useCallback(() => {
      // Clear answers when screen comes into focus to ensure clean state
      if (submissionId && currentSubmissionId !== submissionId) {
        console.log('[CreateReportScreen] Clearing QA state for new submission:', {
          currentSubmissionId,
          newSubmissionId: submissionId
        });
        dispatch(clearAnswers());
      }
      
      ensureFreshToken()
        .catch((error) => {
          dispatch(setError('Your session has expired. Please log in again.'));
          router.replace('/screens/LoginScreen');
        });
    }, [dispatch, submissionId, currentSubmissionId])
  );

  // Ensure we have a fresh token before initializing report data
  useEffect(() => {
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
    if ((isEditMode || isViewMode) && submissionId) {
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
    
    // For new report creation
    if (templateId && userUnitDetails?.id && latestReportMgmt[0]?.managements[0]?.id) {
      const initParams = {
        template_id: templateId,
        unit_id: userUnitDetails.id,
        mgmt_id: latestReportMgmt[0]?.managements[0]?.id
      };
      
      // First ensure we have a fresh token
      ensureFreshTokenBeforeOperation()
        .then(() => {
          // Then initialize the report data
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

    if (!templateId || !userUnitDetails?.id || !latestReportMgmt[0]?.managements[0]?.id) {
      dispatch(setError('Missing required information to create a report. Please try again.'));
      router.replace('/screens/Dashboard');
      return;
    }
  }, [templateId, userUnitDetails?.id, latestReportMgmt[0]?.managements[0]?.id, submissionId, isEditMode, isViewMode]);

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: number, value: string | number) => {
    console.log('[CreateReportScreen] handleAnswerChange called:', {
      questionId,
      value,
      currentSubmissionId,
      templateId,
      unitId,
      managementId
    });
    
    if (!currentSubmissionId) {
      console.error('[CreateReportScreen] No currentSubmissionId available:', {
        currentSubmissionId,
        templateId,
        unitId,
        managementId,
        submissionId
      });
      return;
    }
    
    // First ensure we have a fresh token
    ensureFreshTokenBeforeOperation()
      .then(() => {
        // Then save the answer
        return dispatch(saveAnswer({
          submission_id: currentSubmissionId,
          question_id: questionId,
          string_value: typeof value === 'string' ? value : null,
          number_value: typeof value === 'number' ? value : null
        })).unwrap();
      })
      .catch((error) => {
        console.error('Error saving answer:', error);
        console.error('جواب محفوظ کرنے میں خرابی');
      });
  }, [currentSubmissionId, dispatch, ensureFreshTokenBeforeOperation, templateId, unitId, managementId]);

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
        // Show confirmation dialog
        setShowSubmitDialog(true);
      })
      .catch((error) => {
        console.error('Error refreshing token before submission:', error);
      });
  }, [currentSubmissionId, scaleAnim, refreshTokenIfNeeded]);
  
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
        console.error('رپورٹ جمع کروانے میں خرابی');
      });
  }, [currentSubmissionId, dispatch, ensureFreshTokenBeforeOperation, templateId, unitId, managementId]);

  // Show loading state
  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
      </View>
    );
  }

  // Show error state
  if (status === 'failed' && error) {
    return (
      <View style={styles.errorContainer}>
        <UrduText style={styles.errorText}>خرابی: {error}</UrduText>
        <CustomButton
          text="دوبارہ کوشش کریں"
          onPress={() => navigation.goBack()}
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
      title={isViewMode ? 'رپورٹ دیکھیں' : isEditMode ? 'رپورٹ ترمیم کریں' : 'رپورٹ بنائیں'}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={{ paddingBottom: SPACING.xl * 2 }}
        >
          {/* Debug Info */}
          <View style={styles.debugContainer}>
            <UrduText style={styles.debugText}>
              DEBUG: Submission ID: {currentSubmissionId || 'NULL'} | Params: {submissionId || 'NULL'} | Template: {templateId} | Unit: {unitId} | Mgmt: {managementId}
            </UrduText>
          </View>
          
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
          
          <SectionList
            sections={sectionsWithProgress}
            questions={questionsArray}
            answers={submissionAnswers}
            onAnswerChange={handleAnswerChange}
            disabled={isViewMode}
            currentUnitId={unitId}
            submissionId={currentSubmissionId}
          />
        </ScrollView>

        {!isViewMode && (
          <Animated.View 
            style={[
              styles.buttonContainer,
              { transform: [{ scale: scaleAnim }] }
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
        
        {/* Status indicators */}
        {/* {saveStatus === 'loading' && (
          <View style={styles.statusIndicator}>
            <UrduText style={styles.statusText}>جواب محفوظ ہو رہا ہے...</UrduText>
          </View>
        )}
        
        {saveStatus === 'succeeded' && (
          <View style={[styles.statusIndicator, styles.successIndicator]}>
            <UrduText style={styles.successText}>جواب محفوظ ہو گیا</UrduText>
          </View>
        )}
        
        {saveStatus === 'failed' && saveError && (
          <View style={[styles.statusIndicator, styles.errorIndicator]}>
            <UrduText style={styles.errorText}>خرابی: {saveError}</UrduText>
          </View>
        )} */}
        
        {/* Submit Confirmation Dialog */}
        {!isViewMode && (
          <Dialog
            visible={showSubmitDialog}
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowSubmitDialog(false)}
            onClose={() => setShowSubmitDialog(false)}
            title="رپورٹ جمع کروائیں"
            description="کیا آپ واقعی رپورٹ جمع کروانا چاہتے ہیں؟"
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
              navigation.goBack();
            }}
            onClose={() => {
              setShowSuccessDialog(false);
              navigation.goBack();
            }}
            title="رپورٹ جمع ہو گئی"
            description="آپ کی رپورٹ کامیابی سے جمع کروا دی گئی ہے۔"
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
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,


  },
  headerInfoContainer: {
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  debugContainer: {
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  debugText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
    fontFamily: 'SpaceMono-Regular',
  },
});

export default CreateReportScreen;