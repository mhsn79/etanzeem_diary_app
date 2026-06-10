/**
 * Batch auto-fill utility for report questions.
 * Replicates the fetch logic from AutoQuestionInput.tsx but without any UI state.
 */
import { ReportQuestion } from './types';
import { directApiRequest, ensureFreshToken } from '@/src/services/apiClient';
import { fetchStrengthCountAndTotals } from '@/src/features/strength/strengthSlice';
import { getOrCreateStrengthRecord } from '@/src/features/strength/strengthSync';
import { AppDispatch } from '@/src/store';

export interface ContactType {
  id: number;
  type: string; // 'rukun' | 'umeedwar' | 'karkun'
}

export interface AutoFillContext {
  unitId: number;
  month: number;
  year: number;
  contactTypes?: ContactType[];
}

export interface AutoFillResult {
  questionId: number;
  value: number | string;
  success: boolean;
  error?: string;
}

interface StrengthRecord {
  id: number;
  Tanzeemi_Unit: number;
  Type: number;
  plus_value: number;
  minus_value: number;
  previous_total: number;
  new_total: number;
  report_year: number;
  report_month: number;
}

/**
 * Fetch the auto-fill value for a single question, non-interactively.
 */
export async function fetchAutoValueForQuestion(
  question: ReportQuestion,
  context: AutoFillContext,
  dispatch: AppDispatch
): Promise<AutoFillResult> {
  const { unitId, month, year } = context;

  try {
    if (!question.linked_to_id || !question.linked_to_type) {
      return { questionId: question.id, value: 0, success: false, error: 'Missing linked_to config' };
    }

    let result: number | string = 0;

    if (question.linked_to_type === 'strength') {
      result = await fetchStrengthValue(question, context, dispatch);
    } else if (question.linked_to_type === 'contacts') {
      result = await fetchContactsCount(question, context);
    } else if (question.linked_to_type === 'activity') {
      result = await fetchActivitiesCount(question, context);
    } else if (question.linked_to_type === 'baitulmal') {
      result = await fetchBaitulmalValue(question, context);
    } else {
      return { questionId: question.id, value: 0, success: false, error: 'Unknown linked_to_type' };
    }

    return { questionId: question.id, value: result, success: true };
  } catch (error: any) {
    return {
      questionId: question.id,
      value: 0,
      success: false,
      error: error.message || 'Fetch failed',
    };
  }
}

/**
 * Fetch strength record value based on aggregate_func.
 * Auto-creates the Strength_Records row if it doesn't exist yet,
 * carrying forward previous_total from the most recent prior month.
 */
async function fetchStrengthValue(
  question: ReportQuestion,
  context: AutoFillContext,
  dispatch: AppDispatch
): Promise<number> {
  const { unitId, month, year } = context;

  if (question.aggregate_func === 'avg') {
    const aggResult = await dispatch(fetchStrengthCountAndTotals({
      linkedToId: question.linked_to_id ?? 0,
      year,
      month,
    })).unwrap();
    return aggResult.avg;
  }

  // Get or create the strength record (carries forward from previous month)
  const record = await getOrCreateStrengthRecord(
    unitId,
    question.linked_to_id!,
    year,
    month,
  );

  switch (question.aggregate_func) {
    case 'plus':
      return record.plus_value || 0;
    case 'minus':
      return record.minus_value || 0;
    case 'total':
    case 'sum':
    case 'count':
    default:
      return record.new_total || 0;
  }
}

/**
 * Fetch contacts count based on aggregate_func and date filters
 */
