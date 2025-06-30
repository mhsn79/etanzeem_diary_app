import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
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
>('reports/fetchReportSubmissions', async (_, { getState, dispatch, rejectWithValue }) => {
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
>('reports/fetchReportsByUnitId', async (unitId, { dispatch, rejectWithValue, getState }) => {
  try {
    console.log('[reportsSlice] fetchReportsByUnitId called with unitId:', unitId);
    
    if (!unitId || isNaN(unitId) || unitId <= 0) {
      console.error('[reportsSlice] Invalid unit ID provided:', unitId);
      return rejectWithValue('Invalid unit ID provided');
    }

    // Get the user's unit details from the state to check if we're using the right ID
    const state = getState();
    const userUnitDetails = state.tanzeem?.userUnitDetails;
    console.log('[reportsSlice] User unit details from state:', JSON.stringify(userUnitDetails));
    
    // Check if we should use Level_id instead of the unit ID
    const levelId = userUnitDetails?.Level_id || userUnitDetails?.level_id;
    console.log('[reportsSlice] User unit level ID:', levelId);
    
    // Determine which ID to use for fetching templates
    const idToUse = levelId || unitId;
    console.log('[reportsSlice] Using ID for template fetch:', idToUse);

    // The centralized API client handles token refresh automatically
    console.log('[reportsSlice] Fetching report templates for unit level ID:', idToUse);
    const templateResponse = await apiRequest<ReportTemplate[] | { data: ReportTemplate[] }>(() => ({
      path: '/items/report_templates',
      method: 'GET',
      params: { filter: { unit_level_id: { _eq: idToUse } } },
    }));
    
    console.log('[reportsSlice] Template response:', JSON.stringify(templateResponse));

    const templates = normalizeResponse<ReportTemplate[]>(templateResponse, 'Templates');
    console.log('[reportsSlice] Normalized templates:', JSON.stringify(templates));
    
    if (!templates.length) {
      console.warn('[reportsSlice] No templates found for unit level ID:', idToUse);
      return [];
    }

    const template = templates[0];
    console.log('[reportsSlice] Using template:', JSON.stringify(template));
    
    console.log('[reportsSlice] Fetching report managements for template ID:', template.id);
    const managementResponse = await apiRequest<ReportManagement[] | { data: ReportManagement[] }>(() => ({
      path: '/items/reports_mgmt',
      method: 'GET',
      params: { filter: { report_template_id: { _eq: template.id } }, sort: 'id' },
    }));
    
    console.log('[reportsSlice] Management response:', JSON.stringify(managementResponse));

    const managements = normalizeResponse<ReportManagement[]>(managementResponse, 'Managements');
    console.log('[reportsSlice] Normalized managements:', JSON.stringify(managements));
    
    const result = [{ template, managements }];
    console.log('[reportsSlice] Final result:', JSON.stringify(result));
    
    return result;
  } catch (error: any) {
    console.error('[reportsSlice] Error in fetchReportsByUnitId:', error);
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
        console.log('[reportsSlice] fetchReportsByUnitId.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportsByUnitId.fulfilled, (state, action) => {
        console.log('[reportsSlice] fetchReportsByUnitId.fulfilled with payload:', JSON.stringify(action.payload));
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
        
        console.log('[reportsSlice] Updated reports state:', JSON.stringify(newReports));
        state.reports = newReports;
      })
      .addCase(fetchReportsByUnitId.rejected, (state, action) => {
        console.error('[reportsSlice] fetchReportsByUnitId.rejected with error:', action.payload);
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