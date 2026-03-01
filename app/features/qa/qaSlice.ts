/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
import apiRequest, { directApiRequest } from '../../services/apiClient';
import { checkAndRefreshTokenIfNeeded, logout } from '../auth/authSlice';
import { calculateAverageSectionProgress } from './utils';
import { reduxLogger } from '../../utils/logger';
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
  submitError: null,
  batchFillStatus: 'idle',
  batchFillProgress: { current: 0, total: 0 },
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
 * Create an index of answers by question_id for O(1) lookup
 * This avoids the O(n²) complexity of nested loops in progress calculation
 */
const createAnswerIndexByQuestion = (
  answers: NormalizedEntities<ReportAnswer>,
  currentSubmissionId: number | null
): Map<number, ReportAnswer> => {
  const index = new Map<number, ReportAnswer>();

  if (!answers.byId || !currentSubmissionId) return index;

  Object.values(answers.byId).forEach(answer => {
    if (answer &&
        answer.submission_id === currentSubmissionId &&
        (answer.string_value !== null || answer.number_value !== null)) {
      index.set(answer.question_id, answer);
    }
  });

  return index;
};

/**
 * Calculate progress for a section (optimized with O(1) answer lookup)
 */
const calculateSectionProgress = (
  sectionId: number,
  questions: NormalizedEntities<ReportQuestion>,
  answers: NormalizedEntities<ReportAnswer>,
  currentSubmissionId: number | null
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

  // Create answer index for O(1) lookup (instead of O(n) for each question)
  const answerIndex = createAnswerIndexByQuestion(answers, currentSubmissionId);

  // Count answered questions using the index - now O(n) instead of O(n²)
  const answeredQuestions = sectionQuestions.filter(question => {
    return answerIndex.has(question.id);
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
        state.answers,
        state.currentSubmissionId
      );
    }
  });

  return progress;
};

/**
 * Update progress for a single section (optimized for saveAnswer)
 * Returns the full progress object with only the affected section recalculated
 */
