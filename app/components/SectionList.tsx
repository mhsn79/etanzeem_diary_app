import React, { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import UrduText from '@/app/components/UrduText';
import FormInput from '@/app/components/FormInput';
import AutoQuestionInput from '@/app/components/AutoQuestionInput';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/app/constants/theme';
import { ReportSection, ReportQuestion, ReportAnswer } from '@/app/features/qa/types';
import { saveAnswer, selectCurrentSubmissionId } from '@/app/features/qa/qaSlice';
import { isAutoQuestion } from '@/app/features/qa/utils';
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
    case 'text':
      return answer.text_value || answer.string_value || '';
    case 'string':
    default:
      return answer.string_value || '';
  }
};

// Helper function to process input values based on type
const processInputValue = (value: string, inputType: string): string | number | null => {
  // Handle the three specific input types
  switch (inputType) {
    case 'number':
      // For empty inputs, return null so progress tracking reflects unanswered
      if (value === '' || value === null || value === undefined) {
        return null;
      } else {
        const numValue = parseFloat(value);
        return !isNaN(numValue) ? numValue : null;
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
  disabled,
  currentUnitId,
}: { 
  question: ReportQuestion; 
  value: any; 
  submissionId: number | null;
  disabled?: boolean;
  currentUnitId?: number | null;
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Track whether the input is currently focused (must be before early return to satisfy hooks rules)
  const isFocusedRef = useRef(false);

  // Check if this is an auto-calculated question
  const isAuto = isAutoQuestion(question);
  
  // If it's an auto question, render the AutoQuestionInput component
  if (isAuto) {
    return (
      <AutoQuestionInput
        question={question}
        value={value}
        submissionId={submissionId}
        disabled={disabled}
        currentUnitId={currentUnitId}
        onValueChange={(newValue) => {
          console.log('[SectionList] AutoQuestionInput onValueChange called:', {
            newValue,
            newValueType: typeof newValue,
            questionId: question.id,
            submissionId,
            questionInputType: question.input_type
          });
          
          if (!submissionId) {
            console.warn('[SectionList] No submissionId available for saving answer');
            return;
          }
          
          const answerData = {
            submission_id: submissionId,
            question_id: question.id,
            string_value: question.input_type === 'number' || question.input_type === 'text' ? null : String(newValue),
            text_value: question.input_type === 'text' ? String(newValue) : null,
            number_value: question.input_type === 'number' ? Number(newValue) : null,
          };

          console.log('[SectionList] Dispatching saveAnswer with data:', answerData);

          dispatch(saveAnswer(answerData));
        }}
      />
    );
  }
  
  // For manual questions, use the existing logic
  const stringValue = useMemo(() => 
    value === null || value === undefined ? '' : String(value),
  [value]);
  
  // Store the current input value in state to track changes
  const [inputValue, setInputValue] = useState<string>(stringValue);

  // Track save status
  const [isSaving, setIsSaving] = useState(false);

  // Track validation status and messages
  const [error, setError] = useState<string | null>(null);

  // Update local state when prop value changes — but skip while user is typing (focused)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setInputValue(stringValue);
    }
  }, [stringValue]);
  
  // Debounce timer ref to avoid excessive API calls
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Function to save answer to API
  const saveAnswerToApi = useCallback((valueToSave: string | number | null) => {
    if (!submissionId) {
      console.error('Cannot save answer: No submission ID available');
      setError('محفوظ نہیں ہو سکا: رپورٹ ابھی تیار نہیں ہوئی');
      return;
    }
    
    // Clear previous messages
    setError(null);
    
    // Set saving state to show loading indicator
    setIsSaving(true);
    
    // Prepare the answer data based on question type
    const answerData = {
      submission_id: submissionId,
      question_id: question.id,
      string_value: question.input_type === 'number' || question.input_type === 'text' ? null : valueToSave as string | null,
      text_value: question.input_type === 'text' ? valueToSave as string | null : null,
      number_value: question.input_type === 'number' ? valueToSave as number : null,
    };
    
    // Dispatch the saveAnswer action - the Redux thunk will handle create vs update logic
    dispatch(saveAnswer(answerData))
      .unwrap()
      .then(() => {
        // Success is now handled by the global save indicator
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
      // For typing events
      debounceTimerRef.current = setTimeout(saveNow, 500);
    }
  }, [processValue, saveAnswerToApi]);
  
  // Handle input change with debounce for auto-save
  const handleInputChange = useCallback((text: string) => {
    isFocusedRef.current = true;
    // Clear previous messages
    setError(null);
    
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
          setError('متن بہت لمبا ہے (زیادہ سے زیادہ 100 حروف)');
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
  
  // Handle blur event — save immediately (cancels any pending debounce)
  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    if (inputValue !== stringValue) {
      debouncedSave(inputValue, true);
    }
  }, [inputValue, stringValue, debouncedSave]);
  
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

  // Determine if the input should be multiline — only text type is multiline
  const isMultiline = question.input_type === 'text';

  // Get placeholder text based on question type
  const getPlaceholder = useCallback(() => {
    switch (question.input_type) {
      case 'number':
        return 'نمبر میں جواب لکھیں';
      case 'text':
        return 'الفاظ میں تفصیل لکھیں';
      case 'string':
      default:
        return 'الفاظ میں جواب لکھیں';
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
        editable={!disabled}
        multiline={isMultiline}
        numberOfLines={isMultiline ? 3 : 1}
        error={error}
      />
    </View>
  );
});

// Memoized Accordion Section component
const SectionBlock = memo(({
  section,
  questions,
  answers,
  submissionId,
  disabled,
  currentUnitId,
}: {
  section: ReportSection & { progress: number };
  questions: ReportQuestion[];
  answers: ReportAnswer[];
  submissionId: number | null;
  disabled?: boolean;
  currentUnitId?: number | null;
}) => {
  // Memoize the section title to avoid unnecessary re-renders
  const sectionTitle = useMemo(() => {
    return section.section_label;
  }, [section.section_label]);
  
  // Memoize the question components to avoid unnecessary re-renders
  const questionComponents = useMemo(() => {
    return questions.map((question) => {
      const answerValue = getAnswerValue(answers, question.id, question.input_type);
      
      return (
        <View key={question.id} style={styles.cardContainer}>
          <Question
            question={question}
            value={answerValue}
            submissionId={submissionId}
            disabled={disabled}
            currentUnitId={currentUnitId}
          />
        </View>
      );
    });
  }, [questions, answers, submissionId, disabled, currentUnitId]);

  return (
    <View style={styles.sectionContainer}>
      <View 
        style={[
          styles.sectionHeader,
          section.progress === 100 && styles.completedSectionHeader
        ]} 
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
            {section.progress === 100 && (
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={COLORS.success} 
              />
            )}
          </View>
        </View>
      </View>
      <View style={styles.questionsContainer}>
        {questionComponents}
      </View>
    </View>
  );
});

interface SectionListProps {
  sections: Array<ReportSection & { progress: number }>;
  questions: ReportQuestion[];
  answers: ReportAnswer[];
  disabled?: boolean;
  currentUnitId?: number | null;
  submissionId?: number | null;
}

// Main SectionList component
const SectionList: React.FC<SectionListProps> = ({
  sections,
  questions,
  answers,
  disabled = false,
  currentUnitId,
  submissionId,
}) => {
  // Use the submissionId prop if provided, otherwise get from Redux
  const reduxSubmissionId = useSelector(selectCurrentSubmissionId);
  const finalSubmissionId = submissionId || reduxSubmissionId;

  // Memoize the section components to avoid unnecessary re-renders
  const sectionComponents = useMemo(() => {
    return sections.map((section, index) => {
      // Filter questions for this section
      const sectionQuestions = questions.filter((q) => q.section_id === section.id);

      return (
        <SectionBlock
          key={section.id}
          section={section}
          questions={sectionQuestions}
          answers={answers}
          submissionId={finalSubmissionId}
          disabled={disabled}
          currentUnitId={currentUnitId}
        />
      );
    });
  }, [sections, questions, answers, finalSubmissionId, currentUnitId]);

  return (
    <View style={styles.container}>
      {sectionComponents}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: SPACING.lg,
    marginHorizontal: SPACING.md
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  completedSectionHeader: {
    // optional success styling for section header text
  },
  headerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'left',
    color: COLORS.primary,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
    fontWeight: '600',
  },
  completedProgressText: {
    color: COLORS.success,
  },
  questionsContainer: {
    gap: SPACING.md, // Add spacing between individual question cards
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden', // to keep border radius intact with inner items
  },
  questionItem: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
});

export default SectionList;