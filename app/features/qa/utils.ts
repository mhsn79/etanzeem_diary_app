import { 
  ReportSection, 
  ReportQuestion, 
  ReportAnswer, 
  ReportSubmission,
  NormalizedEntities,
  SectionProgress
} from './types';
import { fetchActivityCount } from '../activities/activitySlice';
import { fetchPersonCount } from '../persons/personSlice';

/**
 * Normalize an array of entities into a normalized state structure
 */
export const normalizeEntities = <T extends { id: number }>(entities: T[]): NormalizedEntities<T> => {
  const byId: { [id: number]: T } = {};
  const allIds: number[] = [];

  entities.forEach(entity => {
    byId[entity.id] = entity;
    allIds.push(entity.id);
  });

  return { byId, allIds };
};

/**
 * Calculate section progress
 */
export const calculateSectionProgress = (
  sectionId: number,
  questions: ReportQuestion[],
  answers: ReportAnswer[]
) => {
  // Get all questions for this section
  const sectionQuestions = questions.filter(q => q.section_id === sectionId);
  
  // Count total questions
  const totalQuestions = sectionQuestions.length;
  
  // Count answered questions
  const answeredQuestions = sectionQuestions.filter(question => 
    answers.some(answer => 
      answer.question_id === question.id && 
      (answer.string_value !== null || answer.number_value !== null)
    )
  ).length;
  
  // Calculate percentage
  const percentage = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100) 
    : 0;
  
  return {
    totalQuestions,
    answeredQuestions,
    percentage
  };
};

/**
 * Calculate the average progress across all sections
 * 
 * @param progress - Object mapping section IDs to SectionProgress objects
 * @returns The average percentage across all sections, rounded to the nearest whole number
 */
export const calculateAverageSectionProgress = (
  progress: { [sectionId: number]: SectionProgress }
): number => {
  const sectionIds = Object.keys(progress).map(Number);
  
  // Handle edge case: no sections
  if (sectionIds.length === 0) return 0;
  
  // Calculate the sum of all section percentages
  const totalPercentage = sectionIds.reduce(
    (sum, sectionId) => sum + progress[sectionId].percentage,
    0
  );
  
  // Return the average, rounded to the nearest whole number
  return Math.round(totalPercentage / sectionIds.length);
};

/**
 * Get overall progress percentage
 */
export const calculateOverallProgress = (
  sections: ReportSection[],
  questions: ReportQuestion[],
  answers: ReportAnswer[]
) => {
  if (sections.length === 0) return 0;
  
  let totalPercentage = 0;
  
  sections.forEach(section => {
    const progress = calculateSectionProgress(section.id, questions, answers);
    totalPercentage += progress.percentage;
  });
  
  return Math.round(totalPercentage / sections.length);
};

/**
 * Find an answer for a specific question
 */
export const findAnswerForQuestion = (
  questionId: number,
  answers: ReportAnswer[]
): ReportAnswer | undefined => {
  return answers.find(answer => answer.question_id === questionId);
};

/**
 * Check if a question has been answered
 */
export const isQuestionAnswered = (
  questionId: number,
  answers: ReportAnswer[]
): boolean => {
  const answer = findAnswerForQuestion(questionId, answers);
  return !!answer && (answer.string_value !== null || answer.number_value !== null);
};

/**
 * Calculate auto value based on aggregate function and linked data
 */
export const calculateAutoValue = async (
  question: ReportQuestion,
  unitId: number,
  apiRequest: any,
  dispatch?: any
): Promise<number> => {
  try {
    console.log(`[AUTO_CALC] Calculating auto value for question ${question.id}:`, {
      aggregate_func: question.aggregate_func,
      linked_to_type: question.linked_to_type,
      linked_to_id: question.linked_to_id,
      unitId
    });

    // Handle count operations for different linked_to_type
    if (question.aggregate_func === 'count') {
      if (question.linked_to_type === 'contacts' && dispatch) {
        // Fetch person count based on contact_type
        const result = await dispatch(fetchPersonCount({
          linkedToId: question.linked_to_id ?? 0,
          questionId: question.id
        })).unwrap();
        return result;
      } else if (question.linked_to_type === 'activity' && dispatch) {
        // Fetch activity count based on activity_type
        const result = await dispatch(fetchActivityCount({
          linkedToId: question.linked_to_id ?? 0,
          questionId: question.id
        })).unwrap();
        return result;
      }
    }

    // Only handle sum/avg or fallback
    switch (question.aggregate_func) {
      case 'sum':
        return getStaticSumValue(question.linked_to_type || null, question.linked_to_id || null);
      case 'avg':
        return getStaticAvgValue(question.linked_to_type || null, question.linked_to_id || null);
      default:
        console.warn(`[AUTO_CALC] Unknown aggregate function: ${question.aggregate_func}`);
        return 0;
    }
  } catch (error) {
    console.error(`[AUTO_CALC] Error calculating auto value for question ${question.id}:`, error);
    return 0;
  }
};

/**
 * Get static sum value for testing purposes
 */
const getStaticSumValue = (linkedToType: string | null, linkedToId: number | null): number => {
  // Static values for testing - in production this would fetch from API
  const staticValues: Record<string, number> = {
    'strength': 150,
    'contacts': 85,
    'activities': 45,
    'reports': 23
  };
  
  return staticValues[linkedToType || 'strength'] || 100;
};

/**
 * Get static average value for testing purposes
 */
const getStaticAvgValue = (linkedToType: string | null, linkedToId: number | null): number => {
  // Static values for testing - in production this would fetch from API
  const staticValues: Record<string, number> = {
    'strength': 12.5,
    'contacts': 10.6,
    'activities': 7.5,
    'reports': 5.8
  };
  
  return staticValues[linkedToType || 'strength'] || 8.5;
};

/**
 * Check if a question is auto-calculated
 */
export const isAutoQuestion = (question: ReportQuestion): boolean => {
  const isAuto = question.category === 'auto' && question.aggregate_func !== null;
  console.log(`[AUTO_CHECK] Question ${question.id} auto check:`, {
    category: question.category,
    aggregate_func: question.aggregate_func,
    isAuto
  });
  return isAuto;
};

/**
 * Get calculation button text based on aggregate function
 */
export const getCalculationButtonText = (aggregateFunc: string | null): string => {
  switch (aggregateFunc) {
    case 'sum':
      return 'مجموعہ ';
    case 'count':
      return 'تعداد';
    case 'avg':
      return 'اوسط';
    default:
      return 'حساب کریں';
  }
};
// Default export to prevent Expo Router from treating this as a route
export default {
  normalizeEntities,
  calculateSectionProgress,
  calculateAverageSectionProgress,
  calculateOverallProgress,
  findAnswerForQuestion,
  isQuestionAnswered,
  calculateAutoValue,
  isAutoQuestion,
  getCalculationButtonText
};