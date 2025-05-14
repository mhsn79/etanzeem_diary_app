import { 
  ReportSection, 
  ReportQuestion, 
  ReportAnswer, 
  ReportSubmission,
  NormalizedEntities,
  SectionProgress
} from './types';

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