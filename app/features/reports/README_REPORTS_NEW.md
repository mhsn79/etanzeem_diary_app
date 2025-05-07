# Reports New Slice

This document explains how to use the new Reports slice (`reportsSlice_new.ts`) which provides optimized functionality for fetching and managing Report Templates and Report Managements.

## Overview

The new Reports slice is designed to:

1. Fetch Report Templates based on a unit ID
2. Fetch all Report Managements for those templates
3. Combine them into a normalized state structure for efficient access
4. Provide selectors for accessing the data

## Key Features

- **Normalized State Structure**: Templates and their managements are stored in a normalized format
- **Robust Error Handling**: Comprehensive error handling and logging
- **Selective Fetching**: Fetch only the templates and managements for a specific unit
- **Efficient Data Access**: Memoized selectors for optimized performance
- **Single API Call for Managements**: Fetches all managements in a single API call

## How to Use

### 1. Import the necessary functions and types

```typescript
import { 
  fetchReportsByUnitId,
  selectReportsList,
  selectReportsLoading,
  selectReportsError,
  ReportData
} from '../features/reports/reportsSlice_new';
```

### 2. Dispatch the fetch action with a unit ID

```typescript
const dispatch = useDispatch<AppDispatch>();

// Fetch reports for a specific unit
useEffect(() => {
  if (unitId) {
    dispatch(fetchReportsByUnitId(unitId));
  }
}, [dispatch, unitId]);
```

### 3. Access the data using selectors

```typescript
// Get all reports as an array
const reportsList = useSelector(selectReportsList);

// Get loading status
const loading = useSelector(selectReportsLoading);

// Get any error
const error = useSelector(selectReportsError);

// Get a specific report by template ID
const specificReport = useSelector(state => selectReportByTemplateId(state, templateId));
```

### 4. Use the data in your component

```typescript
// Example: Render a list of templates with their managements
{reportsList.map(report => (
  <div key={report.template.id}>
    <h3>{report.template.report_name || `Template #${report.template.id}`}</h3>
    
    {report.managements.length > 0 ? (
      <div>
        <p>Latest Period: {report.managements[0].month}/{report.managements[0].year}</p>
        <p>Status: {report.managements[0].status}</p>
        <p>Total Managements: {report.managements.length}</p>
      </div>
    ) : (
      <p>No managements found for this template</p>
    )}
  </div>
))}
```

## Available Selectors

- **Basic Selectors**
  - `selectReportsState`: Get the entire reports state
  - `selectReportsLoading`: Get the loading status
  - `selectReportsError`: Get any error message
  - `selectAllReports`: Get the normalized reports object

- **Derived Selectors**
  - `selectReportIds`: Get an array of all template IDs
  - `selectReportsList`: Get an array of all reports
  - `selectReportByTemplateId`: Get a specific report by template ID
  - `selectReportsByUnitLevelId`: Get reports for a specific unit level
  - `selectAllManagements`: Get all managements across all reports

## Available Actions

- `fetchReportsByUnitId(unitId)`: Fetch templates and managements for a unit
- `clearReports()`: Clear all report data from the state

## Example Component

See `ReportTemplatesExample.tsx` for a complete example of how to use this slice in a React Native component.

## Data Structure

The state structure is normalized for efficient access:

```typescript
interface ReportsNewState {
  reports: {
    [templateId: number]: ReportData;
  };
  loading: boolean;
  error: string | null;
}

interface ReportData {
  template: ReportTemplate;
  managements: ReportManagement[];
}
```

## Error Handling

The slice includes comprehensive error handling:

1. Input validation for unit IDs
2. Response format validation for both templates and managements
3. Detailed error logging at each step
4. Proper error state management

## Performance Considerations

- Templates are fetched in a single API call
- All managements are fetched in a single API call using the `_in` filter
- Normalized state structure for efficient lookups by ID
- Memoized selectors to prevent unnecessary re-renders
- Managements are sorted by ID for consistent ordering