/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import apiRequest from '../../services/apiClient';
import { checkAndRefreshTokenIfNeeded, logout } from '../auth/authSlice';
import { calculateAverageSectionProgress } from './utils';
import {
  QAState,
  ReportSection,
  ReportQuestion,
  ReportAnswer,
  ReportSubmission,
  SectionProgress,
  NormalizedEntities,
  FetchReportDataParams,
  SaveAnswerParams,
  SubmitReportParams
} from './types';

/* ------------------------------------------------------------------ */
/* 1. Initial state                                                   */
/* ------------------------------------------------------------------ */

const initialSectionsState: NormalizedEntities<ReportSection> = {
  byId: {},
  allIds: []
};

const initialQuestionsState: NormalizedEntities<ReportQuestion> = {
  byId: {},
  allIds: []
};

const initialAnswersState: NormalizedEntities<ReportAnswer> = {
  byId: {},
  allIds: []
};

const initialSubmissionsState: NormalizedEntities<ReportSubmission> = {
  byId: {},
  allIds: []
};

const initialState: QAState = {
  sections: initialSectionsState,
  questions: initialQuestionsState,
  answers: initialAnswersState,
  submissions: initialSubmissionsState,
  currentSubmissionId: null,
  progress: {},
  status: 'idle',
  error: null,
  saveStatus: 'idle',
  saveError: null,
  submitStatus: 'idle',
  submitError: null
};

/* ------------------------------------------------------------------ */
/* 2. Helper functions                                                */
/* ------------------------------------------------------------------ */

/**
 * Normalize an array of entities into a normalized state structure
 */
const normalizeEntities = <T extends { id: number } | { id?: number }>(entities: T[]): NormalizedEntities<T> => {
  const byId: { [id: number]: T } = {};
  const allIds: number[] = [];

  entities.forEach(entity => {
    if ('id' in entity && entity.id !== undefined) {
      byId[entity.id] = entity;
      allIds.push(entity.id);
    }
  });

  return { byId, allIds };
};

/**
 * Calculate progress for a section
 */
