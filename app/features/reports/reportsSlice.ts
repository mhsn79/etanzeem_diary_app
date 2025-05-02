/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from '@reduxjs/toolkit';
import { RootState } from '../../store';
import directus from '../../services/directus';
import apiRequest from '../../services/apiClient';
import { checkAndRefreshTokenIfNeeded } from '../auth/authSlice';

/* ------------------------------------------------------------------ */
/* 1.  Types                                                          */
/* ------------------------------------------------------------------ */

export interface TanzeemiLevel {
  id: number;
  Name: string;
  Nazim_Label: string;
  status?: string;
  sort?: number | null;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  [key: string]: any;
}

export interface TanzeemiUnit {
  id: number;
  Name: string;
  Description?: string | null;
  Level_id: number;
  level: number;
  Parent_id: number | null;
  Nazim_id: number | null;
  zaili_unit_hierarchy?: number[];
  status?: string;
  sort?: number | null;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  [key: string]: any;
}

export interface ReportManagement {
  id: number;
  unit_level_id: number;
  reporting_start_date: string;
  reporting_end_date: string;
  extended_days: number | null;
  submitted_reports_count: number | null;
  month: number;
  year: number;
  report_template_id: number | null;
  status?: string;
  sort?: number | null;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  [key: string]: any;
}

export interface ReportTemplate {
  id: number;
  unit_level_id: number;
  sort?: number | null;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  [key: string]: any;
}

export interface ReportSection {
  id: number;
  section_label: string;
  template_id: number;
  sort?: number | null;
  status?: string;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  [key: string]: any;
}

export interface ReportQuestion {
  id: number;
  question_text: string;
  input_type: string;
  section_id: number | null;
  category?: string;
  highlight?: boolean;
  linked_to_type?: string | null;
  linked_to_id?: number | null;
  aggregate_func?: string | null;
  sort?: number | null;
  status?: string;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  [key: string]: any;
}

export interface ReportData {
  [key: string]: string | number | boolean | null;
}

export interface ReportSubmission {
  id?: number;
  unit_id: number;
  template_id: number;
  mgmt_id: number;
  status?: string;
  sort?: number | null;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  submission_data?: ReportData;
  [key: string]: any;
}

export interface ReportsState {
  tanzeemiLevels: TanzeemiLevel[];
  tanzeemiUnits: TanzeemiUnit[];
  reportManagements: ReportManagement[];
  reportTemplates: ReportTemplate[];
  reportSections: ReportSection[];
  reportQuestions: ReportQuestion[];
  reportSubmissions: ReportSubmission[];
  currentReportData: ReportData;
  submissionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  submissionError: string | null;
  error: string | null;
}

/* ------------------------------------------------------------------ */
/* 2.  Initial state                                                  */
/* ------------------------------------------------------------------ */

const initialState: ReportsState = {
  tanzeemiLevels: [],
  tanzeemiUnits: [],
  reportManagements: [],
  reportTemplates: [],
  reportSections: [],
  reportQuestions: [],
  reportSubmissions: [],
  currentReportData: {},
  status: 'idle',
  submissionStatus: 'idle',
  error: null,
  submissionError: null,
};

/* ------------------------------------------------------------------ */
/* 3.  Async thunks                                                   */
/* ------------------------------------------------------------------ */

/** NOTE: identical to your previous code – only shortened comments.  */
export const fetchTanzeemiLevels = createAsyncThunk<
  TanzeemiLevel[],
  void,
  { state: RootState; rejectValue: string }
