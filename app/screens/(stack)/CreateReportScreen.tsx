/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'expo-router';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';
import FormInput from '../../components/FormInput';
import CustomDropdown from '../../components/CustomDropdown';
import { TabGroup } from '@/app/components/Tab';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import Dialog from '@/app/components/Dialog';

import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@/app/constants/theme';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import {
  fetchAllReportData,
  selectCurrentReportData,
  selectReportQuestions,
  selectReportSections,
  selectReportTemplates,
  selectReportsError,
  selectReportsStatus,
  selectReportManagements,
  selectReportAnswers,
  selectLatestReportMgmt,
  // submitReport,
  submitReportAnswer,
  updateReportData,
} from '@/app/features/reports/reportsSlice';
import {
  selectUserTanzeemiLevelDetails,
  selectAllTanzeemiUnits,
} from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';

/* ------------------------------------------------------------------ */
/*  Types used locally                                                */
/* ------------------------------------------------------------------ */

interface ReportField {
  id: string;
  title: string;
  field: string;
  placeholder: string;
  isRequired?: boolean;
  inputType?: string;
  options?: any[];
}

interface ReportSectionLocal {
  id: string;
  title: string;
  fields: ReportField[];
}


/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const [showDialog, setShowDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedManagement, setSelectedManagement] = useState<any>(null);

  /* ------------ Redux state (immune to 'undefined') ------------- */
  const userTanzeemiLevel   = useSelector(selectUserTanzeemiLevelDetails) ?? null;
  const tanzeemiUnits    = useSelector(selectAllTanzeemiUnits) ?? [];
  const reportManagements = useSelector(selectReportManagements) ?? [];
  const reportTemplates  = useSelector(selectReportTemplates) ?? [];
  const reportSections   = useSelector(selectReportSections) ?? [];
  const reportQuestions  = useSelector(selectReportQuestions) ?? [];
  const reportAnswers  = useSelector(selectReportAnswers) ?? [];
  const reportData       = useSelector(selectCurrentReportData) ?? {};
  const latestReportMgmt = useSelector(selectLatestReportMgmt);
  const status           = useSelector(selectReportsStatus) ?? 'idle';
  const error            = useSelector(selectReportsError) ?? null;