const calculateSectionProgress = (
  sectionId: number,
  questions: NormalizedEntities<ReportQuestion>,
  answers: NormalizedEntities<ReportAnswer>
): SectionProgress => {
  if (!questions.byId) {
    return { totalQuestions: 0, answeredQuestions: 0, percentage: 0 };
  }
  
  // Get all questions for this section
  const sectionQuestions = Object.values(questions.byId).filter(
    q => q && q.section_id === sectionId
  );
  
  // Count total questions
  const totalQuestions = sectionQuestions.length;
  
  // Count answered questions
  const answeredQuestions = sectionQuestions.filter(question => {
    if (!answers.byId) return false;
    
    return Object.values(answers.byId).some(answer => 
      answer && 
      answer.question_id === question.id && 
      (answer.string_value !== null || answer.number_value !== null)
    );
  }).length;
  
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
 * Update progress for all sections
 */
const updateAllSectionsProgress = (
  state: QAState
): { [sectionId: number]: SectionProgress } => {
  const progress: { [sectionId: number]: SectionProgress } = {};
  
  const sectionIds = Array.isArray(state.sections.allIds) ? state.sections.allIds : [];
  
  sectionIds.forEach(sectionId => {
    if (sectionId !== undefined) {
      progress[sectionId] = calculateSectionProgress(
        sectionId,
        state.questions,
        state.answers
      );
    }
  });
  
  return progress;
};

/* ------------------------------------------------------------------ */
/* 3. Async thunks                                                    */
/* ------------------------------------------------------------------ */

/**
 * Consolidated thunk to fetch or create a report submission and load all related data
 * This replaces the separate fetchReportData and createInitialSubmission thunks
 */
export const initializeReportData = createAsyncThunk<
  { submission: ReportSubmission; sections: ReportSection[]; questions: ReportQuestion[]; answers: ReportAnswer[] },
  FetchReportDataParams,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('qa/initializeReportData', async (params, { dispatch, rejectWithValue }) => {
  try {
    console.log('Initializing report data with params:', params);
    
    // Validate required fields
    if (!params.template_id || !params.unit_id || !params.mgmt_id) {
      return rejectWithValue('Missing required fields for report initialization');
    }
    
    // First, check and refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      console.error('Token refresh failed in initializeReportData:', refreshError);
      dispatch(logout());
      return rejectWithValue('Authentication expired. Please log in again.');
    }
    
    // Step 1: Check for existing draft submission
    const filter = {
      _and: [
        { template_id: { _eq: params.template_id } },
        { unit_id: { _eq: params.unit_id } },
        { mgmt_id: { _eq: params.mgmt_id } },
        { status: { _eq: 'draft' } }
      ]
    };
    
    console.log('Checking for existing draft submission');
    const existingSubmissionsResponse = await apiRequest<ReportSubmission[]>(() => ({
      path: '/items/reports_submissions',
      method: 'GET',
      params: { filter },
    }));
    console.log('Existing submissions response:', existingSubmissionsResponse);
    
    // Initialize submission variable
    let submission: ReportSubmission;
    
    // Step 2: Use existing submission or create a new one
    if (existingSubmissionsResponse?.length > 0) {
      submission = existingSubmissionsResponse[0];
      console.log('Found existing draft submission:', submission);
    } else {
      console.log('No existing draft submission found. Creating new one.');
      const submissionData = {
        template_id: params.template_id,
        unit_id: params.unit_id,
        mgmt_id: params.mgmt_id,
        status: 'draft',
      };
      
      submission = await apiRequest<ReportSubmission>(() => ({
        path: '/items/reports_submissions',
        method: 'POST',
        body: JSON.stringify(submissionData),
        headers: { 'Content-Type': 'application/json' },
      }));
      
      if (!submission.id) {
        console.error('New submission created but missing ID:', submission);
        return rejectWithValue('Created submission is missing an ID');
      }
      
      console.log('Created new draft submission:', submission);
    }
    
    // Step 3: Fetch sections for the template
    console.log('Fetching sections for template ID:', params.template_id);
    const sectionsFilter = { template_id: { _eq: params.template_id } };
    const sectionsResponse = await apiRequest<ReportSection[] | { data: ReportSection[] }>(() => ({
      path: '/items/report_sections',
      method: 'GET',
      params: { filter: sectionsFilter, sort: 'sort' }
    }));
    console.log('Successfully fetched Report Sections:',sectionsResponse);
    
    // Handle both response formats: direct array or {data: array}
    let sections: ReportSection[];
    if (Array.isArray(sectionsResponse)) {
      sections = sectionsResponse;
    } else if (sectionsResponse && 'data' in sectionsResponse && Array.isArray(sectionsResponse.data)) {
      sections = sectionsResponse.data;
    } else {
      console.error('Invalid response format for Report Sections:', sectionsResponse);
      return rejectWithValue('Invalid response format for Report Sections');
    }
    
    console.log('Successfully fetched Report Sections:', sections.length);
    
    // Step 4: Fetch all questions for the template in a single batch
    console.log('Fetching all questions for template sections');
    const sectionIds = sections.map(section => section.id);
    
    if (sectionIds.length === 0) {
      return rejectWithValue('No sections found for this template');
    }
    
    const questionsFilter = { section_id: { _in: sectionIds } };
    const questionsResponse = await apiRequest<ReportQuestion[] | { data: ReportQuestion[] }>(() => ({
      path: '/items/report_questions',
      method: 'GET',
      params: { filter: questionsFilter, sort: 'sort' }
    }));
    console.log('quest ionsResponse --------------------->>>>',questionsResponse);
    
    // Handle both response formats: direct array or {data: array}
    let questions: ReportQuestion[];
    if (Array.isArray(questionsResponse)) {
      questions = questionsResponse;
    } else if (questionsResponse && 'data' in questionsResponse && Array.isArray(questionsResponse.data)) {
      questions = questionsResponse.data;
    } else {
      console.error('Invalid response format for Report Questions:', questionsResponse);
      return rejectWithValue('Invalid response format for Report Questions');
    }
    
    console.log('Successfully fetched Report Questions:', questions.length);
    
    // Step 5: Fetch answers for the submission if it exists
    let answers: ReportAnswer[] = [];
    if (submission.id) {
      console.log('Fetching answers for submission ID:', submission.id);
      const answersFilter = { submission_id: { _eq: submission.id } };
      
      try {
        const answersResponse = await apiRequest<ReportAnswer[] | { data: ReportAnswer[] }>(() => ({
          path: '/items/report_answers',
          method: 'GET',
          params: { filter: answersFilter }
        }));
        console.log('Fetched answers for submission:', answersResponse);
        
        // Handle both response formats: direct array or {data: array}
        if (Array.isArray(answersResponse)) {
          answers = answersResponse;
        } else if (answersResponse && 'data' in answersResponse && Array.isArray(answersResponse.data)) {
          answers = answersResponse.data;
        } else {
          console.error('Invalid response format for Report Answers:', answersResponse);
          // Don't reject, just log error and continue with empty answers
          answers = [];
        }
        
        console.log('Successfully fetched Report Answers:', answers.length);
      } catch (error) {
        console.error('Error fetching answers:', error);
        // Don't reject, just log error and continue with empty answers
        answers = [];
      }
    }
    
    return {
      submission,
      sections,
      questions,
      answers
    };
  } catch (error: any) {
    console.error('Error in initializeReportData:', error);
    
    // Check if it's an authentication error
    if (error.message?.includes('Authentication expired') || 
        error.message?.includes('Token expired') ||
        error.message?.includes('401')) {
      // Dispatch logout action if it's an auth error
      dispatch(logout());
    }
    
    return rejectWithValue(
      error.message || 'Failed to initialize report data'
    );
  }
});