const updateSingleSectionProgress = (
  state: QAState,
  questionId: number
): { [sectionId: number]: SectionProgress } => {
  // Find which section this question belongs to
  const question = state.questions.byId?.[questionId] ||
    Object.values(state.questions.byId || {}).find(q => q?.id === questionId);

  if (!question) {
    // Question not found, fall back to full recalculation
    return updateAllSectionsProgress(state);
  }

  const sectionId = question.section_id;
  if (sectionId == null) {
    return updateAllSectionsProgress(state);
  }

  // Copy existing progress and only recalculate the affected section
  const progress = { ...state.progress };
  progress[sectionId] = calculateSectionProgress(
    sectionId,
    state.questions,
    state.answers,
    state.currentSubmissionId
  );

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
  { template_id: number; unit_id: number; mgmt_id: number; submission_id?: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('qa/initializeReportData', async (params, { dispatch, rejectWithValue }) => {
  try {
    // reduxLogger.debug('[QA] initializeReportData thunk called with params:', params);
    
    // Validate required fields
    if (!params.template_id || !params.unit_id || !params.mgmt_id) {
      // reduxLogger.error('[QA] Missing required fields:', { template_id: params.template_id, unit_id: params.unit_id, mgmt_id: params.mgmt_id });
      return rejectWithValue('رپورٹ شروع کرنے کے لیے ضروری معلومات نہیں ملیں');
    }
    
    // First, check and refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      reduxLogger.error('Token refresh failed in initializeReportData:', refreshError);
      dispatch(logout());
      return rejectWithValue('آپ کا سیشن ختم ہو گیا ہے۔ دوبارہ لاگ ان کریں۔');
    }
    
    // Initialize submission variable
    let submission: ReportSubmission;
    
    // Step 1: If a specific submission_id was provided, fetch that submission directly
    if (params.submission_id) {
      try {
        const submissionResponse = await directApiRequest<{ data: ReportSubmission }>(
          `/items/reports_submissions/${params.submission_id}`,
          'GET'
        );
        
        if (submissionResponse?.data) {
          submission = submissionResponse.data;
        } else {
          reduxLogger.error(`رپورٹ نہیں مل سکی`);
          return rejectWithValue(`رپورٹ نہیں مل سکی`);
        }
      } catch (error) {
        reduxLogger.error(`Error fetching submission with ID ${params.submission_id}:`, error);
        return rejectWithValue(`رپورٹ حاصل نہیں ہو سکی`);
      }
    } else {
      // Step 1b: Check for existing submission if no specific ID was provided
      const filter = JSON.stringify({
        _and: [
          { template_id: { _eq: params.template_id } },
          { unit_id: { _eq: params.unit_id } },
          { mgmt_id: { _eq: params.mgmt_id } }
        ]
      });

      reduxLogger.debug('[QA] Searching for existing submission with filter:', filter);

      const existingSubmissionsResponse = await directApiRequest<{ data: ReportSubmission[] }>(
        `/items/reports_submissions?filter=${encodeURIComponent(filter)}`,
        'GET'
      );
      
      reduxLogger.debug('[QA] Found submissions:', existingSubmissionsResponse?.data?.map(s => ({
        id: s.id,
        template_id: s.template_id,
        unit_id: s.unit_id,
        mgmt_id: s.mgmt_id,
        status: s.status
      })));
      
      // Step 2: Use existing submission or reject if none exists
      if (existingSubmissionsResponse?.data && existingSubmissionsResponse.data.length > 0) {
        submission = existingSubmissionsResponse.data[0];
        reduxLogger.debug('[QA] Using existing submission:', {
          submissionId: submission.id,
          templateId: submission.template_id,
          unitId: submission.unit_id,
          mgmtId: submission.mgmt_id,
          status: submission.status
        });
      } else {
        reduxLogger.error('[QA] No existing submission found for the given parameters');
        return rejectWithValue('اس ٹیمپلیٹ کے لیے کوئی رپورٹ دستیاب نہیں');
      }
    }
    
    // Step 3: Fetch sections for the template
    // For published/submitted reports, include all sections (even archived) to show historical answers.
    // For draft reports, exclude archived sections.
    const isPublished = submission.status === 'published' || submission.status === 'submitted';
    const sectionsFilterObj: any = { template_id: { _eq: params.template_id } };
    const sectionsFilter = isPublished
      ? JSON.stringify(sectionsFilterObj)
      : JSON.stringify({ _and: [sectionsFilterObj, { status: { _neq: 'archived' } }] });
    const sectionsResponse = await directApiRequest<{ data: ReportSection[] }>(
      `/items/report_sections?filter=${encodeURIComponent(sectionsFilter)}&sort=sort`,
      'GET'
    );
    
    // Handle both response formats: direct array or {data: array}
    let sections: ReportSection[] = [];
    if (Array.isArray(sectionsResponse)) {
      sections = sectionsResponse;
    } else if (sectionsResponse?.data && Array.isArray(sectionsResponse.data)) {
      sections = sectionsResponse.data;
    } else {
      reduxLogger.error('Invalid response format for Report Sections:', sectionsResponse);
      return rejectWithValue('رپورٹ کے سیکشنز حاصل نہیں ہو سکے');
    }
    
    // Step 4: Fetch all questions for the template in a single batch
    const sectionIds = sections.map(section => section.id);
    
    if (sectionIds.length === 0) {
      reduxLogger.error('No sections found for template:', params.template_id);
      return rejectWithValue('اس رپورٹ میں کوئی سیکشن نہیں ملا');
    }
    
    // For published reports, include all questions (even archived) to show historical answers.
    // For draft reports, exclude archived questions.
    const questionsFilterObj: any = { section_id: { _in: sectionIds } };
    const questionsFilter = isPublished
      ? JSON.stringify(questionsFilterObj)
      : JSON.stringify({ _and: [questionsFilterObj, { status: { _neq: 'archived' } }] });
    const questionsResponse = await directApiRequest<{ data: ReportQuestion[] }>(
      `/items/report_questions?filter=${encodeURIComponent(questionsFilter)}&sort=sort&limit=-1`,
      'GET'
    );
    
    // Handle both response formats: direct array or {data: array}
    let questions: ReportQuestion[] = [];
    if (Array.isArray(questionsResponse)) {
      questions = questionsResponse;
    } else if (questionsResponse?.data && Array.isArray(questionsResponse.data)) {
      questions = questionsResponse.data;
    } else {
      reduxLogger.error('Invalid response format for Report Questions:', questionsResponse);
      return rejectWithValue('رپورٹ کے سوالات حاصل نہیں ہو سکے');
    }
    
    // Step 5: Fetch answers for the submission if it exists
    let answers: ReportAnswer[] = [];
    if (submission.id) {
      const answersFilter = JSON.stringify({ submission_id: { _eq: submission.id } });

      try {
        const answersResponse = await directApiRequest<{ data: ReportAnswer[] }>(
          `/items/report_answers?filter=${encodeURIComponent(answersFilter)}&limit=-1`,
          'GET'
        );
        
        // Handle both response formats: direct array or {data: array}
        if (Array.isArray(answersResponse)) {
          answers = answersResponse;
        } else if (answersResponse?.data && Array.isArray(answersResponse.data)) {
          answers = answersResponse.data;
        }
      } catch (error) {
        reduxLogger.error('Error fetching answers:', error);
        // Don't fail the entire operation if answers fetch fails
        answers = [];
      }
    }
    
    // Return all the fetched data
    const result = {
      submission,
      sections,
      questions,
      answers
    };
    
    reduxLogger.debug('[QA] initializeReportData thunk completed successfully:', {
      submissionId: submission.id,
      sectionsCount: sections.length,
      questionsCount: questions.length,
      answersCount: answers.length
    });
    
    return result;
  } catch (error: any) {
    reduxLogger.error('Error in initializeReportData:', error);
    return rejectWithValue(error.message || 'رپورٹ کی معلومات حاصل نہیں ہو سکیں');
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
    reduxLogger.debug('Saving answer:', answerData);
    
    // Validate question_id is provided
    if (!answerData.question_id) {
      return rejectWithValue('جواب محفوظ نہیں ہو سکا: سوال کی شناخت نہیں ملی');
    }
    
    // Check if at least one value is provided
    if (answerData.string_value === undefined && answerData.number_value === undefined) {
      return rejectWithValue('جواب محفوظ نہیں ہو سکا: کوئی جواب درج نہیں کیا گیا');
    }
    
    // First, check and refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      reduxLogger.error('Token refresh failed in saveAnswer:', refreshError);
      dispatch(logout());
      return rejectWithValue('آپ کا سیشن ختم ہو گیا ہے۔ دوبارہ لاگ ان کریں۔');
    }
    
    // Get the current state to check for existing submission ID
    const state = getState();
    const submissionId = answerData.submission_id || state.qa.currentSubmissionId;
    
    reduxLogger.debug('[QA] saveAnswer called with:', {
      answerData,
      currentSubmissionId: state.qa.currentSubmissionId,
      finalSubmissionId: submissionId
    });
    
    if (!submissionId) {
      reduxLogger.error('[QA] No submission ID available for saving answer');
      return rejectWithValue('رپورٹ ابھی تیار نہیں ہوئی۔ براہ کرم دوبارہ کوشش کریں۔');
    }
    
    // Update the answer data with the submission ID
    const updatedAnswerData = {
      ...answerData,
      submission_id: submissionId
    };
    
    reduxLogger.debug('Saving answer with submission ID:', submissionId);
    
    // Check if an answer for this question already exists
    // Build the filter as URL parameters for GET request
    const filterParams = new URLSearchParams();
    filterParams.append('filter[submission_id][_eq]', submissionId.toString());
    filterParams.append('filter[question_id][_eq]', answerData.question_id.toString());
    
    const filterUrl = `/items/report_answers?${filterParams.toString()}`;
    reduxLogger.debug('Checking for existing answers with URL:', filterUrl);
    
    let existingAnswer: ReportAnswer | null = null;
    
    try {
      const existingAnswersResponse = await directApiRequest<{ data: ReportAnswer[] }>(
        filterUrl,
        'GET'
      );
      
      // Extract data from response
      const existingAnswers = existingAnswersResponse?.data || [];
      reduxLogger.debug('Existing answers found:', existingAnswers.length, 'for question_id:', answerData.question_id);
      
      if (Array.isArray(existingAnswers) && existingAnswers.length > 0) {
        existingAnswer = existingAnswers[0];
        reduxLogger.debug('Found existing answer:', existingAnswer);
      } else {
        reduxLogger.debug('No existing answer found for question_id:', answerData.question_id);
      }
    } catch (filterError) {
      reduxLogger.error('Error checking for existing answers:', filterError);
      reduxLogger.debug('Proceeding with creating new answer due to filter error');
      // Continue with creating a new answer if the filter fails
    }
    
    // Determine if we need to create or update
    let method: 'POST' | 'PATCH' = 'POST';
    let path = '/items/report_answers';
    
    // If we found an existing answer, update it instead of creating a new one
    if (existingAnswer && existingAnswer.id) {
      // Validate that the existing answer belongs to the correct question
      if (existingAnswer.question_id !== answerData.question_id) {
        reduxLogger.error('Found existing answer with wrong question_id:', {
          existingAnswerQuestionId: existingAnswer.question_id,
          requestedQuestionId: answerData.question_id,
          existingAnswerId: existingAnswer.id
        });
        // If the question_id doesn't match, create a new answer instead
        reduxLogger.debug('Creating new answer due to question_id mismatch');
        method = 'POST';
      } else {
        method = 'PATCH';
        path = `/items/report_answers/${existingAnswer.id}`;
        reduxLogger.debug(`Updating existing answer with ID: ${existingAnswer.id} for question_id: ${answerData.question_id}`);
      }
    } else {
      reduxLogger.debug('Creating new answer');
    }
    
    // Make API request
    reduxLogger.debug(`Making ${method} request to: ${path}`);
    reduxLogger.debug('Request payload:', method === 'PATCH' 
      ? { string_value: updatedAnswerData.string_value, number_value: updatedAnswerData.number_value }
      : updatedAnswerData);
    
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
    
    reduxLogger.debug('Successfully saved answer:', data);
    reduxLogger.debug('Answer details - ID:', data.id, 'Question ID:', data.question_id, 'Submission ID:', data.submission_id);
    return data;
  } catch (error: any) {
    reduxLogger.error('Error saving answer:', error);
    
    // Check if it's an authentication error
    if (error.message?.includes('Authentication expired') || 
        error.message?.includes('Token expired') ||
        error.message?.includes('401')) {
      // Dispatch logout action if it's an auth error
      dispatch(logout());
    }
    
    return rejectWithValue(
      error.message || 'جواب محفوظ نہیں ہو سکا'
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
    reduxLogger.debug('Submitting report:', params);
    
    // First, check and refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      reduxLogger.error('Token refresh failed in submitReport:', refreshError);
      dispatch(logout());
      return rejectWithValue('آپ کا سیشن ختم ہو گیا ہے۔ دوبارہ لاگ ان کریں۔');
    }
    
    // Get the current state to check for existing submission ID
    const state = getState();
    const submissionId = params.submission_id || state.qa.currentSubmissionId;
    
    if (!submissionId) {
      return rejectWithValue('رپورٹ ابھی تیار نہیں ہوئی۔ براہ کرم دوبارہ کوشش کریں۔');
    }
    
    // Update the submission status to 'published'
    reduxLogger.debug(`Finalizing report submission with ID: ${submissionId}`);
    
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
    
    reduxLogger.debug('Successfully submitted report:', data);
    return data;
  } catch (error: any) {
    reduxLogger.error('Error submitting report:', error);
    
    // Check if it's an authentication error
    if (error.message?.includes('Authentication expired') || 
        error.message?.includes('Token expired') ||
        error.message?.includes('401')) {
      // Dispatch logout action if it's an auth error
      dispatch(logout());
    }
    
    return rejectWithValue(
      error.message || 'رپورٹ جمع نہیں ہو سکی'
    );
  }
});

