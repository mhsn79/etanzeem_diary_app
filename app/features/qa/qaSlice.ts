/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { RootState, AppDispatch } from '../../store';
import apiRequest from '../../services/apiClient';
import { checkAndRefreshTokenIfNeeded } from '../auth/authSlice';
import {
  QAState,
  ReportSection,
  ReportQuestion,
  ReportAnswer,
  ReportSubmission,
  SectionProgress,
  NormalizedEntities,
  FetchSectionsParams,
  FetchQuestionsParams,
  FetchAnswersParams,
  SaveAnswerParams,
  CreateSubmissionParams
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
 * Handles both required and optional id properties
 */
const normalizeEntities = <T extends { id: number } | { id?: number }>(entities: T[]): NormalizedEntities<T> => {
  const byId: { [id: number]: T } = {};
  const allIds: number[] = [];

  entities.forEach(entity => {
    // Skip entities without an id
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
  // Get all questions for this section
  const sectionQuestions = Object.values(questions.byId).filter(
    q => q.section_id === sectionId
  );
  
  // Count total questions
  const totalQuestions = sectionQuestions.length;
  
  // Count answered questions
  const answeredQuestions = sectionQuestions.filter(question => 
    Object.values(answers.byId).some(answer => 
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
 * Update progress for all sections
 */
const updateAllSectionsProgress = (
  state: QAState
): { [sectionId: number]: SectionProgress } => {
  const progress: { [sectionId: number]: SectionProgress } = {};
  
  state.sections.allIds.forEach(sectionId => {
    progress[sectionId] = calculateSectionProgress(
      sectionId,
      state.questions,
      state.answers
    );
  });
  
  return progress;
};

/* ------------------------------------------------------------------ */
/* 3. Async thunks                                                    */
/* ------------------------------------------------------------------ */

/**
 * Fetch report sections by template ID
 */
export const fetchReportSections = createAsyncThunk<
  ReportSection[],
  FetchSectionsParams,
  { state: RootState; rejectValue: string }
>('qa/fetchReportSections', async (params, { rejectWithValue }) => {
  try {
    console.log('Fetching report sections for template ID:', params.template_id);
    
    // Validate template_id
    if (!params.template_id || isNaN(params.template_id)) {
      return rejectWithValue('Invalid template ID provided');
    }
    
    // Construct filter parameter
    const filter = JSON.stringify({ template_id: { _eq: params.template_id } });
    
    // Make API request
    const response = await apiRequest<ReportSection[] | { data: ReportSection[] }>(() => ({
      path: '/items/report_sections',
      method: 'GET',
      params: { filter, sort: 'sort' }
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: ReportSection[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Report Sections:', response);
      return rejectWithValue('Invalid response format for Report Sections');
    }
    
    console.log('Successfully fetched Report Sections:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Report Sections:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Report Sections'
    );
  }
});

/**
 * Fetch report questions by section ID
 */
export const fetchReportQuestions = createAsyncThunk<
  ReportQuestion[],
  FetchQuestionsParams,
  { state: RootState; rejectValue: string }
>('qa/fetchReportQuestions', async (params, { rejectWithValue }) => {
  try {
    console.log('Fetching report questions', params.section_id ? `for section ID: ${params.section_id}` : 'all questions');
    
    // Construct filter parameter if section_id is provided
    const params_obj: any = {};
    if (params.section_id) {
      params_obj.filter = JSON.stringify({ section_id: { _eq: params.section_id } });
    }
    
    // Add sorting
    params_obj.sort = 'sort';
    
    // Make API request
    const response = await apiRequest<ReportQuestion[] | { data: ReportQuestion[] }>(() => ({
      path: '/items/report_questions',
      method: 'GET',
      params: params_obj
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: ReportQuestion[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Report Questions:', response);
      return rejectWithValue('Invalid response format for Report Questions');
    }
    
    console.log('Successfully fetched Report Questions:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Report Questions:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Report Questions'
    );
  }
});

/**
 * Fetch report answers by submission ID and optionally question ID
 */
export const fetchReportAnswers = createAsyncThunk<
  ReportAnswer[],
  FetchAnswersParams,
  { state: RootState; rejectValue: string }
>('qa/fetchReportAnswers', async (params, { rejectWithValue }) => {
  try {
    console.log('Fetching report answers for submission ID:', params.submission_id);
    
    // Validate submission_id
    if (!params.submission_id) {
      return rejectWithValue('Invalid submission ID provided');
    }
    
    // Construct filter parameter
    let filter: any = { submission_id: { _eq: params.submission_id } };
    
    // Add question_id filter if provided
    if (params.question_id) {
      filter.question_id = { _eq: params.question_id };
    }
    
    // Make API request
    const response = await apiRequest<ReportAnswer[] | { data: ReportAnswer[] }>(() => ({
      path: '/items/report_answers',
      method: 'GET',
      params: { filter: JSON.stringify(filter) }
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: ReportAnswer[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Report Answers:', response);
      return rejectWithValue('Invalid response format for Report Answers');
    }
    
    console.log('Successfully fetched Report Answers:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Report Answers:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Report Answers'
    );
  }
});

/**
 * Fetch all report data sequentially (sections -> questions -> answers)
 */
export const fetchReportData = createAsyncThunk<
  void,
  { template_id: number; submission_id?: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('qa/fetchReportData', async (params, { dispatch, getState, rejectWithValue }) => {
  try {
    console.log('Fetching complete report data for template ID:', params.template_id);
    
    // First, check and refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());
    
    // Step 1: Fetch sections
    const sectionsResult = await dispatch(fetchReportSections({ template_id: params.template_id })).unwrap();
    console.log('Sections fetched:', sectionsResult.length);
    
    // Step 2: Fetch questions for each section
    for (const section of sectionsResult) {
      await dispatch(fetchReportQuestions({ section_id: section.id })).unwrap();
    }
    
    // Step 3: If submission_id is provided, fetch answers
    if (params.submission_id) {
      await dispatch(fetchReportAnswers({ submission_id: params.submission_id })).unwrap();
    } else {
      // If no submission_id, generate a new one
      const submissionId = uuidv4();
      dispatch(setCurrentSubmissionId(submissionId));
    }
    
    console.log('Successfully fetched all report data');
  } catch (error: any) {
    console.error('Error in fetchReportData:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch complete report data'
    );
  }
});

/**
 * Save a report answer
 */
export const saveAnswer = createAsyncThunk<
  ReportAnswer,
  SaveAnswerParams,
  { state: RootState; rejectValue: string }
>('qa/saveAnswer', async (answerData, { getState, rejectWithValue }) => {
  try {
    console.log('Saving answer:', answerData);
    
    // Validate required fields
    if (!answerData.submission_id || !answerData.question_id) {
      return rejectWithValue('Missing required fields for answer submission');
    }
    
    // Check if at least one value is provided
    if (answerData.string_value === undefined && answerData.number_value === undefined) {
      return rejectWithValue('Either string_value or number_value must be provided');
    }
    
    // Make API request
    const response = await apiRequest<ReportAnswer | { data: ReportAnswer }>(() => ({
      path: '/items/report_answers',
      method: 'POST',
      body: JSON.stringify(answerData),
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
    return rejectWithValue(
      error.message || 'Failed to save answer'
    );
  }
});

/**
 * Submit a report (create a report submission)
 */
export const submitReport = createAsyncThunk<
  ReportSubmission,
  CreateSubmissionParams,
  { state: RootState; rejectValue: string }
>('qa/submitReport', async (submissionData, { getState, rejectWithValue }) => {
  try {
    console.log('Submitting report:', submissionData);
    
    // Validate required fields
    if (!submissionData.unit_id || !submissionData.template_id || !submissionData.mgmt_id) {
      return rejectWithValue('Missing required fields for report submission');
    }
    
    // Set status to published if not provided
    const payload: CreateSubmissionParams = {
      ...submissionData,
      status: submissionData.status || 'published'
    };
    
    // Make API request
    const response = await apiRequest<ReportSubmission | { data: ReportSubmission }>(() => ({
      path: '/items/report_submissions',
      method: 'POST',
      body: JSON.stringify(payload),
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
    setCurrentSubmissionId: (state, action: PayloadAction<string>) => {
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
    // Handle fetchReportSections
    builder
      .addCase(fetchReportSections.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportSections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sections = normalizeEntities<ReportSection>(action.payload);
        // Initialize progress for each section
        action.payload.forEach(section => {
          state.progress[section.id] = {
            totalQuestions: 0,
            answeredQuestions: 0,
            percentage: 0
          };
        });
      })
      .addCase(fetchReportSections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch sections';
      })
      
      // Handle fetchReportQuestions
      .addCase(fetchReportQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Merge new questions with existing ones
        const newQuestions = normalizeEntities<ReportQuestion>(action.payload);
        
        // Update byId with new questions
        state.questions.byId = {
          ...state.questions.byId,
          ...newQuestions.byId
        };
        
        // Update allIds with unique IDs
        const uniqueIds = new Set([...state.questions.allIds, ...newQuestions.allIds]);
        state.questions.allIds = Array.from(uniqueIds);
        
        // Update progress
        state.progress = updateAllSectionsProgress(state);
      })
      .addCase(fetchReportQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch questions';
      })
      
      // Handle fetchReportAnswers
      .addCase(fetchReportAnswers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportAnswers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Filter out answers without IDs before normalizing
        const validAnswers = action.payload.filter(answer => answer.id !== undefined);
        
        // Explicitly type the normalized entities to ensure type safety
        const normalizedAnswers = normalizeEntities<ReportAnswer>(validAnswers);
        state.answers = normalizedAnswers;
        
        // Update progress
        state.progress = updateAllSectionsProgress(state);
      })
      .addCase(fetchReportAnswers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch answers';
      })
      
      // Handle saveAnswer
      .addCase(saveAnswer.pending, (state) => {
        state.saveStatus = 'loading';
      })
      .addCase(saveAnswer.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        
        // Add or update the answer in state
        const answer = action.payload;
        
        // Only process answers with valid IDs
        if (answer.id !== undefined) {
          state.answers.byId[answer.id] = answer;
          
          // Add to allIds if not already present
          if (!state.answers.allIds.includes(answer.id)) {
            state.answers.allIds.push(answer.id);
          }
        }
        
        // Update progress
        state.progress = updateAllSectionsProgress(state);
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
        state.submissions.byId[submission.id!] = submission;
        
        // Add to allIds if not already present
        if (!state.submissions.allIds.includes(submission.id!)) {
          state.submissions.allIds.push(submission.id!);
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
    return sections.allIds
      .map(id => sections.byId[id])
      .filter(section => section.template_id === templateId);
  }
);

export const selectQuestionsBySectionId = createSelector(
  [selectQuestions, (_, sectionId: number) => sectionId],
  (questions, sectionId) => {
    return questions.allIds
      .map(id => questions.byId[id])
      .filter(question => question.section_id === sectionId);
  }
);

export const selectAnswersByQuestionId = createSelector(
  [selectAnswers, (_, questionId: number) => questionId],
  (answers, questionId) => {
    return answers.allIds
      .map(id => answers.byId[id])
      .filter(answer => answer.question_id === questionId);
  }
);

export const selectProgressBySection = createSelector(
  [selectProgress, (_, sectionId: number) => sectionId],
  (progress, sectionId) => {
    return progress[sectionId] || { totalQuestions: 0, answeredQuestions: 0, percentage: 0 };
  }
);

export const selectOverallProgress = createSelector(
  [selectProgress],
  (progress) => {
    const sectionIds = Object.keys(progress).map(Number);
    if (sectionIds.length === 0) return 0;
    
    const totalPercentage = sectionIds.reduce(
      (sum, sectionId) => sum + progress[sectionId].percentage,
      0
    );
    
    return Math.round(totalPercentage / sectionIds.length);
  }
);

// Export reducer
export default qaSlice.reducer;