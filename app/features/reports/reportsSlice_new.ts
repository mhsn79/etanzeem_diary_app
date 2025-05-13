import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import apiRequest from '../../services/apiClient';
import { checkAndRefreshTokenIfNeeded, logout } from '../auth/authSlice';
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
>('reports/fetchReportSubmissions', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    // Ensure we have a fresh token before making the request
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      console.error('Token refresh failed in fetchReportSubmissions:', refreshError);
      dispatch(logout());
      return rejectWithValue('Authentication expired. Please log in again.');
    }
    
    const { tanzeem } = getState();
    const tanzeemiUnitIds = tanzeem?.ids ?? [];

    if (!tanzeemiUnitIds.length) {
      return [];
    }

    const params = {
      filter: { unit_id: { _in: tanzeemiUnitIds } },
      sort: 'id',
    };

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
    
    // Check if it's an authentication error
    if (error.message?.includes('Authentication expired') || 
        error.message?.includes('Token expired') ||
        error.message?.includes('401')) {
      // Dispatch logout action if it's an auth error
      dispatch(logout());
    }
    
    return rejectWithValue(error.message || 'Failed to fetch report submissions');
  }
});

export const fetchReportsByUnitId = createAsyncThunk<
  ReportData[],
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('reports/fetchReportsByUnitId', async (unitId, { dispatch, rejectWithValue }) => {
  try {
    // Ensure we have a fresh token before making the request
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      console.error('Token refresh failed in fetchReportsByUnitId:', refreshError);
      dispatch(logout());
      return rejectWithValue('Authentication expired. Please log in again.');
    }

    if (!unitId || isNaN(unitId) || unitId <= 0) {
      return rejectWithValue('Invalid unit ID provided');
    }

    const templateResponse = await apiRequest<ReportTemplate[] | { data: ReportTemplate[] }>(() => ({
      path: '/items/report_templates',
      method: 'GET',
      params: { filter: { unit_level_id: { _eq: unitId } } },
    }));

    const templates = normalizeResponse<ReportTemplate[]>(templateResponse, 'Templates');
    if (!templates.length) {
      return [];
    }

    const template = templates[0];
    const managementResponse = await apiRequest<ReportManagement[] | { data: ReportManagement[] }>(() => ({
      path: '/items/reports_mgmt',
      method: 'GET',
      params: { filter: { report_template_id: { _eq: template.id } }, sort: 'id' },
    }));

    const managements = normalizeResponse<ReportManagement[]>(managementResponse, 'Managements');
    return [{ template, managements }];
  } catch (error: any) {
    console.error('Error in fetchReportsByUnitId:', error);
    
    // Check if it's an authentication error
    if (error.message?.includes('Authentication expired') || 
        error.message?.includes('Token expired') ||
        error.message?.includes('401')) {
      // Dispatch logout action if it's an auth error
      dispatch(logout());
    }
    
    return rejectWithValue(error.message || 'Failed to fetch reports');
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
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportsByUnitId.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.reduce(
          (acc, reportData) => ({
            ...acc,
            [reportData.template.id]: reportData,
          }),
          {} as Record<number, ReportData>
        );
      })
      .addCase(fetchReportsByUnitId.rejected, (state, action) => {
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
      });
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