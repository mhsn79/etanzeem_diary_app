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

export interface ReportsState {
  tanzeemiLevels: TanzeemiLevel[];
  reportTemplates: ReportTemplate[];
  reportSections: ReportSection[];
  reportQuestions: ReportQuestion[];
  currentReportData: ReportData;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

/* ------------------------------------------------------------------ */
/* 2.  Initial state                                                  */
/* ------------------------------------------------------------------ */

const initialState: ReportsState = {
  tanzeemiLevels: [],
  reportTemplates: [],
  reportSections: [],
  reportQuestions: [],
  currentReportData: {},
  status: 'idle',
  error: null,
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
    
    const params: any = templateId
      ? { filter: JSON.stringify({ template_id: { _eq: templateId } }) }
      : {};

    const response = await apiRequest<ReportSection[] | { data: ReportSection[] }>(() => ({
      path: '/items/report_sections',
      method: 'GET',
      params,
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
      error.message || 'Failed to fetch Report Sections',
    );
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

export const fetchAllReportData = createAsyncThunk<
  {
    tanzeemiLevels: TanzeemiLevel[];
    reportTemplates: ReportTemplate[];
    reportSections: ReportSection[];
    reportQuestions: ReportQuestion[];
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
      reportTemplatesResult,
      reportSectionsResult,
      reportQuestionsResult
    ] = await Promise.all([
      dispatch(fetchTanzeemiLevels()).unwrap().catch((error: any) => {
        console.error('Failed to fetch Tanzeemi Levels:', error);
        return [] as TanzeemiLevel[];
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
      })
    ]);
    
    console.log('All data fetched successfully in fetchAllReportData:', {
      tanzeemiLevelsCount: tanzeemiLevelsResult.length,
      reportTemplatesCount: reportTemplatesResult.length,
      reportSectionsCount: reportSectionsResult.length,
      reportQuestionsCount: reportQuestionsResult.length
    });
    
    // Return all the fetched data to be used in the fulfilled case
    return {
      tanzeemiLevels: tanzeemiLevelsResult,
      reportTemplates: reportTemplatesResult,
      reportSections: reportSectionsResult,
      reportQuestions: reportQuestionsResult
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
        
        if (action.payload.reportTemplates.length > 0) {
          state.reportTemplates = action.payload.reportTemplates;
        }
        
        if (action.payload.reportSections.length > 0) {
          state.reportSections = action.payload.reportSections;
        }
        
        if (action.payload.reportQuestions.length > 0) {
          state.reportQuestions = action.payload.reportQuestions;
        }
        
        console.log('Updated all report data in store:', {
          tanzeemiLevels: state.tanzeemiLevels.length,
          reportTemplates: state.reportTemplates.length,
          reportSections: state.reportSections.length,
          reportQuestions: state.reportQuestions.length
        });
      })
      .addCase(fetchAllReportData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch report data';
      });
  },
});

export default reportsSlice.reducer;

/* ------------------------------------------------------------------ */
/* 5.  Safe selectors                                                 */
/* ------------------------------------------------------------------ */

export const selectTanzeemiLevels = (s: RootState) =>
  s.reports?.tanzeemiLevels ?? [];

export const selectReportTemplates = (s: RootState) =>
  s.reports?.reportTemplates ?? [];

export const selectReportSections = (s: RootState) =>
  s.reports?.reportSections ?? [];

export const selectReportQuestions = (s: RootState) =>
  s.reports?.reportQuestions ?? [];

export const selectCurrentReportData = (s: RootState) =>
  s.reports?.currentReportData ?? {};

export const selectReportsStatus = (s: RootState) =>
  s.reports?.status ?? 'idle';

export const selectReportsError = (s: RootState) =>
  s.reports?.error ?? null;

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