/* ------------------------------------------------------------------ */
/* 3b. Batch auto-fill thunk                                          */
/* ------------------------------------------------------------------ */

export const batchAutoFillAnswers = createAsyncThunk<
  { filled: number; total: number; errors: string[] },
  { unitId: number; month: number; year: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('qa/batchAutoFillAnswers', async ({ unitId, month, year }, { getState, dispatch, rejectWithValue }) => {
  try {
    const { isAutoQuestion } = await import('./utils');
    const { fetchAutoValueForQuestion } = await import('./batchAutoFill');
    const { ensureFreshToken } = await import('../../services/apiClient');

    // Ensure fresh token before starting batch
    await ensureFreshToken();

    const state = getState();
    const questions = state.qa.questions;
    const submissionId = state.qa.currentSubmissionId;

    if (!submissionId) {
      return rejectWithValue('کوئی رپورٹ منتخب نہیں ہے');
    }

    // Get all auto-questions
    const autoQuestions = questions.allIds
      .map(id => questions.byId[id])
      .filter(q => isAutoQuestion(q));

    const total = autoQuestions.length;
    if (total === 0) {
      return { filled: 0, total: 0, errors: [] };
    }

    // Update progress: starting
    dispatch({ type: 'qa/setBatchFillProgress', payload: { current: 0, total } });

    // Pass contact types so the utility can distinguish rukun vs umeedwar/karkun
    const contactTypes = state.persons?.contactTypes || [];
    const context = { unitId, month, year, contactTypes };
    const errors: string[] = [];
    let filled = 0;

    // Process sequentially to avoid race conditions on saveAnswer
    for (let i = 0; i < autoQuestions.length; i++) {
      const question = autoQuestions[i];

      try {
        const result = await fetchAutoValueForQuestion(question, context, dispatch);

        if (result.success) {
          // Save the answer — string results (e.g. array) always go to string_value
          const isStringResult = typeof result.value === 'string';
          await dispatch(saveAnswer({
            submission_id: submissionId,
            question_id: question.id,
            string_value: isStringResult ? result.value as string : (question.input_type === 'number' ? null : String(result.value)),
            number_value: isStringResult ? null : (question.input_type === 'number' ? result.value as number : null),
          })).unwrap();
          filled++;
        } else if (result.error) {
          errors.push(`${question.question_text}: ${result.error}`);
        }
      } catch (err: any) {
        errors.push(`${question.question_text}: ${err.message || 'ناکام'}`);
      }

      // Update progress
      dispatch({ type: 'qa/setBatchFillProgress', payload: { current: i + 1, total } });
    }

    return { filled, total, errors };
  } catch (error: any) {
    return rejectWithValue(error.message || 'خودکار بھرنا ناکام ہو گیا');
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
    
    // Clear answers for fresh loading
    clearAnswers: (state) => {
      reduxLogger.debug('[QA] clearAnswers called - clearing currentSubmissionId');
      state.answers = initialAnswersState;
      state.currentSubmissionId = null;
      state.progress = {};
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
      state.batchFillStatus = 'idle';
      state.batchFillProgress = { current: 0, total: 0 };
    },
    
    // Update progress manually
    updateProgress: (state) => {
      state.progress = updateAllSectionsProgress(state);
    },

    // Batch fill progress (called from thunk)
    setBatchFillProgress: (state, action: PayloadAction<{ current: number; total: number }>) => {
      state.batchFillProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle initializeReportData
    builder
      .addCase(initializeReportData.pending, (state) => {
        state.status = 'loading';
        // Clear previous answers and submission ID to ensure we load fresh data for the new submission
        state.answers = initialAnswersState;
        state.currentSubmissionId = null;
        state.progress = {};
        reduxLogger.debug('[QA] initializeReportData.pending - cleared currentSubmissionId');
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
          
          reduxLogger.debug('[QA] Initialized with submission ID:', {
            submissionId: submission.id,
            answersCount: action.payload.answers.length,
            questionsCount: action.payload.questions.length,
            sectionsCount: action.payload.sections.length,
            currentSubmissionId: state.currentSubmissionId
          });
        } else {
          reduxLogger.error('[QA] Submission missing ID in fulfilled reducer');
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
        state.error = action.payload || 'رپورٹ کی معلومات حاصل نہیں ہو سکیں';
        reduxLogger.error('[QA] initializeReportData.rejected:', action.payload);
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
          
          // Update progress only for the affected section
          state.progress = updateSingleSectionProgress(state, answer.question_id);
        } catch (error) {
          reduxLogger.error('Error in saveAnswer.fulfilled reducer:', error);
        }
      })
      .addCase(saveAnswer.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.saveError = action.payload || 'جواب محفوظ نہیں ہو سکا';
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
        state.submitError = action.payload || 'رپورٹ جمع نہیں ہو سکی';
      })
      // Handle batchAutoFillAnswers
      .addCase(batchAutoFillAnswers.pending, (state) => {
        state.batchFillStatus = 'loading';
        state.batchFillProgress = { current: 0, total: 0 };
      })
      .addCase(batchAutoFillAnswers.fulfilled, (state) => {
        state.batchFillStatus = 'succeeded';
      })
      .addCase(batchAutoFillAnswers.rejected, (state) => {
        state.batchFillStatus = 'failed';
      });
  }
});