/**
 * Save a report answer
 */
export const saveAnswer = createAsyncThunk<
  ReportAnswer,
  SaveAnswerParams,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('qa/saveAnswer', async (answerData, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Saving answer:', answerData);
    
    // Validate question_id is provided
    if (!answerData.question_id) {
      return rejectWithValue('Missing question_id for answer submission');
    }
    
    // Check if at least one value is provided
    if (answerData.string_value === undefined && answerData.number_value === undefined) {
      return rejectWithValue('Either string_value or number_value must be provided');
    }
    
    // First, check and refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      console.error('Token refresh failed in saveAnswer:', refreshError);
      dispatch(logout());
      return rejectWithValue('Authentication expired. Please log in again.');
    }
    
    // Get the current state to check for existing submission ID
    const state = getState();
    const submissionId = answerData.submission_id || state.qa.currentSubmissionId;
    
    if (!submissionId) {
      return rejectWithValue('No submission ID available. Please initialize the report first.');
    }
    
    // Update the answer data with the submission ID
    const updatedAnswerData = {
      ...answerData,
      submission_id: submissionId
    };
    
    console.log('Saving answer with submission ID:', submissionId);
    
    // Check if an answer for this question already exists
    const filter = {
      _and: [
        { submission_id: { _eq: submissionId } },
        { question_id: { _eq: answerData.question_id } }
      ]
    };
    
    const existingAnswers = await apiRequest<ReportAnswer[]>(() => ({
      path: '/items/report_answers',
      method: 'GET',
      params: { filter }
    }));
    
    let existingAnswer: ReportAnswer | null = null;
    if (Array.isArray(existingAnswers) && existingAnswers.length > 0) {
      existingAnswer = existingAnswers[0];
      console.log('Found existing answer:', existingAnswer);
    }
    
    // Determine if we need to create or update
    let method: 'POST' | 'PATCH' = 'POST';
    let path = '/items/report_answers';
    
    // If we found an existing answer, update it instead of creating a new one
    if (existingAnswer && existingAnswer.id) {
      method = 'PATCH';
      path = `/items/report_answers/${existingAnswer.id}`;
      console.log(`Updating existing answer with ID: ${existingAnswer.id}`);
    } else {
      console.log('Creating new answer');
    }
    
    // Make API request
    const response = await apiRequest<ReportAnswer | { data: ReportAnswer }>(() => ({
      path,
      method,
      body: JSON.stringify(method === 'PATCH' 
        ? { string_value: updatedAnswerData.string_value, number_value: updatedAnswerData.number_value }
        : updatedAnswerData),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    // Handle both response formats: direct object or {data: object}
    let data: ReportAnswer;
    if (response && 'data' in response && typeof response.data === 'object') {
      data = response.data as ReportAnswer;
    } else {
      data = response as ReportAnswer;
    }
    
    console.log('Successfully saved answer:', data);
    return data;
  } catch (error: any) {
    console.error('Error saving answer:', error);
    
    // Check if it's an authentication error
    if (error.message?.includes('Authentication expired') || 
        error.message?.includes('Token expired') ||
        error.message?.includes('401')) {
      // Dispatch logout action if it's an auth error
      dispatch(logout());
    }
    
    return rejectWithValue(
      error.message || 'Failed to save answer'
    );
  }
});

/**
 * Submit a report (finalize a report submission)
 */
export const submitReport = createAsyncThunk<
  ReportSubmission,
  SubmitReportParams,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('qa/submitReport', async (params, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Submitting report:', params);
    
    // First, check and refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      console.error('Token refresh failed in submitReport:', refreshError);
      dispatch(logout());
      return rejectWithValue('Authentication expired. Please log in again.');
    }
    
    // Get the current state to check for existing submission ID
    const state = getState();
    const submissionId = params.submission_id || state.qa.currentSubmissionId;
    
    if (!submissionId) {
      return rejectWithValue('No submission ID available. Please initialize the report first.');
    }
    
    // Update the submission status to 'published'
    console.log(`Finalizing report submission with ID: ${submissionId}`);
    
    const response = await apiRequest<ReportSubmission | { data: ReportSubmission }>(() => ({
      path: `/items/reports_submissions/${submissionId}`,
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    // Handle both response formats: direct object or {data: object}
    let data: ReportSubmission;
    if (response && 'data' in response && typeof response.data === 'object') {
      data = response.data as ReportSubmission;
    } else {
      data = response as ReportSubmission;
    }
    
    console.log('Successfully submitted report:', data);
    return data;
  } catch (error: any) {
    console.error('Error submitting report:', error);
    
    // Check if it's an authentication error
    if (error.message?.includes('Authentication expired') || 
        error.message?.includes('Token expired') ||
        error.message?.includes('401')) {
      // Dispatch logout action if it's an auth error
      dispatch(logout());
    }
    
    return rejectWithValue(
      error.message || 'Failed to submit report'
    );
  }
});

/* ------------------------------------------------------------------ */
/* 4. Slice                                                           */
/* ------------------------------------------------------------------ */

const qaSlice = createSlice({
  name: 'qa',
  initialState,
  reducers: {
    // Set current submission ID
    setCurrentSubmissionId: (state, action: PayloadAction<number | null>) => {
      state.currentSubmissionId = action.payload;
    },
    
    // Reset state
    resetState: (state) => {
      state.sections = initialSectionsState;
      state.questions = initialQuestionsState;
      state.answers = initialAnswersState;
      state.submissions = initialSubmissionsState;
      state.currentSubmissionId = null;
      state.progress = {};
      state.status = 'idle';
      state.error = null;
      state.saveStatus = 'idle';
      state.saveError = null;
      state.submitStatus = 'idle';
      state.submitError = null;
    },
    
    // Update progress manually
    updateProgress: (state) => {
      state.progress = updateAllSectionsProgress(state);
    }
  },
  extraReducers: (builder) => {
    // Handle initializeReportData
    builder
      .addCase(initializeReportData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(initializeReportData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Store the submission
        const submission = action.payload.submission;
        if (submission.id) {
          state.submissions.byId[submission.id] = submission;
          if (!state.submissions.allIds.includes(submission.id)) {
            state.submissions.allIds.push(submission.id);
          }
          state.currentSubmissionId = submission.id;
        }
        
        // Store the sections
        state.sections = normalizeEntities<ReportSection>(action.payload.sections);
        
        // Store the questions
        state.questions = normalizeEntities<ReportQuestion>(action.payload.questions);
        
        // Store the answers
        state.answers = normalizeEntities<ReportAnswer>(action.payload.answers);
        
        // Update progress
        state.progress = updateAllSectionsProgress(state);
      })
      .addCase(initializeReportData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to initialize report data';
      })
      
      // Handle saveAnswer
      .addCase(saveAnswer.pending, (state) => {
        state.saveStatus = 'loading';
      })
      .addCase(saveAnswer.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        
        try {
          // Add or update the answer in state
          const answer = action.payload;
          
          // Only process answers with valid IDs
          if (answer.id !== undefined) {
            // Create a new byId object
            const newByIdObject = { 
              ...state.answers.byId,
              [answer.id]: answer
            };
            
            // Add to allIds if not already present
            const existingIds = Array.isArray(state.answers.allIds) ? state.answers.allIds : [];
            let newAllIds = existingIds;
            
            if (!existingIds.includes(answer.id)) {
              newAllIds = [...existingIds, answer.id];
            }
            
            // Update the state with the new objects
            state.answers = {
              byId: newByIdObject,
              allIds: newAllIds
            };
          }
          
          // Update progress
          state.progress = updateAllSectionsProgress(state);
        } catch (error) {
          console.error('Error in saveAnswer.fulfilled reducer:', error);
        }
      })
      .addCase(saveAnswer.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.saveError = action.payload || 'Failed to save answer';
      })
      
      // Handle submitReport
      .addCase(submitReport.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(submitReport.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        
        // Add the submission to state
        const submission = action.payload;
        if (submission.id) {
          state.submissions.byId[submission.id] = submission;
          
          // Add to allIds if not already present
          if (!state.submissions.allIds.includes(submission.id)) {
            state.submissions.allIds.push(submission.id);
          }
        }
        
        // Clear current submission ID as it's now finalized
        state.currentSubmissionId = null;
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.payload || 'Failed to submit report';
      });
  }
});

