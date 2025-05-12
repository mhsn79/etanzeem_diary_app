/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import FormInput from '@/app/components/FormInput';
import CustomDropdown from '@/app/components/CustomDropdown';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/app/constants/theme';
import { AppDispatch } from '@/app/store';
import { 
  fetchReportData, 
  fetchReportQuestions, 
  saveAnswer, 
  createInitialSubmission,
  selectSections,
  selectQuestions,
  selectProgress,
  selectAnswers,
  selectStatus,
  selectError
} from '@/app/features/qa/qaSlice';
import { createSelector } from '@reduxjs/toolkit';
import { selectUserUnitDetails } from '@/app/features/tanzeem/tanzeemSlice';
import { selectManagementReportsList } from '@/app/features/reports/reportsSlice_new';
import SectionList from '@/app/components/SectionList';
import ScreenLayout from '@/app/components/ScreenLayout';

// Create a selector to transform sections into the expected format for SectionList
const selectSectionsWithProgress = createSelector(
  [selectSections, selectProgress],
  (sections, progress) => {
    if (!sections.allIds || !sections.byId) return [];
    
    return sections.allIds.map(id => {
      const section = sections.byId[id];
      const sectionProgress = progress[id] || { percentage: 0 };
      
      return {
        ...section,
        progress: sectionProgress.percentage
      };
    });
  }
);

// Create a selector to transform normalized questions into an array for SectionList
const selectQuestionsArray = createSelector(
  [selectQuestions],
  (questions) => {
    if (!questions.allIds || !questions.byId) return [];
    
    return questions.allIds.map(id => questions.byId[id]);
  }
);

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const templateId = params.templateId ? Number(params.templateId) : null;
  
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmissionId, setFormSubmissionId] = useState<number | null>(null);
  
  const sectionsData = useSelector(selectSections);
  const sectionsWithProgress = useSelector(selectSectionsWithProgress);
  const questionsNormalized = useSelector(selectQuestions);
  const questionsArray = useSelector(selectQuestionsArray);
  const progress = useSelector(selectProgress);
  const storedAnswers = useSelector(selectAnswers);
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const latestReportMgmt = useSelector(selectManagementReportsList);
  const status = useSelector(selectStatus);
  const error = useSelector(selectError);
  
  // Animation state for button press
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (templateId && userUnitDetails?.id && latestReportMgmt[0]?.template?.id) {
      const fetchParams = {
        template_id: templateId,
        unit_id: userUnitDetails.id,
        mgmt_id: latestReportMgmt[0]?.managements[0]?.id
      };
      
      dispatch(fetchReportData(fetchParams)).unwrap()
        .catch((error: unknown) => {
          console.error('Error fetching report data:', error);
          // Alert.alert('Error', 'Failed to load report data. Please try again.');
        });
        
      // Create initial submission
      dispatch(createInitialSubmission({
        template_id: templateId,
        unit_id: userUnitDetails.id,
        mgmt_id: latestReportMgmt[0]?.managements[0]?.id
      })).unwrap()
        .then((submission) => {
          if (submission.id) {
            setFormSubmissionId(submission.id);
          }
        })
        .catch((error: unknown) => {
          console.error('Error creating initial submission:', error);
          // Alert.alert('Error', 'Failed to initialize report. Please try again.');
        });
    }
  }, [templateId, userUnitDetails?.id, latestReportMgmt[0]?.template?.id]);

  const handleAnswerChange = useCallback((questionId: number, value: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formSubmissionId) {
      // Alert.alert('Error', 'Missing required information to submit report');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (Object.keys(answers).length === 0) {
        // Alert.alert('Warning', 'No answers have been provided. Please fill in at least one field.');
        return;
      }
      
      const savePromises = Object.entries(answers).map(([questionId, value]) => {
        return dispatch(saveAnswer({
          submission_id: formSubmissionId,
          question_id: Number(questionId),
          string_value: typeof value === 'string' ? value : null,
          number_value: typeof value === 'number' ? value : null
        })).unwrap();
      });
      
      await Promise.all(savePromises);
      
      // Alert.alert('Success', 'Report submitted successfully');
      navigation.goBack();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Alert.alert('Error', 'Failed to submit report: ' + errorMessage);
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, formSubmissionId]);


  // Show loading or error states
  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
      </View>
    );
  }

  if (status === 'failed' && error) {
    return (
      <View style={styles.errorContainer}>
        <UrduText style={styles.errorText}>خرابی: {error}</UrduText>
      </View>
    );
  }

  return (
    <ScreenLayout title="رپورٹ بنائیں" onBack={() => navigation.goBack()}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={{ paddingBottom: SPACING.xl * 2 }}
        >
          <View style={styles.headerInfoContainer}>
            <FormInput
              inputTitle="تنظیمی یونٹ"
              value={userUnitDetails?.Name || ''}
              editable={false}
              onChange={() => {}}
            />
            <FormInput
              inputTitle="رپورٹنگ ماہ و سال"
              value={
                latestReportMgmt[0]?.managements[0]
                  ? `${latestReportMgmt[0]?.managements[0]?.month} ${latestReportMgmt[0]?.managements[0].year}`
                  : ''
              }
              editable={false}
              onChange={() => {}}
            />
          </View>
          
          <SectionList
            sections={sectionsWithProgress}
            questions={questionsArray}
            answers={storedAnswers.byId}
            onAnswerChange={handleAnswerChange}
          />
        </ScrollView>

        <Animated.View 
          style={[
            styles.buttonContainer
          ]}
        >
          <CustomButton
            text="جمع کروائیں"
            onPress={handleSubmit}
       
            viewStyle={{
              backgroundColor: COLORS.primary,
             
              flex:1,
              marginHorizontal: SPACING.md,
            }}
            textStyle={{
              color: COLORS.white,
             
            }}
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </Animated.View>
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
    padding: SPACING.md,
  },
  headerInfoContainer: {
    marginBottom: SPACING.md,
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
});

export default CreateReportScreen;