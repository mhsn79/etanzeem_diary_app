/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
import Dialog from '@/app/components/Dialog';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/app/constants/theme';
import { AppDispatch } from '@/app/store';
import { 
  initializeReportData, 
  saveAnswer, 
  submitReport,
  selectSectionsWithProgress,
  selectQuestionsArray,
  selectAnswers,
  selectStatus,
  selectError,
  selectSaveStatus,
  selectSaveError,
  selectSubmitStatus,
  selectSubmitError,
  selectCurrentSubmissionId
} from '@/app/features/qa/qaSlice';
import { selectUserUnitDetails } from '@/app/features/tanzeem/tanzeemSlice';
import { selectManagementReportsList } from '@/app/features/reports/reportsSlice_new';
import { useTokenRefresh } from '@/app/utils/tokenRefresh';
import SectionList from '@/app/components/SectionList';
import ScreenLayout from '@/app/components/ScreenLayout';
import { getUrduMonth } from '@/app/constants/urduLocalization';

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const templateId = params.templateId ? Number(params.templateId) : null;
  const mode = params.mode as 'view' | 'edit' | undefined;
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  // Use our token refresh hook
  const { refreshTokenIfNeeded, ensureFreshTokenBeforeOperation } = useTokenRefresh();
  
  // Dialog states
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  // Animation ref for button press
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Selectors
  const sectionsWithProgress = useSelector(selectSectionsWithProgress);
  const questionsArray = useSelector(selectQuestionsArray);
  const storedAnswers = useSelector(selectAnswers);
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const latestReportMgmt = useSelector(selectManagementReportsList);
  const status = useSelector(selectStatus);
  const error = useSelector(selectError);
  const saveStatus = useSelector(selectSaveStatus);
  const saveError = useSelector(selectSaveError);
  const submitStatus = useSelector(selectSubmitStatus);
  const submitError = useSelector(selectSubmitError);
  const currentSubmissionId = useSelector(selectCurrentSubmissionId);

  // Memoized values
  const unitName = useMemo(() => userUnitDetails?.Name || '', [userUnitDetails?.Name]);
  const reportingPeriod = useMemo(() => {
    return latestReportMgmt[0]?.managements[0]
      ? `${getUrduMonth(latestReportMgmt[0]?.managements[0]?.month)} ${latestReportMgmt[0]?.managements[0].year}`
      : '';
  }, [latestReportMgmt]);

  // Ensure we have a fresh token before initializing report data
  useEffect(() => {
    // Refresh token if needed when the screen loads
    refreshTokenIfNeeded();
  }, []);

  // Initialize report data
  useEffect(() => {
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
        .then(() => {
          console.table('رپورٹ ڈیٹا لوڈ ہو گیا ہے');
        })
        .catch((error) => {
          console.error('Error initializing report data:', error);
          console.error('رپورٹ ڈیٹا لوڈ کرنے میں خرابی');
        });
    }
  }, [templateId, userUnitDetails?.id, latestReportMgmt[0]?.managements[0]?.id]);

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: number, value: string | number) => {
    if (!currentSubmissionId) {
      console.error('رپورٹ ابھی تک شروع نہیں ہوئی ہے');
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
  }, [currentSubmissionId, dispatch, ensureFreshTokenBeforeOperation]);

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
  }, [currentSubmissionId, dispatch, ensureFreshTokenBeforeOperation]);

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
          <View style={styles.headerInfoContainer}>
            <FormInput
              inputTitle="تنظیمی یونٹ"
              value={unitName}
              editable={false}
              onChange={() => {}}
            />
            <FormInput
              inputTitle="رپورٹنگ ماہ و سال"
              value={reportingPeriod}
              editable={false}
              onChange={() => {}}
            />
          </View>
          
          <SectionList
            sections={sectionsWithProgress}
            questions={questionsArray}
            answers={Object.values(storedAnswers.byId)}
            onAnswerChange={handleAnswerChange}
            disabled={isViewMode}
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
                marginHorizontal: SPACING.md,
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
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
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
});

export default CreateReportScreen;