/* ------------------------------------------------------------------ */
/* 5. Actions and selectors                                           */
/* ------------------------------------------------------------------ */

// Export actions
export const { setCurrentSubmissionId, resetState, updateProgress, clearAnswers, setBatchFillProgress } = qaSlice.actions;

// Add a clearSubmissions function for logout
export const clearSubmissions = () => resetState();

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
export const selectBatchFillStatus = (state: RootState) => state.qa.batchFillStatus;
export const selectBatchFillProgress = (state: RootState) => state.qa.batchFillProgress;

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

export const selectAnswersBySubmissionId = createSelector(
  [selectAnswers, (_, submissionId: number) => submissionId],
  (answers, submissionId) => {
    if (!answers.allIds || !answers.byId) return [];
    return answers.allIds
      .map(id => answers.byId[id])
      .filter(answer => answer && answer.submission_id === submissionId);
  }
);

export const selectAnswersByQuestionIdAndSubmissionId = createSelector(
  [selectAnswers, (_, questionId: number, submissionId: number) => ({ questionId, submissionId })],
  (answers, { questionId, submissionId }) => {
    if (!answers.allIds || !answers.byId) return [];
    return answers.allIds
      .map(id => answers.byId[id])
      .filter(answer => answer && answer.question_id === questionId && answer.submission_id === submissionId);
  }
);

