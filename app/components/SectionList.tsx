import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import UrduText from '@/app/components/UrduText';
import FormInput from '@/app/components/FormInput';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/app/constants/theme';
import { ReportSection, ReportQuestion, ReportAnswer } from '@/app/features/qa/types';
import { saveAnswer, selectCurrentSubmissionId } from '@/app/features/qa/qaSlice';
import { AppDispatch } from '@/app/store';

// Helper function to get the correct answer value based on question type
const getAnswerValue = (
  answers: ReportAnswer[],
  questionId: number,
  inputType: string
) => {
  const answer = answers.find(a => a.question_id === questionId);
  if (!answer) return '';
  
  // Handle the three specific input types
  switch (inputType) {
    case 'number':
      // Convert to string for display in the input field
      return answer.number_value !== null && answer.number_value !== undefined 
        ? String(answer.number_value) 
        : '';
    case 'string':
    case 'text':
    default:
      return answer.string_value || '';
  }
};

// Helper function to process input values based on type
const processInputValue = (value: string, inputType: string): string | number | null => {
  // Handle the three specific input types
  switch (inputType) {
    case 'number':
      // For empty inputs, return 0
      if (value === '' || value === null || value === undefined) {
        return 0;
      } else {
        const numValue = parseFloat(value);
        return !isNaN(numValue) ? numValue : 0;
      }
    case 'string':
      // For string inputs, return the value or null
      return value || null;
    case 'text':
      // For text inputs (potentially multiline), return the value or null
      return value || null;
    default:
      // Default case, treat as string
      return value || null;
  }
};

// Memoized Question component to prevent unnecessary re-renders
const Question = memo(({ 
  question, 
  value, 
  submissionId,
}: { 
  question: ReportQuestion; 
  value: any; 
  submissionId: number | null;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Memoize the string representation of the value for comparison
  const stringValue = useMemo(() => 
    value === null || value === undefined ? '' : String(value),
  [value]);
  
  // Store the current input value in state to track changes
  const [inputValue, setInputValue] = useState<string>(stringValue);
  
  // Track save status
  const [isSaving, setIsSaving] = useState(false);
  
  // Track validation status and messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(stringValue);
  }, [stringValue]);
  
  // Debounce timer ref to avoid excessive API calls
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Function to save answer to API
  const saveAnswerToApi = useCallback((valueToSave: string | number | null) => {
    if (!submissionId) {
      console.error('Cannot save answer: No submission ID available');
      setError('محفوظ نہیں کیا جا سکتا: کوئی سبمشن آئی ڈی میسر نہیں');
      return;
    }
    
    // Clear previous messages
    setError(null);
    setSuccessMessage(null);
    
    // Set saving state to show loading indicator
    setIsSaving(true);
    
    // Prepare the answer data based on question type
    const answerData = {
      submission_id: submissionId,
      question_id: question.id,
      string_value: question.input_type === 'number' ? null : valueToSave as string | null,
      number_value: question.input_type === 'number' ? valueToSave as number : null
    };
    
    // Dispatch the saveAnswer action - the Redux thunk will handle create vs update logic
    dispatch(saveAnswer(answerData))
      .unwrap()
      .then(() => {
        // Show success message
        setSuccessMessage('جواب کامیابی سے محفوظ ہو گیا');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      })
      .catch((error) => {
        console.error(`Error saving answer for question ${question.id}:`, error);
        setError('جواب محفوظ کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔');
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [dispatch, question.id, question.input_type, submissionId]);
  
  // Process input value for saving
  const processValue = useCallback((text: string) => {
    return processInputValue(text, question.input_type);
  }, [question.input_type]);

  // Unified function to handle saving with debounce
  const debouncedSave = useCallback((text: string, immediate = false) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    const saveNow = () => {
      // Process the value and save it
      const valueToSave = processValue(text);
      saveAnswerToApi(valueToSave);
    };
    
    if (immediate) {
      // For blur events, save immediately
      saveNow();
    } else {
      // For typing events, debounce to avoid excessive API calls
      debounceTimerRef.current = setTimeout(saveNow, 500);
    }
  }, [processValue, saveAnswerToApi]);
  
  // Handle input change with debounce for auto-save
  const handleInputChange = useCallback((text: string) => {
    // Clear previous messages
    setError(null);
    setSuccessMessage(null);
    
    switch (question.input_type) {
      case 'number':
        // Allow empty string, digits, decimal point, and minus sign
        if (text === '' || /^-?\d*\.?\d*$/.test(text)) {
          setInputValue(text);
          
          // Validate number input
          if (text !== '' && isNaN(parseFloat(text))) {
            setError('براہ کرم ایک درست نمبر درج کریں');
          } else {
            // Auto-save after a short delay if the input is valid
            debouncedSave(text, false);
          }
        } else {
          setError('براہ کرم ایک درست نمبر درج کریں');
        }
        break;
      
      case 'string':
        // Basic validation for string input
        setInputValue(text);
        if (text.length > 100) {
          setError('ان پٹ بہت لمبا ہے (زیادہ سے زیادہ 100 حروف)');
        } else {
          debouncedSave(text, false);
        }
        break;
        
      case 'text':
        // Text can be any length
        setInputValue(text);
        debouncedSave(text, false);
        break;
        
      default:
        // For other inputs, just update the value
        setInputValue(text);
        debouncedSave(text, false);
        break;
    }
  }, [question.input_type, debouncedSave]);
  
  // Handle blur event to save immediately
  const handleBlur = useCallback(() => {
    // No immediate save on blur as per existing logic
  }, []);
  
  // Clean up the debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Determine the appropriate keyboard type based on question input type
  const getKeyboardType = useCallback(() => {
    switch (question.input_type) {
      case 'number':
        return 'numeric';
      case 'string':
      case 'text':
      default:
        return 'default';
    }
  }, [question.input_type]);

  // Determine if the input should be multiline
  const shouldBeMultiline = useCallback(() => {
    // Text type is always multiline
    if (question.input_type === 'text') {
      return true;
    }
    
    // Also make it multiline if the current input is long
    if (inputValue.length > 50) {
      return true;
    }
    
    return false;
  }, [question.input_type, inputValue.length]);

  // Get placeholder text based on question type
  const getPlaceholder = useCallback(() => {
    switch (question.input_type) {
      case 'number':
        return 'ایک نمبر درج کریں';
      case 'text':
        return 'تفصیلی جواب درج کریں';
      case 'string':
      default:
        return 'اپنا جواب درج کریں';
    }
  }, [question.input_type]);

  return (
    <View style={styles.questionItem}>
      <FormInput
        inputTitle={question.question_text}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={getPlaceholder()}
        keyboardType={getKeyboardType()}
        loading={isSaving}
        editable={!isSaving}
        multiline={shouldBeMultiline()}
        numberOfLines={shouldBeMultiline() ? 3 : 1}
        error={error}
      />
      
      {/* Success message */}
      {successMessage && (
        <View style={styles.messageContainer}>
          <UrduText style={styles.successMessage}>{successMessage}</UrduText>
        </View>
      )}
    </View>
  );
});

// Memoized Accordion Section component
const AccordionSection = memo(({ 
  section, 
  questions, 
  answers,
  submissionId
}: {
  section: ReportSection & { progress: number };
  questions: ReportQuestion[];
  answers: ReportAnswer[];
  submissionId: number | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleSection = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  // Memoize the section title to avoid unnecessary re-renders
  const sectionTitle = useMemo(() => {
    return section.section_label.length > 50 
      ? `${section.section_label.slice(0, 50)}...` 
      : section.section_label;
  }, [section.section_label]);
  
  // Memoize the question components to avoid unnecessary re-renders
  const questionComponents = useMemo(() => {
    if (!isOpen) return null;
    
    return questions.map((question) => {
      const answerValue = getAnswerValue(answers, question.id, question.input_type);
      
      return (
        <Question
          key={question.id}
          question={question}
          value={answerValue}
          submissionId={submissionId}
        />
      );
    });
  }, [isOpen, questions, answers, submissionId]);

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity 
        style={[
          styles.sectionHeader,
          section.progress === 100 && styles.completedSectionHeader
        ]} 
        onPress={handleToggleSection}
      >
        <View style={styles.headerTextContainer}>
          <UrduText style={styles.sectionTitle}>
            {sectionTitle}
          </UrduText>
          <View style={styles.progressContainer}>
            <Text 
              style={[
                styles.progressText,
                section.progress === 100 && styles.completedProgressText
              ]}
            >
              {section.progress}%
            </Text>
            <Ionicons 
              name={isOpen ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={section.progress === 100 ? COLORS.success : COLORS.primary} 
            />
          </View>
        </View>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.questionsContainer}>
          {questionComponents}
        </View>
      )}
    </View>
  );
});