>('reports/fetchTanzeemiLevels', async (_, { rejectWithValue }) => {
  try {
    console.log('Fetching Tanzeemi Levels...');
    const response = await apiRequest<TanzeemiLevel[] | { data: TanzeemiLevel[] }>(() => ({
      path: '/items/Tanzeemi_Level',
      method: 'GET',
      params: { sort: 'id' },
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: TanzeemiLevel[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Tanzeemi Levels:', response);
      return rejectWithValue('Invalid response format for Tanzeemi Levels');
    }
    
    console.log('Successfully fetched Tanzeemi Levels:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Tanzeemi Levels:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Tanzeemi Levels',
    );
  }
});

export const fetchTanzeemiUnits = createAsyncThunk<
  TanzeemiUnit[],
  void,
  { state: RootState; rejectValue: string }
>('reports/fetchTanzeemiUnits', async (_, { rejectWithValue }) => {
  try {
    console.log('Fetching Tanzeemi Units...');
    const response = await apiRequest<TanzeemiUnit[] | { data: TanzeemiUnit[] }>(() => ({
      path: '/items/Tanzeemi_Unit',
      method: 'GET',
      params: { sort: 'id' },
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: TanzeemiUnit[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Tanzeemi Units:', response);
      return rejectWithValue('Invalid response format for Tanzeemi Units');
    }
    
    console.log('Successfully fetched Tanzeemi Units:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Tanzeemi Units:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Tanzeemi Units',
    );
  }
});

export const fetchReportManagements = createAsyncThunk<
  ReportManagement[],
  void,
  { state: RootState; rejectValue: string }
>('reports/fetchReportManagements', async (_, { rejectWithValue }) => {
  try {
    console.log('Fetching Report Managements...');
    const response = await apiRequest<ReportManagement[] | { data: ReportManagement[] }>(() => ({
      path: '/items/reports_mgmt',
      method: 'GET',
      params: { sort: 'id' },
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: ReportManagement[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Report Managements:', response);
      return rejectWithValue('Invalid response format for Report Managements');
    }
    
    console.log('Successfully fetched Report Managements:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Report Managements:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Report Managements',
    );
  }
});

export const fetchReportTemplates = createAsyncThunk<
  ReportTemplate[],
  void,
  { state: RootState; rejectValue: string }
>('reports/fetchReportTemplates', async (_, { rejectWithValue }) => {
  try {
    console.log('Fetching Report Templates...');
    const response = await apiRequest<ReportTemplate[] | { data: ReportTemplate[] }>(() => ({
      path: '/items/report_templates',
      method: 'GET',
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: ReportTemplate[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Report Templates:', response);
      return rejectWithValue('Invalid response format for Report Templates');
    }
    
    console.log('Successfully fetched Report Templates:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Report Templates:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Report Templates',
    );
  }
});

export const fetchReportSections = createAsyncThunk<
  ReportSection[],
  number | undefined,
  { state: RootState; rejectValue: string }
>('reports/fetchReportSections', async (templateId, { rejectWithValue }) => {
  try {
    console.log('Fetching Report Sections...', templateId ? `for template ID: ${templateId}` : 'all sections');
    
    // Validate templateId is a valid number
    if (templateId !== undefined && (isNaN(templateId) || templateId <= 0)) {
      console.error('Invalid template ID:', templateId);
      return rejectWithValue('Invalid template ID provided');
    }
    
    // Construct filter parameter safely
    let params: any = {};
    if (templateId !== undefined) {
      try {
        params.filter = JSON.stringify({ template_id: { _eq: templateId } });
      } catch (e) {
        console.error('Error creating filter parameter:', e);
        params = {}; // Reset params if JSON stringify fails
      }
    }

    console.log('Making API request with params:', params);
    
    // Make the API request with proper error handling
    const response = await apiRequest<ReportSection[] | { data: ReportSection[] }>(() => ({
      path: '/items/report_sections',
      method: 'GET',
      params,
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: ReportSection[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Report Sections:', response);
      return rejectWithValue('Invalid response format for Report Sections');
    }
    
    console.log('Successfully fetched Report Sections:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Report Sections:', error);
    // Provide more detailed error information
    const errorMessage = error.message || 'Failed to fetch Report Sections';
    const errorDetails = error.errors && Array.isArray(error.errors) 
      ? ` (${error.errors.map((e: any) => e.message || e).join(', ')})` 
      : '';
    
    return rejectWithValue(errorMessage + errorDetails);
  }
});

export const fetchReportQuestions = createAsyncThunk<
  ReportQuestion[],
  number | undefined,
  { state: RootState; rejectValue: string }
>('reports/fetchReportQuestions', async (sectionId, { rejectWithValue }) => {
  try {
    console.log('Fetching Report Questions...', sectionId ? `for section ID: ${sectionId}` : 'all questions');
    
    const params: any = sectionId
      ? { filter: JSON.stringify({ section_id: { _eq: sectionId } }) }
      : {};

    const response = await apiRequest<ReportQuestion[] | { data: ReportQuestion[] }>(() => ({
      path: '/items/report_questions',
      method: 'GET',
      params,
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
      error.message || 'Failed to fetch Report Questions',
    );
  }
});

export const submitReport = createAsyncThunk<
  ReportSubmission,
  {
    unit_id: number;
    template_id: number;
    mgmt_id: number;
    // submission_data?: ReportData;
  },
  { state: RootState; rejectValue: string }
>('reports/submitReport', async (reportData, { getState, rejectWithValue }) => {
  try {
    console.log('Submitting report with data:', reportData);
    
    // First, check if we have the required fields
    if (!reportData.unit_id || !reportData.template_id || !reportData.mgmt_id) {
      throw new Error('Missing required fields for report submission');
    }
    
    // Prepare the submission data
    const submissionPayload: ReportSubmission = {
      unit_id: reportData.unit_id,
      template_id: reportData.template_id,
      mgmt_id: reportData.mgmt_id,
    };
    
    console.log('Submitting report with payload:', submissionPayload);
    
    // Make the API call to submit the report
    const response = await apiRequest<ReportSubmission | { data: ReportSubmission }>(() => ({
      path: '/items/reports_submissions',
      method: 'POST',
      body: JSON.stringify(submissionPayload),
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
      error.message || 'Failed to submit report',
    );
  }
});

export const fetchReportSubmissions = createAsyncThunk<
  ReportSubmission[],
  void,
  { state: RootState; rejectValue: string }
>('reports/fetchReportSubmissions', async (_, { rejectWithValue }) => {
  try {
    console.log('Fetching Report Submissions...');
    const response = await apiRequest<ReportSubmission[] | { data: ReportSubmission[] }>(() => ({
      path: '/items/reports_submissions',
      method: 'GET',
      params: { sort: 'id' },
    }));
    
    // Handle both response formats: direct array or {data: array}
    let data: ReportSubmission[];
    if (Array.isArray(response)) {
      data = response;
    } else if (response && 'data' in response && Array.isArray(response.data)) {
      data = response.data;
    } else {
      console.error('Invalid response format for Report Submissions:', response);
      return rejectWithValue('Invalid response format for Report Submissions');
    }
    
    console.log('Successfully fetched Report Submissions:', data.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching Report Submissions:', error);
    return rejectWithValue(
      error.message || 'Failed to fetch Report Submissions',
    );
  }
});

export const fetchAllReportData = createAsyncThunk<
  {
    tanzeemiLevels: TanzeemiLevel[];
    tanzeemiUnits: TanzeemiUnit[];
    reportManagements: ReportManagement[];
    reportTemplates: ReportTemplate[];
    reportSections: ReportSection[];
    reportQuestions: ReportQuestion[];
    reportSubmissions: ReportSubmission[];
  },
  void,
  { state: RootState; dispatch: any; rejectValue: string }
>('reports/fetchAllReportData', async (_, { dispatch, rejectWithValue }) => {
  try {
    // First refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded());
    } catch (error: any) {
      console.warn('Token refresh failed, but continuing with API calls:', error);
    }
    
    // Execute all API calls in parallel and unwrap their results
    const [
      tanzeemiLevelsResult,
      tanzeemiUnitsResult,
      reportManagementsResult,
      reportTemplatesResult,
      reportSectionsResult,
      reportQuestionsResult,
      reportSubmissionsResult
    ] = await Promise.all([
      dispatch(fetchTanzeemiLevels()).unwrap().catch((error: any) => {
        console.error('Failed to fetch Tanzeemi Levels:', error);
        return [] as TanzeemiLevel[];
      }),
      dispatch(fetchTanzeemiUnits()).unwrap().catch((error: any) => {
        console.error('Failed to fetch Tanzeemi Units:', error);
        return [] as TanzeemiUnit[];
      }),
      dispatch(fetchReportManagements()).unwrap().catch((error: any) => {
        console.error('Failed to fetch Report Managements:', error);
        return [] as ReportManagement[];
      }),
      dispatch(fetchReportTemplates()).unwrap().catch((error: any) => {
        console.error('Failed to fetch Report Templates:', error);
        return [] as ReportTemplate[];
      }),
      dispatch(fetchReportSections(undefined)).unwrap().catch((error: any) => {
        console.error('Failed to fetch Report Sections:', error);
        return [] as ReportSection[];
      }),
      dispatch(fetchReportQuestions(undefined)).unwrap().catch((error: any) => {
        console.error('Failed to fetch Report Questions:', error);
        return [] as ReportQuestion[];
      }),
      dispatch(fetchReportSubmissions()).unwrap().catch((error: any) => {
        console.error('Failed to fetch Report Submissions:', error);
        return [] as ReportSubmission[];
      })
    ]);
    
    console.log('All data fetched successfully in fetchAllReportData:', {
      tanzeemiLevelsCount: tanzeemiLevelsResult.length,
      tanzeemiUnitsCount: tanzeemiUnitsResult.length,
      reportManagementsCount: reportManagementsResult.length,
      reportTemplatesCount: reportTemplatesResult.length,
      reportSectionsCount: reportSectionsResult.length,
      reportQuestionsCount: reportQuestionsResult.length,
      reportSubmissionsCount: reportSubmissionsResult.length
    });
    
    // Return all the fetched data to be used in the fulfilled case
    return {
      tanzeemiLevels: tanzeemiLevelsResult,
      tanzeemiUnits: tanzeemiUnitsResult,
      reportManagements: reportManagementsResult,
      reportTemplates: reportTemplatesResult,
      reportSections: reportSectionsResult,
      reportQuestions: reportQuestionsResult,
      reportSubmissions: reportSubmissionsResult
    };
  } catch (error: any) {
    console.error('Error in fetchAllReportData:', error);
    return rejectWithValue(error.message || 'Failed to fetch report data');
  }
});

/* ------------------------------------------------------------------ */
/* 4.  Slice                                                          */
/* ------------------------------------------------------------------ */

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    updateReportData: (
      state,
      action: PayloadAction<{
        field: string;
        value: string | number | boolean | null;
      }>,
    ) => {
      const { field, value } = action.payload;
      state.currentReportData = { ...state.currentReportData, [field]: value };
    },
    resetReportData: (state) => {
      state.currentReportData = {};
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle individual fetch operations
      .addCase(fetchTanzeemiLevels.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTanzeemiLevels.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tanzeemiLevels = action.payload;
        console.log('Updated tanzeemiLevels in store:', state.tanzeemiLevels.length);
      })
      .addCase(fetchTanzeemiLevels.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Tanzeemi Levels';
      })
      
      .addCase(fetchTanzeemiUnits.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTanzeemiUnits.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tanzeemiUnits = action.payload;
        console.log('Updated tanzeemiUnits in store:', state.tanzeemiUnits.length);
      })
      .addCase(fetchTanzeemiUnits.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Tanzeemi Units';
      })
      
      .addCase(fetchReportManagements.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportManagements.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportManagements = action.payload;
        console.log('Updated reportManagements in store:', state.reportManagements.length);
      })
      .addCase(fetchReportManagements.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Managements';
      })
      
      .addCase(fetchReportTemplates.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportTemplates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportTemplates = action.payload;
        console.log('Updated reportTemplates in store:', state.reportTemplates.length);
      })
      .addCase(fetchReportTemplates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Templates';
      })
      
      .addCase(fetchReportSections.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportSections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportSections = action.payload;
        console.log('Updated reportSections in store:', state.reportSections.length);
      })
      .addCase(fetchReportSections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Sections';
      })
      
      .addCase(fetchReportQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportQuestions = action.payload;
        console.log('Updated reportQuestions in store:', state.reportQuestions.length);
      })
      .addCase(fetchReportQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Questions';
      })
      
      // Handle fetchReportSubmissions
      .addCase(fetchReportSubmissions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportSubmissions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportSubmissions = action.payload;
        console.log('Updated reportSubmissions in store:', state.reportSubmissions.length);
      })
      .addCase(fetchReportSubmissions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Submissions';
      })
      
      // Handle fetchAllReportData
      .addCase(fetchAllReportData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllReportData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Update all state properties with the fetched data
        if (action.payload.tanzeemiLevels.length > 0) {
          state.tanzeemiLevels = action.payload.tanzeemiLevels;
        }
        
        if (action.payload.tanzeemiUnits.length > 0) {
          state.tanzeemiUnits = action.payload.tanzeemiUnits;
        }
        
        if (action.payload.reportManagements.length > 0) {
          state.reportManagements = action.payload.reportManagements;
        }
        
        if (action.payload.reportTemplates.length > 0) {
          state.reportTemplates = action.payload.reportTemplates;
        }
        
        if (action.payload.reportSections.length > 0) {
          state.reportSections = action.payload.reportSections;
        }
        
        if (action.payload.reportQuestions.length > 0) {
          state.reportQuestions = action.payload.reportQuestions;
        }
        
        if (action.payload.reportSubmissions.length > 0) {
          state.reportSubmissions = action.payload.reportSubmissions;
        }
        
        console.log('Updated all report data in store:', {
          tanzeemiLevels: state.tanzeemiLevels.length,
          tanzeemiUnits: state.tanzeemiUnits.length,
          reportManagements: state.reportManagements.length,
          reportTemplates: state.reportTemplates.length,
          reportSections: state.reportSections.length,
          reportQuestions: state.reportQuestions.length,
          reportSubmissions: state.reportSubmissions.length
        });
      })
      .addCase(fetchAllReportData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch report data';
      })
      
      // Handle submitReport
      .addCase(submitReport.pending, (state) => {
        state.submissionStatus = 'loading';
        state.submissionError = null;
      })
      .addCase(submitReport.fulfilled, (state) => {
        state.submissionStatus = 'succeeded';
        // Reset the current report data after successful submission
        state.currentReportData = {};
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.submissionStatus = 'failed';
        state.submissionError = action.payload || 'Failed to submit report';
      });
  },
});

export default reportsSlice.reducer;

/* ------------------------------------------------------------------ */
/* 5.  Safe selectors                                                 */
/* ------------------------------------------------------------------ */

export const selectTanzeemiLevels = (s: RootState) =>
  s.reports?.tanzeemiLevels ?? [];

export const selectTanzeemiUnits = (s: RootState) =>
  s.reports?.tanzeemiUnits ?? [];

export const selectReportManagements = (s: RootState) =>
  s.reports?.reportManagements ?? [];

export const selectReportTemplates = (s: RootState) =>
  s.reports?.reportTemplates ?? [];

export const selectReportSections = (s: RootState) =>
  s.reports?.reportSections ?? [];

export const selectReportQuestions = (s: RootState) =>
  s.reports?.reportQuestions ?? [];

export const selectReportSubmissions = (s: RootState) =>
  s.reports?.reportSubmissions ?? [];

export const selectCurrentReportData = (s: RootState) =>
  s.reports?.currentReportData ?? {};

export const selectReportsStatus = (s: RootState) =>
  s.reports?.status ?? 'idle';

export const selectReportsError = (s: RootState) =>
  s.reports?.error ?? null;
  
export const selectSubmissionStatus = (s: RootState) =>
  s.reports?.submissionStatus ?? 'idle';

export const selectSubmissionError = (s: RootState) =>
  s.reports?.submissionError ?? null;

/** Helper selector */
export const selectSectionsWithQuestions = (s: RootState) => {
  const sections = s.reports?.reportSections ?? [];
  const questions = s.reports?.reportQuestions ?? [];
  return sections.map((sec) => ({
    ...sec,
    questions: questions.filter((q) => q.section_id === sec.id),
  }));
};

/* ------------------------------------------------------------------ */
/* 6.  Actions export                                                 */
/* ------------------------------------------------------------------ */

export const { updateReportData, resetReportData, clearError } =
  reportsSlice.actions;