export const selectProgressBySection = createSelector(
  [selectProgress, (_, sectionId: number) => sectionId],
  (progress, sectionId) => {
    return progress[sectionId] || { totalQuestions: 0, answeredQuestions: 0, percentage: 0 };
  }
);

export const selectProgressBySectionAndSubmission = createSelector(
  [selectSections, selectQuestions, selectAnswers, selectCurrentSubmissionId, (_, sectionId: number) => sectionId],
  (sections, questions, answers, currentSubmissionId, sectionId) => {
    if (!currentSubmissionId) {
      return { totalQuestions: 0, answeredQuestions: 0, percentage: 0 };
    }
    
    return calculateSectionProgress(sectionId, questions, answers, currentSubmissionId);
  }
);

/**
 * Selector to get the overall progress percentage for a specific submission ID
 */
export const selectOverallProgressForSubmission = createSelector(
  [selectSections, selectQuestions, selectAnswers, (_, submissionId: number | null) => submissionId],
  (sections, questions, answers, submissionId) => {
    if (!submissionId || !sections.allIds || !sections.byId) {
      return 0;
    }
    
    // Calculate progress for each section based on the specific submission
    const progress: { [sectionId: number]: SectionProgress } = {};
    
    sections.allIds.forEach(sectionId => {
      if (sectionId !== undefined) {
        progress[sectionId] = calculateSectionProgress(
          sectionId,
          questions,
          answers,
          submissionId
        );
      }
    });
    
    return calculateAverageSectionProgress(progress);
  }
);

