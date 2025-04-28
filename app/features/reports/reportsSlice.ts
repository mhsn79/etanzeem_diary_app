import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import directus from '../../services/directus';

// Define types for the API responses based on actual API structure
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

const initialState: ReportsState = {
  tanzeemiLevels: [],
  reportTemplates: [],
  reportSections: [],
  reportQuestions: [],
  currentReportData: {},
  status: 'idle',
  error: null,
};

// Async thunks for fetching data
export const fetchTanzeemiLevels = createAsyncThunk<
  TanzeemiLevel[],
  void,
  { state: RootState; rejectValue: string }
>('reports/fetchTanzeemiLevels', async (_, { rejectWithValue }) => {
  try {
    const response = await directus.request(() => ({
      path: '/items/Tanzeemi_Level',
      method: 'GET',
      params: {
        sort: 'id'
      }
    }));
    console.log('===================fetching tanzeemi levels===================',response);
    
    // Type assertion for the response
    const typedResponse = response as { data: TanzeemiLevel[] };
    return typedResponse.data;
  } catch (error: any) {
    console.error('Error fetching Tanzeemi Levels:', error);
    return rejectWithValue(error.message || 'Failed to fetch Tanzeemi Levels');
  }
});

export const fetchReportTemplates = createAsyncThunk<
  ReportTemplate[],
  void,
  { state: RootState; rejectValue: string }
>('reports/fetchReportTemplates', async (_, { rejectWithValue }) => {
  try {
    const response = await directus.request(() => ({
      path: '/items/report_templates',
      method: 'GET'
    }));
    console.log('===================fetching report templates===================',response);
    
    // Type assertion for the response
    const typedResponse = response as { data: ReportTemplate[] };
    return typedResponse.data;
  } catch (error: any) {
    console.error('Error fetching Report Templates:', error);
    return rejectWithValue(error.message || 'Failed to fetch Report Templates');
  }
});

export const fetchReportSections = createAsyncThunk<
  ReportSection[],
  number | undefined,
  { state: RootState; rejectValue: string }
>('reports/fetchReportSections', async (templateId, { rejectWithValue }) => {
  try {
    let params: any = {};
    
    // If templateId is provided, filter by it
    if (templateId) {
      params.filter = {
        template_id: {
          _eq: templateId
        }
      };
    }
    
    const response = await directus.request(() => ({
      path: '/items/report_sections',
      method: 'GET',
      params
    }));
    console.log('===================fetching report sections===================',response);
    
    // Type assertion for the response
    const typedResponse = response as { data: ReportSection[] };
    return typedResponse.data;
  } catch (error: any) {
    console.error('Error fetching Report Sections:', error);
    return rejectWithValue(error.message || 'Failed to fetch Report Sections');
  }
});

export const fetchReportQuestions = createAsyncThunk<
  ReportQuestion[],
  number | undefined,
  { state: RootState; rejectValue: string }
>('reports/fetchReportQuestions', async (sectionId, { rejectWithValue }) => {
  try {
    let params: any = {};
    
    // If sectionId is provided, filter by it
    if (sectionId) {
      params.filter = {
        section_id: {
          _eq: sectionId
        }
      };
    }
    
    const response = await directus.request(() => ({
      path: '/items/report_questions',
      method: 'GET',
      params
    }));
    console.log('===================fetching report questions===================',response);
    // Type assertion for the response
    const typedResponse = response as { data: ReportQuestion[] };
    return typedResponse.data;
  } catch (error: any) {
    console.error('Error fetching Report Questions:', error);
    return rejectWithValue(error.message || 'Failed to fetch Report Questions');
  }
});

// Thunk to fetch all report data at once
export const fetchAllReportData = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: any; rejectValue: string }
>('reports/fetchAllReportData', async (_, { dispatch, rejectWithValue }) => {
  try {
    // Fetch all data in parallel
    await Promise.all([
      dispatch(fetchTanzeemiLevels()),
      dispatch(fetchReportTemplates()),
      dispatch(fetchReportSections(undefined)),
      dispatch(fetchReportQuestions(undefined))
    ]);
  } catch (error: any) {
    console.error('Error fetching all report data:', error);
    return rejectWithValue(error.message || 'Failed to fetch report data');
  }
});