interface SectionListProps {
  sections: Array<ReportSection & { progress: number }>;
  questions: ReportQuestion[];
  answers: ReportAnswer[];
  onAnswerChange?: (questionId: number, value: any) => void; // Make optional since we're using direct dispatch
}

// Main SectionList component
const SectionList = memo(({ sections, questions, answers, onAnswerChange }: SectionListProps) => {
  // Get the current submission ID from Redux
  const submissionId = useSelector(selectCurrentSubmissionId);

  // Memoize the section components to avoid unnecessary re-renders
  const sectionComponents = useMemo(() => {
    return sections.map((section) => {
      // Filter questions for this section
      const sectionQuestions = questions.filter((q) => q.section_id === section.id);
      
      return (
        <AccordionSection
          key={section.id}
          section={section}
          questions={sectionQuestions}
          answers={answers}
          submissionId={submissionId}
        />
      );
    });
  }, [sections, questions, answers, submissionId]);

  return (
    <View style={styles.container}>
      {sectionComponents}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: SPACING.xl,
    marginHorizontal:SPACING.md
  },
  messageContainer: {
    paddingHorizontal: SPACING.sm,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.xs,
  },
  successMessage: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'right',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: BORDER_RADIUS.sm,
  },
  completedSectionHeader: {
    backgroundColor: COLORS.success + '20', // 20% opacity success color
  },
  headerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    textAlign: 'left',
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginRight: SPACING.xs,
    fontWeight: '600',
  },
  completedProgressText: {
    color: COLORS.success,
  },
  questionsContainer: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS.md,
    borderBottomRightRadius: BORDER_RADIUS.md,
  },
  questionItem: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
});

export default SectionList;