/* ------------------------------------------------------------------ */
/* 5. Actions and selectors                                           */
/* ------------------------------------------------------------------ */

// Export actions
export const { setCurrentSubmissionId, resetState, updateProgress } = qaSlice.actions;

// Basic selectors
export const selectQAState = (state: RootState) => state.qa;
export const selectSections = (state: RootState) => state.qa.sections;
export const selectQuestions = (state: RootState) => state.qa.questions;
export const selectAnswers = (state: RootState) => state.qa.answers;
export const selectSubmissions = (state: RootState) => state.qa.submissions;
export const selectCurrentSubmissionId = (state: RootState) => state.qa.currentSubmissionId;
export const selectProgress = (state: RootState) => state.qa.progress;
export const selectStatus = (state: RootState) => state.qa.status;
export const selectError = (state: RootState) => state.qa.error;
export const selectSaveStatus = (state: RootState) => state.qa.saveStatus;
export const selectSaveError = (state: RootState) => state.qa.saveError;
export const selectSubmitStatus = (state: RootState) => state.qa.submitStatus;
export const selectSubmitError = (state: RootState) => state.qa.submitError;

// Memoized selectors
export const selectSectionsByTemplateId = createSelector(
  [selectSections, (_, templateId: number) => templateId],
  (sections, templateId) => {
    if (!sections.allIds || !sections.byId) return [];
    return sections.allIds
      .map(id => sections.byId[id])
      .filter(section => section && section.template_id === templateId);
  }
);