// Define the report submission payload type
interface ReportSubmissionPayload {
  template_id: number;
  report_data: string;
  status: string;
  user_id?: string;
  submitted_at: string;
}

// Thunk to submit a report
export const submitReport = createAsyncThunk<
  any,
  { templateId: number; reportData: ReportData },
  { state: RootState; rejectValue: string }
>('reports/submitReport', async ({ templateId, reportData }, { rejectWithValue, getState }) => {
  try {
    // Get the current user ID from the auth state if available
    const userId = getState().auth?.user?.id;
    
    // Create a properly typed payload
    const payload: ReportSubmissionPayload = {
      template_id: templateId,
      report_data: JSON.stringify(reportData),
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };
    
    // Add user_id if available
    if (userId) {
      payload.user_id = userId;
    }

    // const response = await directus.request(() => ({
    //   path: '/items/reports',
    //   method: 'POST',
    //   body: JSON.stringify(payload)
    // }));
    
    // Type assertion for the response
    // const typedResponse = response as any;
    console.log('===================submitting report===================');
    
    return {};
  } catch (error: any) {
    console.error('Error submitting report:', error);
    return rejectWithValue(error.message || 'Failed to submit report');
  }
});

// Create the reports slice
const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    // Update the current report data
    updateReportData: (state, action: PayloadAction<{ field: string; value: string | number | boolean | null }>) => {
      const { field, value } = action.payload;
      state.currentReportData = {
        ...state.currentReportData,
        [field]: value
      };
    },
    
    // Reset the current report data
    resetReportData: (state) => {
      state.currentReportData = {};
    },
    
    // Clear any errors
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchTanzeemiLevels
      .addCase(fetchTanzeemiLevels.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTanzeemiLevels.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tanzeemiLevels = action.payload;
      })
      .addCase(fetchTanzeemiLevels.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Tanzeemi Levels';
      })
      
      // Handle fetchReportTemplates
      .addCase(fetchReportTemplates.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportTemplates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportTemplates = action.payload;
      })
      .addCase(fetchReportTemplates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Templates';
      })
      
      // Handle fetchReportSections
      .addCase(fetchReportSections.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportSections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportSections = action.payload;
      })
      .addCase(fetchReportSections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Sections';
      })
      
      // Handle fetchReportQuestions
      .addCase(fetchReportQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReportQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reportQuestions = action.payload;
      })
      .addCase(fetchReportQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch Report Questions';
      })
      
      // Handle submitReport
      .addCase(submitReport.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(submitReport.fulfilled, (state) => {
        state.status = 'succeeded';
        // Reset the current report data after successful submission
        state.currentReportData = {};
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to submit report';
      });
  }
});

// Export actions and selectors
export const { updateReportData, resetReportData, clearError } = reportsSlice.actions;

export const selectTanzeemiLevels = (state: RootState) => state.reports.tanzeemiLevels;
export const selectReportTemplates = (state: RootState) => state.reports.reportTemplates;
export const selectReportSections = (state: RootState) => state.reports.reportSections;
export const selectReportQuestions = (state: RootState) => state.reports.reportQuestions;
export const selectCurrentReportData = (state: RootState) => state.reports.currentReportData;
export const selectReportsStatus = (state: RootState) => state.reports.status;
export const selectReportsError = (state: RootState) => state.reports.error;

// Helper selector to get sections with their questions
export const selectSectionsWithQuestions = (state: RootState) => {
  const sections = state.reports.reportSections;
  const questions = state.reports.reportQuestions;
  
  return sections.map(section => ({
    ...section,
    questions: questions.filter(q => q.report_section_id === section.id)
  }));
};

export default reportsSlice.reducer;