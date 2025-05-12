/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
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
  // Handle case where questions.byId might be undefined
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
    // Handle case where answers.byId might be undefined
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
  
  // Handle case where sections.allIds might be undefined
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
    const filter ={ template_id: { _eq: params.template_id } };
    
    // Make API request
    const response = await apiRequest<ReportSection[] | { data: ReportSection[] }>(() => ({
      path: '/items/report_sections',
      method: 'GET',
      params: { filter, sort: 'sort' }
    }));
    console.log('API response of section:', response);
    
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
      params_obj.filter = { section_id: { _eq: params.section_id } };
    }
    
    // Add sorting
    params_obj.sort = 'sort';
    
    // Make API request
    const response = await apiRequest<ReportQuestion[] | { data: ReportQuestion[] }>(() => ({
      path: '/items/report_questions',
      method: 'GET',
      params: params_obj
    }));
    console.log('API response of question:', response);
    
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
    
    // Construct filter parameter with proper type
    const filter: { submission_id: { _eq: number }; question_id?: { _eq: number } } = { 
      submission_id: { _eq: params.submission_id } 
    };
    
    // Add question_id filter if provided
    if (params.question_id) {
      filter.question_id = { _eq: params.question_id };
    }
    
    // Make API request with proper filter
    const response = await apiRequest<ReportAnswer[] | { data: ReportAnswer[] }>(() => ({
      path: '/items/report_answers',
      method: 'GET',
      params: { filter }
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
/**
 * Create a new report submission when first visiting the Create Report Screen
 */
export const createInitialSubmission = createAsyncThunk<
  ReportSubmission,
  { template_id: number; unit_id: number; mgmt_id: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('qa/createInitialSubmission', async (params, { dispatch, rejectWithValue }) => {
  try {
    console.log('99999-------------------------------------------------------------------', 
      params.template_id, params.unit_id, params.mgmt_id);
    
    // Validate required fields
    if (!params.unit_id || !params.template_id || !params.mgmt_id) {
      return rejectWithValue('Missing required fields for initial report submission');
    }
    

  
    
    // Create submission payload with explicit ID and draft status
    const submissionData = {
    
      template_id: params.template_id,
      unit_id: params.unit_id,
      mgmt_id: params.mgmt_id,
      status: 'draft' 
    };
    console.log('submissionData:_____________________________>>>>>>>>', submissionData);
    
    // Make API request to create the submission
    const response = await apiRequest<ReportSubmission | { data: ReportSubmission }>(() => ({
      path: '/items/report_submissions',
      method: 'POST',
      body: JSON.stringify(submissionData),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    console.log();
    
    // Handle both response formats: direct object or {data: object}
    let data: ReportSubmission;
    if (response && 'data' in response && typeof response.data === 'object') {
      data = response.data as ReportSubmission;
    } else {
      data = response as ReportSubmission;
    }
    
    console.log('Successfully created initial report submission:', data);
    
    // Set the current submission ID
    dispatch(setCurrentSubmissionId(data.id || null));
    
    return data;
  } catch (error: any) {
    console.error('Error creating initial report submission:', JSON.stringify(error, null, 2));
    return rejectWithValue(
      error.message || 'Failed to create initial report submission'
    );
  }
});

export const fetchReportData = createAsyncThunk<
  void,
  { template_id: number; submission_id?: number; unit_id?: number; mgmt_id?: number },
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
      try {
        await dispatch(fetchReportQuestions({ section_id: section.id })).unwrap();
      } catch (error: any) {
        console.error(`Error fetching questions for section ${section.id}:`, error);
        // Continue with other sections instead of failing the whole process
      }
    }
    
    // Step 3: Handle submission ID
    let currentSubmissionId = params.submission_id;
    
    // Check if we already have a submission ID in state
    if (!currentSubmissionId) {
      const state = getState();
      // Convert null to undefined to satisfy TypeScript
      currentSubmissionId = state.qa.currentSubmissionId || undefined;
    }
    
    // If we have a submission ID (either from params or state), fetch answers
    if (currentSubmissionId !== undefined) {
      console.log('Using existing submission ID:', currentSubmissionId);
      try {
        // No need for explicit cast since we've already ensured it's a number
        await dispatch(fetchReportAnswers({ submission_id: currentSubmissionId })).unwrap();
      } catch (error: any) {
        console.error('Error fetching answers for submission:', error);
        // Continue anyway, as we might be creating a new submission
      }
    } 
    // If no submission ID but we have unit_id and mgmt_id, create a new submission
    else if (params.unit_id && params.mgmt_id) {
      console.log('Creating new submission with template_id:', params.template_id, 'unit_id:', params.unit_id, 'mgmt_id:', params.mgmt_id);
      try {
        const submission = await dispatch(createInitialSubmission({
          template_id: params.template_id,
          unit_id: params.unit_id,
          mgmt_id: params.mgmt_id
        })).unwrap();
        
        // Set the current submission ID
        if (submission.id) {
          console.log('Created new submission with ID:', submission.id);
          dispatch(setCurrentSubmissionId(submission.id));
          
          // Try to fetch any existing answers for this submission
          try {
            await dispatch(fetchReportAnswers({ submission_id: submission.id })).unwrap();
          } catch (error) {
            console.error('No existing answers found for new submission:', error);
            // This is expected for a new submission, so we can continue
          }
        } else {
          console.error('Created submission has no ID');
          dispatch(setCurrentSubmissionId(null));
        }
      } catch (error: any) {
        console.error('Failed to create initial submission:', error);
        // Fallback to generating a temporary ID
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const submissionId = parseInt(`${timestamp}${random}`.slice(0, 9));
        console.log('Generated fallback submission ID:', submissionId);
        
        dispatch(setCurrentSubmissionId(submissionId));
      }
    } 
    // If we have no submission ID and no unit/mgmt info, log a warning
    // We'll create a submission when the first answer is saved
    else {
      console.log('Initializing form submission ID null');
      console.log('No submission ID or unit/mgmt info provided. A submission will be created when the first answer is saved.');
      
      // Clear any existing submission ID
      dispatch(setCurrentSubmissionId(null));
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
    
    // Get the current state to check for existing submission ID
    const state = getState();
    let submissionId = answerData.submission_id || state.qa.currentSubmissionId;
    
    // If no submission_id exists, create a new submission
    if (!submissionId) {
      console.log('Initializing form submission ID null');
      try {
        // Get template_id, unit_id, and mgmt_id from state if available
        // These should be available from previous API calls or user input
        const templateId = state.qa.sections.allIds.length > 0 
          ? state.qa.sections.byId[state.qa.sections.allIds[0]].template_id 
          : null;
          
        // If we don't have template_id, we can't create a submission
        if (!templateId) {
          return rejectWithValue('Cannot create submission: missing template_id');
        }
        
        // For unit_id and mgmt_id, we'll need to get them from somewhere
        // This could be from user input, app state, or another source
        // For now, we'll use placeholder values that should be replaced with actual values
        const unitId = 5; // Replace with actual unit_id from your app state
        const mgmtId = 4; // Replace with actual mgmt_id from your app state
        
        console.log('Creating new submission with template_id:', templateId, 'unit_id:', unitId, 'mgmt_id:', mgmtId);
        
        const submission = await dispatch(createInitialSubmission({
          template_id: templateId,
          unit_id: unitId,
          mgmt_id: mgmtId
        })).unwrap();
        
        // Use the new submission ID
        submissionId = submission.id || null;
        console.log('Created new submission with ID:', submissionId);
      } catch (error: any) {
        console.error('Failed to create initial submission:', error);
        // Generate a temporary ID as fallback
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        submissionId = parseInt(`${timestamp}${random}`.slice(0, 9));
        console.log('Generated fallback submission ID:', submissionId);
        
        // Set this as the current submission ID
        dispatch(setCurrentSubmissionId(submissionId));
      }
    }
    
    // Now we have a valid submission ID, update the answer data
    const updatedAnswerData = {
      ...answerData,
      submission_id: submissionId
    };
    
    console.log('Saving answer with submission ID:', submissionId);
    
    // Make API request
    const response = await apiRequest<ReportAnswer | { data: ReportAnswer }>(() => ({
      path: '/items/report_answers',
      method: 'POST',
      body: JSON.stringify(updatedAnswerData),
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
    
    // If this is the first answer for a new submission, fetch all existing answers
    // This ensures we have all answers for this submission
    if (state.qa.answers.allIds.length === 0 && submissionId !== null) {
      try {
        await dispatch(fetchReportAnswers({ submission_id: submissionId })).unwrap();
      } catch (error) {
        console.error('Failed to fetch existing answers:', error);
        // Continue anyway, as we've already saved the current answer
      }
    }
    
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
  CreateSubmissionParams & { id?: number },
  { state: RootState; rejectValue: string }
>('qa/submitReport', async (submissionData, { getState, rejectWithValue }) => {
  try {
    console.log('Submitting report:', submissionData);
    
    // Validate required fields
    if (!submissionData.unit_id || !submissionData.template_id || !submissionData.mgmt_id) {
      return rejectWithValue('Missing required fields for report submission');
    }
    
    // Get the current state to check for existing submission ID
    const state = getState();
    const currentSubmissionId = state.qa.currentSubmissionId;
    
    // Determine if we're updating an existing submission or creating a new one
    const isUpdate = submissionData.id !== undefined || currentSubmissionId !== null;
    
    // Prepare the payload
    const payload = {
      ...submissionData,
      id: submissionData.id || currentSubmissionId, // Use provided ID or current submission ID
      status: 'published' // Always set status to published when submitting
    };
    
    // Determine the API endpoint and method
    const path = isUpdate 
      ? `/items/report_submissions/${payload.id}` 
      : '/items/report_submissions';
    
    const method = isUpdate ? 'PATCH' : 'POST';
    
    console.log(`${isUpdate ? 'Updating' : 'Creating'} report submission with ID: ${payload.id}`);
    
    // Make API request
    const response = await apiRequest<ReportSubmission | { data: ReportSubmission }>(() => ({
      path,
      method,
      body: JSON.stringify(isUpdate ? { status: 'published' } : payload),
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
        
        try {
          // Merge new questions with existing ones
          const newQuestions = normalizeEntities<ReportQuestion>(action.payload);
          
          // Create a new questions state object to avoid Immer issues
          const existingByIdEntries = state.questions.byId ? Object.entries(state.questions.byId) : [];
          const newByIdEntries = newQuestions.byId ? Object.entries(newQuestions.byId) : [];
          
          // Combine existing and new byId entries
          const combinedByIdEntries = [...existingByIdEntries, ...newByIdEntries];
          const combinedByIdObject = combinedByIdEntries.reduce((acc, [key, value]) => {
            acc[key as unknown as number] = value;
            return acc;
          }, {} as { [id: number]: ReportQuestion });
          
          // Create a new allIds array with unique IDs
          const existingIds = Array.isArray(state.questions.allIds) ? state.questions.allIds : [];
          const newIds = Array.isArray(newQuestions.allIds) ? newQuestions.allIds : [];
          const uniqueIds = Array.from(new Set([...existingIds, ...newIds]));
          
          // Update the state with the new objects
          state.questions = {
            byId: combinedByIdObject,
            allIds: uniqueIds
          };
          
          // Update progress
          state.progress = updateAllSectionsProgress(state);
        } catch (error) {
          console.error('Error in fetchReportQuestions.fulfilled reducer:', error);
        }
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
        
        try {
          // Filter out answers without IDs before normalizing
          const validAnswers = action.payload.filter(answer => answer.id !== undefined);
          
          // Explicitly type the normalized entities to ensure type safety
          const normalizedAnswers = normalizeEntities<ReportAnswer>(validAnswers);
          
          // Create a new answers state object to avoid Immer issues
          state.answers = {
            byId: normalizedAnswers.byId || {},
            allIds: normalizedAnswers.allIds || []
          };
          
          // Update progress
          state.progress = updateAllSectionsProgress(state);
        } catch (error) {
          console.error('Error in fetchReportAnswers.fulfilled reducer:', error);
        }
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
      
      // Handle createInitialSubmission
      .addCase(createInitialSubmission.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(createInitialSubmission.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        
        // Add the submission to state
        const submission = action.payload;
        if (submission.id) {
          state.submissions.byId[submission.id] = submission;
          
          // Add to allIds if not already present
          if (!state.submissions.allIds.includes(submission.id)) {
            state.submissions.allIds.push(submission.id);
          }
          
          // Set current submission ID
          state.currentSubmissionId = submission.id;
        }
      })
      .addCase(createInitialSubmission.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.payload || 'Failed to create initial submission';
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