export const selectQuestionsBySectionId = createSelector(
  [selectQuestions, (_, sectionId: number) => sectionId],
  (questions, sectionId) => {
    if (!questions.allIds || !questions.byId) return [];
    return questions.allIds
      .map(id => questions.byId[id])
      .filter(question => question && question.section_id === sectionId);
  }
);

export const selectAnswersByQuestionId = createSelector(
  [selectAnswers, (_, questionId: number) => questionId],
  (answers, questionId) => {
    if (!answers.allIds || !answers.byId) return [];
    return answers.allIds
      .map(id => answers.byId[id])
      .filter(answer => answer && answer.question_id === questionId);
  }
);

export const selectProgressBySection = createSelector(
  [selectProgress, (_, sectionId: number) => sectionId],
  (progress, sectionId) => {
    return progress[sectionId] || { totalQuestions: 0, answeredQuestions: 0, percentage: 0 };
  }
);

/**
 * Selector to get the overall progress percentage across all sections
 * Uses the calculateAverageSectionProgress utility function for calculation
 */
export const selectOverallProgress = createSelector(
  [selectProgress],
  (progress) => calculateAverageSectionProgress(progress)
);

// Create a selector to transform sections into the expected format for SectionList
export const selectSectionsWithProgress = createSelector(
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
export const selectQuestionsArray = createSelector(
  [selectQuestions],
  (questions) => {
    if (!questions.allIds || !questions.byId) return [];
    
    return questions.allIds.map(id => questions.byId[id]);
  }
);

// Export reducer
export default qaSlice.reducer;