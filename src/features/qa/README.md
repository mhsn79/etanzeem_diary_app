# QA (Question & Answer) Module

This module provides a robust Redux Toolkit implementation for managing report-related data, including sections, questions, answers, and submissions.

## Features

- **Data Fetching**: Sequential fetching of sections, questions, and answers based on template ID
- **Progress Tracking**: Real-time tracking of answered/pending questions per section
- **State Persistence**: Persists current submission ID and answers using redux-persist
- **Normalized State**: Efficient state management with normalized entities
- **Type Safety**: Comprehensive TypeScript types for all entities and operations

## State Structure

```typescript
interface QAState {
  sections: NormalizedEntities<ReportSection>;
  questions: NormalizedEntities<ReportQuestion>;
  answers: NormalizedEntities<ReportAnswer>;
  submissions: NormalizedEntities<ReportSubmission>;
  currentSubmissionId: string | null;
  progress: { [sectionId: number]: SectionProgress };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  saveError: string | null;
  submitStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  submitError: string | null;
}
```

## Main Thunks

- `fetchReportData`: Fetches all report data sequentially (sections → questions → answers)
- `fetchReportSections`: Fetches report sections by template ID
- `fetchReportQuestions`: Fetches report questions by section ID
- `fetchReportAnswers`: Fetches report answers by submission ID
- `saveAnswer`: Saves an answer with submission ID and updates progress
- `submitReport`: Creates a report submission with mandatory fields

## Utility Functions

- `normalizeEntities`: Normalizes an array of entities into a state structure with byId and allIds
- `calculateSectionProgress`: Calculates progress for a specific section
- `calculateAverageSectionProgress`: Calculates the average progress across all sections
- `calculateOverallProgress`: Calculates overall progress based on sections, questions, and answers
- `findAnswerForQuestion`: Finds an answer for a specific question
- `isQuestionAnswered`: Checks if a question has been answered

## Selectors

- Basic selectors for all state properties
- Memoized selectors for filtered data:
  - `selectSectionsByTemplateId`: Get sections by template ID
  - `selectQuestionsBySectionId`: Get questions by section ID
  - `selectAnswersByQuestionId`: Get answers by question ID
  - `selectProgressBySection`: Get progress for a specific section
  - `selectOverallProgress`: Get overall progress percentage (average of all section percentages)

## Usage Example

```typescript
// Fetch all report data
dispatch(fetchReportData({ template_id: 123 }));

// Save an answer
dispatch(saveAnswer({
  submission_id: 456,
  question_id: 789,
  string_value: 'Answer text'
}));

// Submit a report
dispatch(submitReport({
  unit_id: 123,
  template_id: 456,
  mgmt_id: 789
}));

// Access data with selectors
const sections = useSelector(selectSections);
const questions = useSelector(state => selectQuestionsBySectionId(state, sectionId));
const progress = useSelector(state => selectProgressBySection(state, sectionId));
const overallProgress = useSelector(selectOverallProgress);

// Using the utility functions directly
import { calculateAverageSectionProgress } from 'app/features/qa';

// Calculate average progress from a progress object
const progressData = { 
  1: { totalQuestions: 10, answeredQuestions: 5, percentage: 50 },
  2: { totalQuestions: 8, answeredQuestions: 4, percentage: 50 },
  3: { totalQuestions: 5, answeredQuestions: 3, percentage: 60 }
};
const averageProgress = calculateAverageSectionProgress(progressData); // Returns 53
```

## Integration with Redux Store

The QA slice is integrated with the Redux store and configured for persistence using redux-persist with MMKV storage.

# QA Feature - Activity Count Enhancement

## Overview

This enhancement adds the ability to fetch and display activity counts based on specific filters in the AutoQuestionInput component. The feature includes a left-side button that triggers an API call to calculate activity counts and displays the results in a user-friendly manner.

## New Features

### 1. Left-Side Button in AutoQuestionInput

- **Purpose**: Fetches activity count based on user's unit hierarchy
- **Icon**: `search-outline` from Ionicons
- **Text**: "تعداد" (Count in Urdu)
- **Color**: Green (tertiary color from theme)
- **Behavior**: 
  - Shows loading spinner during API call
  - Disabled during API calls to prevent concurrent requests
  - Displays count result or error message below the input

### 2. Activity Count API Integration

- **Endpoint**: `GET /items/Activities/count`
- **Filters**:
  - `filter[activity_type][levelId][_in][]=${id}` for each hierarchy ID
  - `filter[status][_eq]=published` for published activities only
- **Response**: Returns count of matching activities

### 3. Database Query Logic

The API query matches the following criteria:
- Activities with `status = 'published'`
- Activity types where `levelId` matches any ID in `userUnitHierarchyIds`
- Uses the existing `directApiRequest` function for API calls

## Implementation Details

### Files Modified

1. **FormInput.tsx**
   - Added `leftIcon` prop support
   - Updated layout to accommodate left-side button
   - Added conditional styling for input padding

2. **AutoQuestionInput.tsx**
   - Added left button with activity count functionality
   - Integrated with Redux state management
   - Added error handling and user feedback
   - Auto-hide messages after 5 seconds

3. **activitySlice.ts**
   - Added `fetchActivityCount` async thunk
   - Extended state interface with count-related fields
   - Added reducer cases for count operations
   - Added selectors for count state

4. **utils.ts**
   - Updated `calculateAutoValue` to handle count operations
   - Added `calculateActivityCount` utility function
   - Maintained backward compatibility

### State Management

The activity count feature uses Redux state with the following structure:

```typescript
interface ActivitiesExtraState {
  // ... existing fields
  activityCountStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  activityCountError: string | null;
  activityCount: number | null;
}
```

### Error Handling

- **No hierarchy IDs**: Shows "یونٹ ہائیرارکی آئی ڈیز میسر نہیں ہیں"
- **No activities found**: Shows "کوئی سرگرمیاں نہیں ملیں"
- **API errors**: Shows "حساب کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔"
- **Authentication errors**: Handled by existing auth middleware

### Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Loading states with ActivityIndicator
- Disabled states during API calls

## Usage

The left button automatically appears in AutoQuestionInput components when:
- The question has `category = 'auto'`
- The question has `aggregate_func = 'count'`

Users can click the left button to:
1. Fetch the current activity count
2. View the result below the input field
3. See error messages if the operation fails

## Performance Considerations

- API calls are debounced by button disabled state
- Results are cached in Redux state
- Auto-hide messages prevent UI clutter
- Efficient database queries with proper indexing

## Testing

To test the feature:

1. Navigate to a form with auto questions
2. Look for the green "تعداد" button on the left side
3. Click the button to fetch activity count
4. Verify the count displays correctly
5. Test error scenarios (no network, invalid data)

## Future Enhancements

- Add caching for count results
- Implement real-time count updates
- Add count history tracking
- Support for different time periods
- Export count data functionality