console.log('userTanzeemiLevel', userTanzeemiLevel);
console.log('tanzeemiUnits', tanzeemiUnits);
console.log('reportManagements', reportManagements);
console.log('reportTemplates', reportTemplates);
console.log('reportSections', reportSections);
console.log('reportQuestions', reportQuestions);
console.log('reportData-------->', reportData);
  console.log('reportAnswers', reportAnswers);




  /* -------------------------------------------------------------- */
  /*  Data bootstrapping                                            */
  /* -------------------------------------------------------------- */

  // Initialize reportData with values from reportAnswers
  useEffect(() => {
    // Only run this effect when reportAnswers are available
    if (reportAnswers && reportAnswers.length > 0) {
      const initialData = { ...reportData };
      
      // Populate the reportData with values from reportAnswers
      reportAnswers.forEach(answer => {
        const questionId = answer.question_id;
        const fieldName = `question_${questionId}`;
        
        // Use string_value if available, otherwise use number_value
        const value = answer.string_value !== null && answer.string_value !== undefined
          ? answer.string_value
          : answer.number_value !== null && answer.number_value !== undefined
            ? String(answer.number_value)
            : '';
            
        initialData[fieldName] = value;
      });
      
      // Update the Redux store with the initial data
      console.log('Initializing reportData with values from reportAnswers:', initialData);
      
      // Dispatch the action to update the store with the initial data
      dispatch(updateReportData(initialData));
    }
  }, [reportAnswers, dispatch]);

  /* -------------------------------------------------------------- */
  /*  Build dynamic report sections safely                          */
  /* -------------------------------------------------------------- */
  const processedSections = useMemo<ReportSectionLocal[]>(() => {
    console.log('Processing sections with data:', { 
      sectionsLength: reportSections?.length ?? 0, 
      questionsLength: reportQuestions?.length ?? 0 
    });
    
    // If we don't have any sections from the API, use static data
    if (!reportSections?.length) {
      console.log('Using static report sections as fallback');
      return [];
    }

    // Map API sections to the format expected by the UI
    const processed = reportSections.map((section) => {
      // Find questions for this section
   

      const sectionQuestions = (reportQuestions ?? [])
        .filter((q) => q?.section_id === section.id);
        console.log('sectionQuestionssectionQuestionssectionQuestions>>>>>>>>>>>>',sectionQuestions);
        
        const sectionAnswer = (reportAnswers ?? [])
        .filter((q) => section.question_id === q.id);
      console.log(`Processing section ${section.id} (${section.section_label}) with ${sectionQuestions.length} questions`);
      console.log(`Section answer:===========safasdf=============================>>>>>>>`, sectionAnswer);
      
      return {
        id: section.id.toString(),
        title: section.section_label || `Section ${section.id}`,
        fields: sectionQuestions.map((q) => ({
          id: q.id.toString(),
          title: q.question_text || `Question ${q.id}`,
          field: `question_${q.id}`,
          placeholder: (reportAnswers ?? [])
            .filter((a) => a.question_id === q.id)[0]?.string_value ?? '',
          value: (reportAnswers ?? [])
            .filter((a) => a.question_id === q.id)[0]?.string_value ?? '',
          isRequired: q.highlight ?? false,
          inputType: q.input_type ?? 'text',
          options: undefined,
        })),
      };
    });
    
    console.log('Processed sections:', processed.length);
    return processed;
  }, [reportSections, reportQuestions]);


  /* -------------------------------------------------------------- */
  /*  Handlers                                                      */
  /* -------------------------------------------------------------- */
  const handleBack = () => navigation.goBack();

  const handleInputChange = (field: string) => (value: string) => {
    // TODO: Implement input change handler
    console.log(`Field ${field} changed to: ${value}`);
    // Return value or perform other actions as needed
  }
  







  const renderSection = ({ item }: { item: ReportSectionLocal }) => (
    <View style={styles.section}>
      <UrduText style={styles.sectionTitle}>{item.title}</UrduText>
      {item.fields.map((f) => (
        <FormInput
          key={f.id}
          inputTitle={f.title}
          value={String(reportData[f.field] ?? '')}
          onChange={handleInputChange(f.field)}
          keyboardType={f.inputType === 'number' ? 'numeric' : 'default'}
          placeholder={f.placeholder}
          required={f.isRequired}
        />
      ))}
    </View>
  );

  /* -------------------------------------------------------------- */
  /*  Submission pipeline                                           */
  /* -------------------------------------------------------------- */
  const validateRequired = (): string[] => {
    const missing: string[] = [];
    processedSections.forEach((sec) =>
      sec.fields.forEach((f) => {
        if (f.isRequired && !reportData[f.field]) missing.push(f.title);
      }),
    );
    return missing;
  };

  const handleContinue = () => {
    const missing = validateRequired();
    if (missing.length) {
      Alert.alert(
        'Missing Required Fields',
        `Please fill in: ${missing.join(', ')}`,
      );
      return;
    }
    setShowDialog(true);
  };
    
  // Extract question ID from field name (e.g., "question_8" -> 8)
  const getQuestionIdFromField = (field: string): number | null => {
    if (field.startsWith('question_')) {
      const idStr = field.replace('question_', '');
      const id = parseInt(idStr, 10);
      return isNaN(id) ? null : id;
    }
    return null;
  };
  
  // Store pending submissions to prevent duplicate API calls
  const pendingSubmissions = useRef<Record<string, boolean>>({});
  
  // Debounce function to prevent too many API calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };
  
  // Find existing answer for a question
  const findExistingAnswer = (questionId: number) => {
    return reportAnswers.find(answer => answer.question_id === questionId);
  };
  
  // Handle input blur to submit the answer to the API
  const handleInputBlur = (field: string) => () => {
    const value = reportData[field];
    if (value === undefined || value === '') return; // Don't submit empty values
    
    const questionId = getQuestionIdFromField(field);
    if (!questionId) return; // Not a question field
    
    // Check if we're already submitting this answer
    const submissionKey = `${questionId}_${value}`;
    if (pendingSubmissions.current[submissionKey]) {
      console.log(`Submission for question ${questionId} already in progress, skipping`);
      return;
    }
    
    // Mark this submission as pending
    pendingSubmissions.current[submissionKey] = true;
    
    // Check if we already have an answer for this question
    const existingAnswer = findExistingAnswer(questionId);
    
    console.log(`Submitting answer for question ${questionId} with value: ${value}${existingAnswer ? ' (update)' : ' (new)'}`);
    
    // Determine if the value is numeric or string
    const isNumeric = !isNaN(Number(value)) && value !== '';
    const payload = {
      submission_id: existingAnswer?.submission_id || null, // Use existing submission_id if available
      question_id: questionId,
      number_value: isNumeric ? Number(value) : null,
      string_value: isNumeric ? null : String(value)
    };
    
    // Use debounced version to prevent rapid API calls
    const debouncedSubmit = debounce(() => {
      // Dispatch the action to submit the answer
      dispatch(submitReportAnswer(payload))
        .unwrap()
        .then((result) => {
          console.log('Answer submitted successfully:', result);
          // Remove from pending submissions
          delete pendingSubmissions.current[submissionKey];
          
          // Show a small toast or indicator that the answer was saved
          // This is optional but provides good UX feedback
          // You could use a library like react-native-toast-message
        })
        .catch((error) => {
          console.error('Failed to submit answer:', error);
          // Remove from pending submissions
          delete pendingSubmissions.current[submissionKey];
          // Optionally show an error message to the user
          // Alert.alert('Error', 'Failed to save your answer. Please try again.');
        });
    }, 500); // 500ms debounce
    
    debouncedSubmit();
  };

  const handleDialogConfirm = async () => {
    setShowDialog(false);

    if (!selectedTemplateId || !selectedZone || !selectedYear) {
      Alert.alert('Error', 'Please select template, zone and year.');
      return;
    }

    try {
      // await dispatch(
      //   submitReport({
      //     templateId: selectedTemplateId,
      //     reportData: {
      //       ...reportData,
      //       zone_id: selectedZone,
      //       year: selectedYear,
      //       template_id: selectedTemplateId,
      //     },
      //   }),
      // ).unwrap();
      Alert.alert('Success', 'Report submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit report.');
    }
  };

  /* -------------------------------------------------------------- */
  /*  Conditional rendering                                         */
  /* -------------------------------------------------------------- */
  if (status === 'loading' && 
      !reportSections?.length && 
      !userTanzeemiLevel?.length && 
      !reportTemplates?.length) {
    console.log('Rendering loading state');
    return (
      <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <UrduText style={styles.loadingText}>Loading report data…</UrduText>
        </View>
      </ScreenLayout>
    );
  }

  if (status === 'failed' && error) {
    console.log('Rendering error state:', error);
    return (
      <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>
            Failed to load report data: {error}
          </UrduText>
          <CustomButton
            text="Retry"
            onPress={() => {
              console.log('Retrying data fetch');
              dispatch(fetchAllReportData());
            }}
            viewStyle={{
              backgroundColor: COLORS.primary,
              marginTop: SPACING.md,
            }}
            textStyle={{ color: COLORS.white }}
          />
        </View>
      </ScreenLayout>
    );
  }

  /* -------------------------------------------------------------- */
  /*  Main render                                                   */
  /* -------------------------------------------------------------- */
  console.log('latestReportMgmtlatestReportMgmtlatestReportMgmt',latestReportMgmt);
  
  
  return (
    <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
      <View style={styles.container}>
  
      <FormInput
          inputTitle="تنظیمی یونٹ"
          value={tanzeemiUnits.find(item => item.id === (selectedManagement?.unit_level_id || latestReportMgmt?.unit_level_id))?.Name || ''}
          editable={false}
          onChange={() => {}}
        />
        <FormInput
          inputTitle="رپورٹنگ ماہ و "
          value={latestReportMgmt 
            ? `${getUrduMonth(latestReportMgmt.month)} ${getUrduMonth(latestReportMgmt.month) +' '+ latestReportMgmt.year}ء` 
            : selectedYear || ''}
          editable={false}
          onChange={() => {}}
        />

    

        {/* Sections */}
        <FlatList
          data={processedSections}
          renderItem={renderSection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Continue button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            text="جاری رکھیں"
            onPress={handleContinue}
            viewStyle={{
              backgroundColor: COLORS.primary,
              flex: 1,
              marginHorizontal: SPACING.sm,
            }}
            textStyle={{ color: COLORS.white }}
            disabled={status === 'loading'}
          />
        </View>
      </View>

      {/* Confirmation dialog */}
      <Dialog
        onClose={() => setShowDialog(false)}
        visible={showDialog}
        onConfirm={handleDialogConfirm}
        onCancel={() => setShowDialog(false)}
        title="رپورٹ جمع کروانے کی تصدیق"
        description="کیا آپ واقعی اس رپورٹ کو جمع کروانا چاہتے ہیں؟ ایک بار جمع ہونے کے بعد، آپ اسے صرف ایڈمن کی اجازت سے ایڈٹ کر سکیں گے"
        confirmText="ہاں، جمع کروائیں"
        cancelText="نہیں، واپس جائیں"
        showWarningIcon
      />
    </ScreenLayout>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  dropdownContainer: { marginBottom: SPACING.md },
  tabTitle: {
    color: COLORS.primary,
    textAlign: 'left',
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  listContent: { paddingBottom: SPACING.xl * 3 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'left',
    lineHeight: 40,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: SPACING.md * 3,
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
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    textAlign: 'center',
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
