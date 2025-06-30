import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import UrduText from './UrduText';
import FormInput from './FormInput';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { ReportQuestion, ReportAnswer } from '../features/qa/types';
import { saveAnswer } from '../features/qa/qaSlice';
import { calculateAutoValue, getCalculationButtonText } from '../features/qa/utils';
import { AppDispatch } from '../store';
import { selectUserUnitDetails, selectUserUnitHierarchyIds } from '../features/tanzeem/tanzeemSlice';
import { fetchActivityCount, selectActivityCountStatus, selectActivityCountError, selectActivityCount } from '../features/activities/activitySlice';
import { fetchPersonCount, selectPersonCountStatus, selectPersonCountError, selectPersonCount } from '../features/persons/personSlice';

interface AutoQuestionInputProps {
  question: ReportQuestion;
  value: string | number;
  submissionId: number | null;
  disabled?: boolean;
  onValueChange?: (value: string | number) => void;
}

const AutoQuestionInput: React.FC<AutoQuestionInputProps> = ({
  question,
  value,
  submissionId,
  disabled = false,
  onValueChange
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const userUnitDetails = useSelector(selectUserUnitDetails);
  // Removed userUnitHierarchyIds and activity count state
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationSuccess, setCalculationSuccess] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(String(value || ''));
  // Removed countMessage

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  // Fetch count based on linked_to_type and update input value
  const handleFetchCount = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);
    setCalculationSuccess(null);
    try {
      if (!question.linked_to_id) {
        setCalculationError('linked_to_id میسر نہیں ہے');
        setIsCalculating(false);
        return;
      }

      let result: number;

      // Handle different linked_to_type cases
      if (question.linked_to_type === 'contacts') {
        // Fetch person count based on contact_type
        result = await dispatch(fetchPersonCount({
          linkedToId: question.linked_to_id ?? 0,
          questionId: question.id
        })).unwrap();
        setCalculationSuccess('رابطوں کی تعداد کامیابی سے حاصل ہو گئی');
      } else if (question.linked_to_type === 'activity') {
        // Fetch activity count based on activity_type
        result = await dispatch(fetchActivityCount({
          linkedToId: question.linked_to_id ?? 0,
          questionId: question.id
        })).unwrap();
        setCalculationSuccess('سرگرمیوں کی تعداد کامیابی سے حاصل ہو گئی');
      } else {
        setCalculationError('نامعلوم linked_to_type');
        setIsCalculating(false);
        return;
      }

      setInputValue(String(result));
      if (onValueChange) {
        onValueChange(result);
      }
      setTimeout(() => setCalculationSuccess(null), 3000);
    } catch (error: any) {
      setCalculationError('تعداد حاصل کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsCalculating(false);
    }
  }, [dispatch, question, onValueChange]);

  // Get button text based on aggregate function
  const buttonText = getCalculationButtonText(question.aggregate_func || null);

  // Get icon based on aggregate function
  const getButtonIcon = () => {
    switch (question.aggregate_func) {
      case 'sum':
        return 'add-circle-outline';
      case 'count':
        return 'list-outline';
      case 'avg':
        return 'analytics-outline';
      default:
        return 'calculator-outline';
    }
  };

  // Urdu labels for linked_to_type
  const linkedTypeUrdu: Record<string, string> = {
    activity: 'سرگرمی',
    contacts: 'رابطہ',
    strength: 'قوت',
  };

  // Get the Urdu label for linked_to_type if category is auto
  const typeLabel = question.category === 'auto' && question.linked_to_type
    ? linkedTypeUrdu[question.linked_to_type] || ''
    : '';

  // Right icon triggers handleFetchCount
  const rightIcon = (
    <TouchableOpacity
      style={[
        styles.rightButton,
        isCalculating && styles.rightButtonLoading,
        disabled && styles.rightButtonDisabled
      ]}
      onPress={handleFetchCount}
      disabled={disabled || isCalculating}
      activeOpacity={0.7}
    >
      {isCalculating ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons 
            name={getButtonIcon() as any}
            size={16} 
            color={COLORS.white} 
            style={styles.buttonIcon}
          />
          <UrduText style={styles.buttonText} numberOfLines={1}>
            {buttonText}
            {typeLabel ? ` (${typeLabel})` : ''}
          </UrduText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FormInput
        inputTitle={question.question_text}
        value={inputValue}
        onChange={() => {}} // No-op since this is read-only
        placeholder="حساب شدہ قدر"
        keyboardType="numeric"
        editable={false}
        disabled={disabled}
        loading={isCalculating}
        rightIcon={rightIcon}
      />

      {/* Error message */}
      {calculationError && (
        <View style={styles.messageContainer}>
          <UrduText style={styles.errorMessage}>{calculationError}</UrduText>
        </View>
      )}

      {/* Success message */}
      {calculationSuccess && (
        <View style={styles.messageContainer}>
          <UrduText style={styles.successMessage}>{calculationSuccess}</UrduText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  rightButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 80,
    maxWidth: 120,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    ...SHADOWS.small,
  },
  rightButtonLoading: {
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  rightButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageContainer: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  errorMessage: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'right',
  },
  successMessage: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'right',
  },
});

export default AutoQuestionInput; 