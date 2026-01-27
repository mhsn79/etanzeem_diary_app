import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
import apiRequest from '../../services/apiClient';
import { TanzeemiUnit } from '../../models/TanzeemiUnit';

// Types
export interface ReportTemplate {
  id: number;
  unit_level_id: number;
  report_name: string;
  sort?: number;
}

export interface ReportManagement {
  id: number;
  status: string;
  sort: number;
  month: number;
  year: number;
  report_template_id: number;
  reporting_start_date: string;
  reporting_end_date: string;
  extended_days: number;
  submitted_reports_count: number;
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
  submission_data?: Record<string, unknown>;
  unitDetails?: TanzeemiUnit | null;
}

export interface ReportData {
  template: ReportTemplate;
  managements: ReportManagement[];
}

export interface ReportsNewState {
  reports: Record<number, ReportData>;
  reportSubmissions: ReportSubmission[];
  loading: boolean;
  reportSubmissionsLoading: boolean;
  error: string | null;
  reportSubmissionsError: string | null;
}

// Initial state
const initialState: ReportsNewState = {
  reports: {},
  reportSubmissions: [],
  loading: false,
  reportSubmissionsLoading: false,
  error: null,
  reportSubmissionsError: null,
};

// Helper to normalize API response
const normalizeResponse = <T>(response: T | { data: T }, entity: string): T => {
  if (Array.isArray(response)) {
    return response;
  }
  
  // Check if response is an object and has 'data' property
  if (response !== null && typeof response === 'object' && 'data' in response) {
    const typedResponse = response as { data: T };
    // Only return data if it's not null or undefined
    if (typedResponse.data !== null && typedResponse.data !== undefined) {
      return typedResponse.data;
    }
    // If data is null/undefined, we need to cast the response to T (this is a fallback)
    return response as T;
  }
  
  // If it's a direct value of type T
  if (response !== undefined) {
    return response as T;
  }
  
  throw new Error(`Invalid ${entity} response format`);
};

