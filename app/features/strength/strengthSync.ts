/**
 * Shared utilities for syncing Strength_Records from report answers.
 *
 * Used by:
 *  - batchAutoFill  → getOrCreateStrengthRecord (ensure record exists before reading)
 *  - saveAnswer     → syncStrengthFromAnswer    (write manual value back to Strength_Records)
 *
 * Keeps cascade logic in one place so it stays consistent with strengthSlice's
 * own cascadeSubsequentMonths.
 */
import { directApiRequest } from '../../services/apiClient';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

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

interface MgmtPeriod {
  id: number;
  month: number;
  year: number;
  report_template_id: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Fetch the most recent new_total before (year, month) for a unit / type.
 * Returns 0 when no prior record exists.
 */
export async function fetchPreviousTotal(
  unitId: number,
  typeId: number,
  year: number,
  month: number,
): Promise<number> {
  const filter = JSON.stringify({
    _and: [
      { Tanzeemi_Unit: { _eq: unitId } },
      { Type: { _eq: typeId } },
      {
        _or: [
          { report_year: { _lt: year } },
          {
            _and: [
              { report_year: { _eq: year } },
              { report_month: { _lt: month } },
            ],
          },
        ],
      },
    ],
  });

  const response = await directApiRequest<{ data: StrengthRecord[] }>(
    `/items/Strength_Records?filter=${encodeURIComponent(filter)}&sort=-report_year,-report_month&limit=1`,
    'GET',
  );

  return response.data?.[0]?.new_total ?? 0;
}

/**
 * Return the existing Strength_Records row for (unit, type, month)
 * or create one with previous_total carried forward.
 */
export async function getOrCreateStrengthRecord(
  unitId: number,
  typeId: number,
  year: number,
  month: number,
): Promise<StrengthRecord> {
  // 1. Check for existing record
  const filter = JSON.stringify({
    _and: [
      { Tanzeemi_Unit: { _eq: unitId } },
      { Type: { _eq: typeId } },
      { report_year: { _eq: year } },
      { report_month: { _eq: month } },
    ],
  });

  const existing = await directApiRequest<{ data: StrengthRecord[] }>(
    `/items/Strength_Records?filter=${encodeURIComponent(filter)}&limit=1`,
    'GET',
  );

  if (existing.data?.[0]) {
    return existing.data[0];
  }

  // 2. No record → create with carry-forward from previous months
  const previousTotal = await fetchPreviousTotal(unitId, typeId, year, month);

  const payload = {
    Tanzeemi_Unit: unitId,
    Type: typeId,
    plus_value: 0,
    minus_value: 0,
    previous_total: previousTotal,
    new_total: previousTotal, // no change yet
    report_year: year,
    report_month: month,
  };

  const createRes = await directApiRequest<{ data: StrengthRecord } | StrengthRecord>(
    '/items/Strength_Records',
    'POST',
    payload,
  );

  // Normalize: Directus may return { data: ... } or the object directly
  const created = (createRes as { data: StrengthRecord }).data ?? (createRes as StrengthRecord);
  console.log(
    `[STRENGTH_SYNC] Created Strength_Records id=${created.id} for unit=${unitId} type=${typeId} ${year}-${month}, prev=${previousTotal}`,
  );
  return created;
}

/* ------------------------------------------------------------------ */
/* Sync a manual report-answer value back to Strength_Records         */
/* ------------------------------------------------------------------ */

/**
 * After a user manually enters a value for a strength-linked report question,
 * call this to propagate the value into Strength_Records and cascade forward.
 *
 * @param aggregateFunc  'plus' | 'minus' | 'total' | 'sum' | 'count'
 * @param value          The number the user entered in the report answer
 */
export async function syncStrengthFromAnswer(
  unitId: number,
  typeId: number,
  year: number,
  month: number,
  aggregateFunc: string,
  value: number,
): Promise<void> {
  try {
    const record = await getOrCreateStrengthRecord(unitId, typeId, year, month);

    let patchFields: Record<string, number>;

    switch (aggregateFunc) {
      case 'plus':
        patchFields = {
          plus_value: value,
          new_total: Math.max(0, record.previous_total + value - record.minus_value),
        };
        break;

      case 'minus':
        patchFields = {
          minus_value: value,
          new_total: Math.max(0, record.previous_total + record.plus_value - value),
        };
        break;

      case 'total':
      case 'sum':
      case 'count':
      default:
        // User entered the total directly — store as-is, don't touch plus/minus
        patchFields = { new_total: value };
        break;
    }

    await directApiRequest(
      `/items/Strength_Records/${record.id}`,
      'PATCH',
      patchFields,
    );

    const finalNewTotal = patchFields.new_total;
    console.log(
      `[STRENGTH_SYNC] Updated record ${record.id}: ${JSON.stringify(patchFields)}`,
    );

    // Cascade to all subsequent months
    await cascadeSubsequentMonths(unitId, typeId, year, month, finalNewTotal);
  } catch (error) {
    // Log but don't throw — sync is best-effort; the report answer is already saved
    console.error('[STRENGTH_SYNC] syncStrengthFromAnswer failed:', error);
  }
}

/* ------------------------------------------------------------------ */
/* Fetch reports_mgmt to get month / year from mgmt_id                */
/* ------------------------------------------------------------------ */

/**
 * Small helper so callers don't need to build the Directus request themselves.
 */
export async function fetchMgmtPeriod(mgmtId: number): Promise<MgmtPeriod | null> {
  try {
    const response = await directApiRequest<{ data: MgmtPeriod }>(
      `/items/reports_mgmt/${mgmtId}?fields=id,month,year,report_template_id`,
      'GET',
    );
    return response.data ?? (response as unknown as MgmtPeriod);
  } catch {
    console.error(`[STRENGTH_SYNC] Failed to fetch reports_mgmt id=${mgmtId}`);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Cascade                                                            */
/* ------------------------------------------------------------------ */

/**
 * After a record's new_total changes, walk forward through all later
 * months (in chronological order) and recalculate previous_total / new_total.
 */
async function cascadeSubsequentMonths(
  unitId: number,
  typeId: number,
  savedYear: number,
  savedMonth: number,
  savedNewTotal: number,
): Promise<void> {
  try {
    const filter = JSON.stringify({
      _and: [
        { Tanzeemi_Unit: { _eq: unitId } },
        { Type: { _eq: typeId } },
        {
          _or: [
            { report_year: { _gt: savedYear } },
            {
              _and: [
                { report_year: { _eq: savedYear } },
                { report_month: { _gt: savedMonth } },
              ],
            },
          ],
        },
      ],
    });

    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}&sort=report_year,report_month&limit=-1`,
      'GET',
    );

    const subsequent = response.data ?? [];
    if (subsequent.length === 0) return;

    console.log(
      `[STRENGTH_SYNC] Cascading ${subsequent.length} subsequent records for unit=${unitId} type=${typeId}`,
    );

    let carryForward = savedNewTotal;

    for (const rec of subsequent) {
      const newPrev = carryForward;
      const newTotal = Math.max(0, newPrev + (rec.plus_value || 0) - (rec.minus_value || 0));

      if (rec.previous_total !== newPrev || rec.new_total !== newTotal) {
        await directApiRequest(
          `/items/Strength_Records/${rec.id}`,
          'PATCH',
          { previous_total: newPrev, new_total: newTotal },
        );
        console.log(
          `[STRENGTH_SYNC] Cascaded record ${rec.id} (${rec.report_year}-${rec.report_month}): prev=${newPrev}, total=${newTotal}`,
        );
      }

      carryForward = newTotal;
    }
  } catch (error) {
    console.error('[STRENGTH_SYNC] cascadeSubsequentMonths error:', error);
  }
}

export default {};
