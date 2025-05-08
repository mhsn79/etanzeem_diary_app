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

## Selectors

- Basic selectors for all state properties
- Memoized selectors for filtered data:
  - `selectSectionsByTemplateId`: Get sections by template ID
  - `selectQuestionsBySectionId`: Get questions by section ID
  - `selectAnswersByQuestionId`: Get answers by question ID
  - `selectProgressBySection`: Get progress for a specific section
  - `selectOverallProgress`: Get overall progress percentage

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
```

## Integration with Redux Store

The QA slice is integrated with the Redux store and configured for persistence using redux-persist with MMKV storage.