/**
 * Selector to get the overall progress percentage across all sections
 * Uses the calculateAverageSectionProgress utility function for calculation
 */
export const selectOverallProgress = createSelector(
  [selectSections, selectQuestions, selectAnswers, selectCurrentSubmissionId],
  (sections, questions, answers, currentSubmissionId) => {
    if (!currentSubmissionId || !sections.allIds || !sections.byId) {
      return 0;
    }
    
    // Calculate progress for each section based on current submission
    const progress: { [sectionId: number]: SectionProgress } = {};
    
    sections.allIds.forEach(sectionId => {
      if (sectionId !== undefined) {
        progress[sectionId] = calculateSectionProgress(
          sectionId,
          questions,
          answers,
          currentSubmissionId
        );
      }
    });
    
    return calculateAverageSectionProgress(progress);
  }
);

// Create a selector to transform sections into the expected format for SectionList
// This selector now filters by template_id and sorts by sort field, then by id
export const selectSectionsWithProgress = createSelector(
  [selectSections, selectQuestions, selectAnswers, selectCurrentSubmissionId, (_, templateId?: number) => templateId],
  (sections, questions, answers, currentSubmissionId, templateId) => {
    if (!sections.allIds || !sections.byId) return [];
    
    // Filter sections by template_id if provided
    let filteredSections = sections.allIds
      .map(id => sections.byId[id])
      .filter(section => section && (!templateId || section.template_id === templateId));
    
    // Sort sections by sort field first, then by id
    filteredSections.sort((a, b) => {
      // First sort by sort field (null values go to the end)
      const sortA = a.sort ?? Number.MAX_SAFE_INTEGER;
      const sortB = b.sort ?? Number.MAX_SAFE_INTEGER;
      
      if (sortA !== sortB) {
        return sortA - sortB;
      }
      
      // If sort values are equal, sort by id
      return a.id - b.id;
    });
    
    return filteredSections.map(section => {
      const sectionProgress = currentSubmissionId 
        ? calculateSectionProgress(section.id, questions, answers, currentSubmissionId)
        : { percentage: 0 };
      
      return {
        ...section,
        progress: sectionProgress.percentage
      };
    });
  }
);

// Create a selector to transform normalized questions into an array for SectionList
// This selector now sorts questions by sort field first, then by id
export const selectQuestionsArray = createSelector(
  [selectQuestions],
  (questions) => {
    if (!questions.allIds || !questions.byId) return [];
    
    // Get all questions and sort them
    const allQuestions = questions.allIds.map(id => questions.byId[id]);
    
    // Sort questions by sort field first, then by id
    allQuestions.sort((a, b) => {
      // First sort by sort field (null values go to the end)
      const sortA = a.sort ?? Number.MAX_SAFE_INTEGER;
      const sortB = b.sort ?? Number.MAX_SAFE_INTEGER;
      
      if (sortA !== sortB) {
        return sortA - sortB;
      }
      
      // If sort values are equal, sort by id
      return a.id - b.id;
    });
    
    return allQuestions;
  }
);

// Export reducer
export default qaSlice.reducer;