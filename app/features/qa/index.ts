// Export types
export * from './types';

// Export slice, actions, thunks, and selectors
export {
  default as qaReducer,
  
  // Actions
  setCurrentSubmissionId,
  resetState,
  updateProgress,
  
  // Thunks
  saveAnswer,
  submitReport,
  
  // Selectors
  selectQAState,
  selectSections,
  selectQuestions,
  selectAnswers,
  selectSubmissions,
  selectCurrentSubmissionId,
  selectProgress,
  selectStatus,
  selectError,
  selectSaveStatus,
  selectSaveError,
  selectSubmitStatus,
  selectSubmitError,
  selectSectionsByTemplateId,
  selectQuestionsBySectionId,
  selectAnswersByQuestionId,
  selectProgressBySection,
  selectOverallProgress
} from './qaSlice';

// Export utilities
export {
  normalizeEntities,
  calculateSectionProgress,
  calculateAverageSectionProgress,
  calculateOverallProgress,
  findAnswerForQuestion,
  isQuestionAnswered
} from './utils';

// Default export to satisfy Expo Router
export default {};