async function fetchContactsCount(
  question: ReportQuestion,
  context: AutoFillContext
): Promise<number> {
  const { unitId, month, year } = context;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

  let dateFilter: any = {};

  if (question.aggregate_func === 'plus') {
    // Rukun uses Rukinat_Date, Umeedwar/Karkun use date_created
    const ct = context.contactTypes?.find(c => c.id === question.linked_to_id);
    const isRukun = ct?.type === 'rukun';
    const dateField = isRukun ? 'Rukinat_Date' : 'date_created';

    dateFilter = {
      _and: [
        { status: { _neq: 'archived' } },
        { Tanzeemi_Unit: { _eq: unitId } },
        { [dateField]: { _nnull: true } },
        { [dateField]: { _gte: startDate } },
        { [dateField]: { _lte: endDate } },
      ],
    };
  } else if (question.aggregate_func === 'minus') {
    dateFilter = {
      _and: [
        { Tanzeemi_Unit: { _eq: unitId } },
        { archived_at: { _nnull: true } },
        { archived_at: { _gte: startDate } },
        { archived_at: { _lte: endDate } },
      ],
    };
  } else {
    dateFilter = {
      _and: [
        { status: { _neq: 'archived' } },
        { Tanzeemi_Unit: { _eq: unitId } },
      ],
    };
  }

  const filter = {
    _and: [
      { contact_type: { _eq: question.linked_to_id } },
      dateFilter,
    ],
  };

  const params = new URLSearchParams();
  params.append('filter', JSON.stringify(filter));
  params.append('fields', 'id');
  params.append('limit', '-1');
  params.append('meta', 'filter_count');

  const response = await directApiRequest<{ data: any[]; meta?: { filter_count?: number } }>(
    `/items/Person?${params.toString()}`,
    'GET'
  );

  return response.data?.length ?? 0;
}

/**
 * Fetch published activities value based on aggregate_func
 */
async function fetchActivitiesCount(
  question: ReportQuestion,
  context: AutoFillContext
): Promise<number | string> {
  const { unitId, month, year } = context;
  const needsAttendance = question.aggregate_func === 'avg' || question.aggregate_func === 'array';

  const filter = {
    _and: [
      { activity_type: { _eq: question.linked_to_id } },
      { tanzeemi_unit: { _eq: unitId } },
      { report_month: { _eq: month } },
      { report_year: { _eq: year } },
      { status: { _eq: 'published' } },
    ],
  };

  const params = new URLSearchParams();
  params.append('filter', JSON.stringify(filter));
  params.append('fields', needsAttendance ? 'id,attendance' : 'id');
  params.append('limit', '-1');

  const response = await directApiRequest<{ data: any[] }>(
    `/items/Activities?${params.toString()}`,
    'GET'
  );

  const activities = response.data ?? [];

  if (question.aggregate_func === 'avg') {
    const withAttendance = activities.filter((a: any) => a.attendance != null && a.attendance > 0);
    if (withAttendance.length === 0) return 0;
    const total = withAttendance.reduce((sum: number, a: any) => sum + Number(a.attendance), 0);
    return Math.round(total / withAttendance.length);
  }

  if (question.aggregate_func === 'array') {
    const withAttendance = activities.filter((a: any) => a.attendance != null);
    return withAttendance.map((a: any) => String(a.attendance)).join(', ');
  }

  return activities.length;
}

/**
 * Fetch baitulmal records value based on aggregate_func (sum of amounts for a specific type)
 */
async function fetchBaitulmalValue(
  question: ReportQuestion,
  context: AutoFillContext
): Promise<number> {
  const { unitId, month, year } = context;

  const filter = {
    _and: [
      { Type: { _eq: question.linked_to_id } },
      { Tanzeemi_Unit: { _eq: unitId } },
      { report_month: { _eq: month } },
      { report_year: { _eq: year } },
      { status: { _neq: 'archived' } },
    ],
  };

  const params = new URLSearchParams();
  params.append('filter', JSON.stringify(filter));
  params.append('fields', 'id,amount');
  params.append('limit', '-1');

  const response = await directApiRequest<{ data: { id: number; amount: number }[] }>(
    `/items/baitulmal_records?${params.toString()}`,
    'GET'
  );

  const records = response.data ?? [];

  switch (question.aggregate_func) {
    case 'count':
      return records.length;
    case 'sum':
    case 'total':
    default:
      return records.reduce((sum, r) => sum + (r.amount || 0), 0);
  }
}

export default {};
