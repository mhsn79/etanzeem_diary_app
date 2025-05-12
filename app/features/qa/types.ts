/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Types for the QA feature
 */

// Base interfaces for API responses
export interface ApiResponse<T> {
  data: T[];
  meta?: any;
}

export interface ApiSingleResponse<T> {
  data: T;
}

// Core data models
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

export interface ReportAnswer {
  id?: number;
  submission_id: number;
  number_value?: number | null;
  string_value?: string | null;
  question_id: number;
  [key: string]: any;
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
  submission_data?: { [key: string]: any };
  [key: string]: any;
}

// Progress tracking
export interface SectionProgress {
  totalQuestions: number;
  answeredQuestions: number;
  percentage: number;
}

// Parameters for API requests
export interface FetchSectionsParams {
  template_id: number;
}

export interface FetchQuestionsParams {
  section_id?: number;
}

export interface FetchAnswersParams {
  submission_id: number;
  question_id?: number;
}

export interface SaveAnswerParams {
  submission_id: number;
  question_id: number;
  number_value?: number | null;
  string_value?: string | null;
}

export interface CreateSubmissionParams {
  unit_id: number;
  template_id: number;
  mgmt_id: number;
  status?: string;
}

// Normalized entities for state management
export interface NormalizedEntities<T> {
  byId: { [id: number]: T };
  allIds: number[];
}

// State structure
export interface QAState {
  sections: NormalizedEntities<ReportSection>;
  questions: NormalizedEntities<ReportQuestion>;
  answers: NormalizedEntities<ReportAnswer>;
  submissions: NormalizedEntities<ReportSubmission>;
  currentSubmissionId: number | null;
  progress: { [sectionId: number]: SectionProgress };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  saveError: string | null;
  submitStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  submitError: string | null;
}