// Async thunks
export const fetchReportSubmissions = createAsyncThunk<
  ReportSubmission[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('reports/fetchReportSubmissions', async (_, { getState, rejectWithValue }) => {
  try {
    const { tanzeem } = getState();
    const tanzeemiUnitIds = tanzeem?.ids ?? [];

    if (!tanzeemiUnitIds.length) {
      return [];
    }

    const params = {
      filter: { unit_id: { _in: tanzeemiUnitIds } },
      sort: 'id',
    };

    // The centralized API client handles token refresh automatically
    const response = await apiRequest<ReportSubmission[] | { data: ReportSubmission[] }>(() => ({
      path: '/items/reports_submissions',
      method: 'GET',
      params,
    }));

    const data = normalizeResponse<ReportSubmission[]>(response, 'Report Submissions');
    return data.map(submission => ({
      ...submission,
      unitDetails: tanzeem.entities?.[submission.unit_id] ?? null,
    }));
  } catch (error: any) {
    console.error('Error in fetchReportSubmissions:', error);
    return rejectWithValue(error.message || 'Failed to fetch report submissions');
  }
});



export const fetchReportsByUnitId = createAsyncThunk<
  ReportData[],
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('reports/fetchReportsByUnitId', async (unitId, { getState, rejectWithValue }) => {
  try {
    console.log('[reportsSlice] Starting fetchReportsByUnitId for unitId:', unitId);
    
    if (!unitId || typeof unitId !== 'number') {
      console.error('[reportsSlice] Invalid unit ID provided:', unitId);
      return rejectWithValue('Invalid unit ID provided');
    }

    // Get user unit details from state
    const userUnitDetails = getState().tanzeem.userUnitDetails;
    if (!userUnitDetails) {
      return rejectWithValue('User unit details not available');
    }

    // Fetch ALL report templates (no level filtering)
    const templateResponse = await apiRequest<ReportTemplate[]>(() => ({
      path: '/items/report_templates',
      method: 'GET',
      params: {} // No filter to get all templates
    }));

    const templates = normalizeResponse<ReportTemplate[]>(templateResponse, 'Templates');

    if (!templates || templates.length === 0) {
      console.warn('[reportsSlice] No templates found');
      return rejectWithValue('No templates found');
    }

    // Process all templates and their managements
    const result: ReportData[] = [];
    
    for (const template of templates) {
      // Fetch report managements for each template
      const managementResponse = await apiRequest<ReportManagement[]>(() => ({
        path: '/items/reports_mgmt',
        method: 'GET',
        params: { filter: { report_template_id: { _eq: template.id } } }
      }));

      const managements = normalizeResponse<ReportManagement[]>(managementResponse, 'Managements');

      // Add template and its managements to result
      result.push({
        template,
        managements: managements || []
      });
    }

    console.log('[reportsSlice] fetchReportsByUnitId completed successfully with', result.length, 'templates');
    return result;
  } catch (error: any) {
    console.error('[reportsSlice] Error in fetchReportsByUnitId:', error);
    return rejectWithValue(error.message || 'Failed to fetch reports data');
  }
});

// Slice
const reportsNewSlice = createSlice({
  name: 'reportsNew',
  initialState,
  reducers: {
    clearReports: (state) => {
      state.reports = {};
      state.loading = false;
      state.error = null;
    },
    clearSubmissions: (state) => {
      state.reportSubmissions = [];
      state.reportSubmissionsLoading = false;
      state.reportSubmissionsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportsByUnitId.pending, (state) => {
        console.log('[reportsSlice] fetchReportsByUnitId.pending - setting loading to true');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportsByUnitId.fulfilled, (state, action) => {
        console.log('[reportsSlice] fetchReportsByUnitId.fulfilled - setting loading to false, payload length:', action.payload.length);
        state.loading = false;
        
        // Check if payload is empty array
        if (action.payload.length === 0) {
          console.warn('[reportsSlice] Empty payload received in fetchReportsByUnitId.fulfilled');
          state.reports = {};
          return;
        }
        
        const newReports = action.payload.reduce(
          (acc, reportData) => {
            if (!reportData.template || !reportData.template.id) {
              console.error('[reportsSlice] Invalid report data in payload:', JSON.stringify(reportData));
              return acc;
            }
            return {
              ...acc,
              [reportData.template.id]: reportData,
            };
          },
          {} as Record<number, ReportData>
        );
        
        state.reports = newReports;
      })
      .addCase(fetchReportsByUnitId.rejected, (state, action) => {
        console.error('[reportsSlice] fetchReportsByUnitId.rejected with error:', action.payload);
        console.log('[reportsSlice] fetchReportsByUnitId.rejected - setting loading to false');
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch reports';
      })
      .addCase(fetchReportSubmissions.pending, (state) => {
        state.reportSubmissionsLoading = true;
        state.reportSubmissionsError = null;
      })
      .addCase(fetchReportSubmissions.fulfilled, (state, action) => {
        state.reportSubmissionsLoading = false;
        state.reportSubmissions = action.payload;
      })
      .addCase(fetchReportSubmissions.rejected, (state, action) => {
        state.reportSubmissionsLoading = false;
        state.reportSubmissionsError = action.payload as string | null ?? 'Failed to fetch report submissions';
      })

  },
});

// Selectors
export const selectReportsState = (state: RootState) => state.reportsNew;
export const selectReportsLoading = (state: RootState) => state.reportsNew.loading;
export const selectReportsError = (state: RootState) => state.reportsNew.error;
export const selectAllReports = (state: RootState) => state.reportsNew.reports;
export const selectReportSubmissions = (state: RootState) => state.reportsNew.reportSubmissions;
export const selectReportSubmissionsLoading = (state: RootState) => state.reportsNew.reportSubmissionsLoading;
export const selectReportSubmissionsError = (state: RootState) => state.reportsNew.reportSubmissionsError;

export const selectReportIds = createSelector([selectAllReports], (reports) =>
  Object.keys(reports).map(Number)
);

export const selectManagementReportsList = createSelector([selectAllReports], (reports) =>
  Object.values(reports)
);

export const selectReportByTemplateId = createSelector(
  [selectAllReports, (_state: RootState, templateId: number) => templateId],
  (reports, templateId) => reports[templateId]
);

export const selectReportsByUnitLevelId = createSelector(
  [selectManagementReportsList, (_state: RootState, unitLevelId: number) => unitLevelId],
  (reportsList, unitLevelId) =>
    reportsList.filter((report) => report.template.unit_level_id === unitLevelId)
);

export const selectAllManagements = createSelector([selectManagementReportsList], (reportsList) =>
  reportsList.flatMap((report) => report.managements)
);

export const selectSubmissionsByUnitId = createSelector(
  [selectReportSubmissions, (_state: RootState, unitId: number) => unitId],
  (reportSubmissions, unitId) =>
    reportSubmissions.filter((submission) => submission.unit_id === unitId)
);

export const selectSubmissionsByTemplateId = createSelector(
  [selectReportSubmissions, (_state: RootState, templateId: number) => templateId],
  (reportSubmissions, templateId) =>
    reportSubmissions.filter((submission) => submission.template_id === templateId)
);

export const selectSubmissionsByMgmtId = createSelector(
  [selectReportSubmissions, (_state: RootState, mgmtId: number) => mgmtId],
  (reportSubmissions, mgmtId) =>
    reportSubmissions.filter((submission) => submission.mgmt_id === mgmtId)
);

// Exports
export const { clearReports, clearSubmissions } = reportsNewSlice.actions;
export default reportsNewSlice.reducer;