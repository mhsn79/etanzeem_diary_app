# Report Q&A Rules & Implemented Logic

This document describes every rule and behavior implemented in the CreateReportScreen (`رپورٹ بنائیں`) for filling report Q&A.

**Source files:**
- `app/screens/(stack)/CreateReportScreen.tsx`
- `app/components/SectionList.tsx` (Question, AccordionSection)
- `app/components/AutoQuestionInput.tsx`
- `app/features/qa/qaSlice.ts`
- `app/features/qa/types.ts`
- `app/features/qa/utils.ts`
- `app/features/baitulmal/baitulmalSlice.ts`

---

## A. Question Fields (from `report_questions` table)

| Field | Type | Purpose |
|-------|------|---------|
| `id` | number | Primary key |
| `question_text` | string | Display text shown to user |
| `input_type` | string | One of: `'number'`, `'string'`, `'text'` |
| `section_id` | number | FK to `report_sections` |
| `category` | string | `'manual'` or `'auto'` |
| `highlight` | boolean | Whether to visually highlight the question (not currently used in rendering) |
| `linked_to_type` | string/null | `'contacts'`, `'activity'`, `'strength'`, or `'baitulmal'` |
| `linked_to_id` | number/null | FK to `contact_type`, `Activity_Type`, or `Strength_Type` |
| `aggregate_func` | string/null | `'count'`, `'sum'`, `'total'`, `'avg'`, `'plus'`, `'minus'`, `'array'` |
| `sort` | number/null | Display order within section |
| `status` | string | `'draft'`, `'published'`, or `'archived'` |

---

## B. Question Category Rules

### Rule 1: Auto vs Manual Detection
**File:** `utils.ts` (`isAutoQuestion`)

A question is rendered as "auto" (uses `AutoQuestionInput`) if ANY of these conditions is true:
- `linked_to_type` AND `linked_to_id` are both set (non-null/non-empty)
- `category === 'auto'` AND `aggregate_func !== null`

Otherwise it renders as "manual" (uses `FormInput` via `Question` component).

### Rule 2: Editability
**Files:** `AutoQuestionInput.tsx`, `SectionList.tsx`

| Scenario | Editable? |
|----------|-----------|
| Auto question with `category === 'manual'` | Yes (can type + has calculate button) |
| Auto question with `category === 'auto'` | No (read-only input, but calculate button works) |
| Manual question in edit/create mode | Yes |
| Any question in view mode (`mode === 'view'`) | No (all disabled) |

### Rule 3: Auto-Calculate Button Visibility
**File:** `AutoQuestionInput.tsx`

- The calculate button (right icon) is shown ONLY if both `linked_to_type` AND `linked_to_id` are set
- The button is shown even when the input is read-only (`category === 'auto'`)
- The button is disabled when `disabled` prop is true (view mode) or while calculating

---

## C. Input Type Behavior

### Rule 4: `number` input type
**File:** `SectionList.tsx`

- **Keyboard:** `numeric`
- **Validation:** Regex `/^-?\d*\.?\d*$/` — allows digits, one decimal point, leading minus sign
- **Error message:** "براہ کرم ایک درست نمبر درج کریں" (Please enter a valid number)
- **Storage:** `number_value` field in `report_answers`; empty input saves as `null`
- **Multiline:** Only for `text` input type (never for `number`)
- **Auto-save:** Debounced 500ms on valid input; no save on invalid input
- **On-blur:** Immediate save if value changed (cancels pending debounce)
- **Placeholder:** "نمبر میں جواب لکھیں"

### Rule 5: `string` input type
**File:** `SectionList.tsx`

- **Keyboard:** `default`
- **Validation:** Max 100 characters
- **Error message:** "ان پٹ بہت لمبا ہے (زیادہ سے زیادہ 100 حروف)" (Input too long, max 100 chars)
- **Storage:** `string_value` field; empty input saves as `null`
- **Multiline:** No (single line)
- **Auto-save:** Debounced 500ms; no save when over 100 chars
- **On-blur:** Immediate save if value changed
- **Placeholder:** "الفاظ میں جواب لکھیں"

### Rule 6: `text` input type
**File:** `SectionList.tsx`

- **Keyboard:** `default`
- **Validation:** None (unlimited length)
- **Storage:** `string_value` field; empty input saves as `null`
- **Multiline:** Always (3 lines minimum)
- **Auto-save:** Debounced 500ms
- **On-blur:** Immediate save if value changed
- **Placeholder:** "تفصیلی جواب لکھیں"

### Rule 7: On-blur save behavior
**File:** `SectionList.tsx`

- On-blur triggers an **immediate save** (bypasses debounce timer) if the current value differs from the last saved value
- This ensures no data is lost when user taps away from an input
- Debounced save during typing remains active (500ms delay)

---

## D. Auto-Question Calculation Rules

### Rule 8: Contacts (`linked_to_type === 'contacts'`)
**File:** `AutoQuestionInput.tsx`

**Behavior:** Always opens a popup modal (never calculates directly in background).

**API filter:** Person table filtered by `contact_type = linked_to_id` AND `Tanzeemi_Unit = currentUnitId`

| aggregate_func | Additional Filter | What popup shows |
|---|---|---|
| `plus` | `Rukinat_Date` within current reporting month (not null, >= start, <= end) | Persons whose membership date is in current month |
| `minus` | `archived_at` within current reporting month (not null, >= start, <= end) | Persons archived in current month |
| Default (count/sum/total) | `status != 'archived'` | All active persons with matching contact_type |

**OK button behavior:** Sets value = `contactsList.length` (total count of ALL fetched contacts, regardless of aggregate func)

**Notes:**
- For `plus`: Only checks `Rukinat_Date`, does NOT check `date_created`
- For `minus`: Checks `archived_at` AND requires `Tanzeemi_Unit` match

### Rule 9: Activities (`linked_to_type === 'activity'`)
**File:** `AutoQuestionInput.tsx`

**Behavior:** Always opens a popup modal.

**API filter:** Activities filtered by:
- `activity_type = linked_to_id`
- `tanzeemi_unit = currentUnitId`
- `report_month = current reporting month`
- `report_year = current reporting year`
- Does **NOT** filter by `status` (fetches draft, published, archived)

**OK button behavior:** Counts ONLY `published` activities (memoized via `publishedActivitiesCount`)

**Modal display:** Header shows "کل X سرگرمی (جمع شدہ: Y)" — total count and published count

### Rule 10: Strength (`linked_to_type === 'strength'`)
**File:** `AutoQuestionInput.tsx`

Strength records now use one record per (unit, type, year, month) with `plus_value`, `minus_value`, `previous_total`, and `new_total` fields. No popup modal is used.

| aggregate_func | Behavior | Value set |
|---|---|---|
| `plus` | Direct fetch of monthly record | `monthlyRecord.plus_value` (or 0) |
| `minus` | Direct fetch of monthly record | `monthlyRecord.minus_value` (or 0) |
| `total` / `sum` / `count` | Direct fetch of monthly record | `monthlyRecord.new_total` (or 0) |
| `avg` | Dispatches `fetchStrengthCountAndTotals` with year/month | `result.avg` |

**Monthly record filter (single record, guaranteed 0 or 1 result):**
- `Type = linked_to_id`
- `Tanzeemi_Unit = currentUnitId`
- `report_year = currentYear`
- `report_month = currentMonth`

### Rule 11: Baitulmal (`linked_to_type === 'baitulmal'`)
**File:** `AutoQuestionInput.tsx`

**Behavior:** Always opens a popup modal.

**API filter:** `baitulmal_records` filtered by:
- `Type = linked_to_id` (FK to `baitulmal_type`)
- `Tanzeemi_Unit = currentUnitId` (current unit only, NOT children)
- `report_month = current reporting month`
- `report_year = current reporting year`
- `status != 'archived'`

| aggregate_func | OK button value |
|---|---|
| `count` | `baitulmalList.length` (total count of records) |
| Default (sum/total) | Sum of all `amount` fields across records |

**Modal display:** Shows list of baitulmal records with type name, notes, and formatted amount in rupees.

**OK button text:** Shows count for `count` aggregate, or formatted sum for others.

**Navigate button:** Taps navigate to `/screens/Baitulmal` screen.

### Rule 12: Unknown `linked_to_type`
**File:** `AutoQuestionInput.tsx`

- Shows error: "نامعلوم linked_to_type"
- No calculation performed

---

## E. Answer Save Rules

### Rule 13: Manual Question Save Flow
**File:** `SectionList.tsx`

- Each `Question` component manages its **own** save independently
- Save is dispatched via `dispatch(saveAnswer(...))` directly from the Question component
- Save triggers:
  - **Typing:** Debounced 500ms
  - **Blur:** Immediate save if value changed since last save
- Answer data format:
  - `number` type → `{ submission_id, question_id, number_value: parsedNumber, string_value: null }`
  - `string`/`text` type → `{ submission_id, question_id, string_value: text, number_value: null }`
- Empty `number` input → saves as `null` (does NOT count as answered for progress)
- Empty `string`/`text` input → saves as `null`

### Rule 14: Auto Question Save Flow
**File:** `SectionList.tsx`, `AutoQuestionInput.tsx`

- When `AutoQuestionInput.onValueChange` fires, the parent `Question` component dispatches `saveAnswer`
- For auto questions with `category === 'manual'` (editable), typing is **debounced at 500ms** before triggering `onValueChange`
- On blur, any pending debounce is flushed and save fires immediately if value changed
- For calculate button results, save is dispatched **immediately** (no debounce)
- Value routing:
  - If `question.input_type === 'number'`: `number_value = Number(newValue)`, `string_value = null`
  - Otherwise: `string_value = String(newValue)`, `number_value = null`

### Rule 15: Save Path (Consolidated)

- All saves (manual and auto) go through `dispatch(saveAnswer(...))` directly from the `Question` component in `SectionList.tsx`
- No intermediate save handlers in `CreateReportScreen`

### Rule 16: API Save Logic (create vs update)
**File:** `qaSlice.ts`

1. Token refresh before every save
2. Validates: `question_id` required, at least one of `string_value`/`number_value` provided
3. Checks for existing answer: `GET /items/report_answers?filter[submission_id]=X&filter[question_id]=Y`
4. If existing answer found with matching `question_id`:
   - `PATCH /items/report_answers/{id}` with only `{ string_value, number_value }`
5. If no existing answer (or question_id mismatch):
   - `POST /items/report_answers` with `{ submission_id, question_id, string_value, number_value }`

### Rule 17: Progress Tracking
**File:** `qaSlice.ts`

- An answer counts as "answered" if: `string_value !== null OR number_value !== null`
- Section progress = `round((answered questions / total questions) * 100)`
- Progress is recalculated after `saveAnswer.fulfilled` for **only the affected section** (optimized lookup by `question_id → section_id`)
- Uses `Map<question_id, answer>` index for O(1) lookup per question
- Full recalculation for all sections on `initializeReportData.fulfilled`

---

## F. Reporting Period Rules

### Rule 18: Period Detection for Auto-Calculations
**File:** `AutoQuestionInput.tsx`

1. Finds current submission in `reportSubmissions` by matching `id === currentSubmissionId`
2. Looks up management details via `mgmt_id` from submission
3. Extracts `month` and `year` from the management record
4. **Fallback:** If management not found, uses current system date's month/year

### Rule 19: Date Range Calculation
**File:** `AutoQuestionInput.tsx`

- Start: `YYYY-MM-01`
- End: `YYYY-MM-{lastDay}` where `lastDay = new Date(year, month, 0).getDate()`
- Used for: contacts `plus`/`minus` filtering, strength records filtering

---

## G. Submission Rules

### Rule 20: Report Initialization
**File:** `CreateReportScreen.tsx`, `qaSlice.ts`

| Mode | Behavior |
|------|----------|
| Edit/View with `submissionId` | Fetches existing submission by ID directly |
| New report | Searches for existing submission matching `(template_id, unit_id, mgmt_id)`; **rejects if none found** |

**Important:** The app does NOT create new submissions. Submissions must pre-exist in the database (created by admin/backend).

### Rule 21: Report Submission
**File:** `qaSlice.ts`, `CreateReportScreen.tsx`

- If overall progress is below 70%, a **warning dialog** is shown: "رپورٹ صرف X% مکمل ہے۔ کیا آپ پھر بھی جمع کروانا چاہتے ہیں؟"
- User can choose to proceed or go back
- `PATCH /items/reports_submissions/{id}` with `{ status: 'published' }`
- On success: `currentSubmissionId` is cleared from Redux state
- Token refresh before submission
- Success dialog auto-closes after 2 seconds, then navigates back

---

## H. UI Behavior Rules

### Rule 22: Section Accordion
**File:** `SectionList.tsx`

- All sections start **CLOSED** (collapsed)
- Header shows section title (truncated at 50 chars) + progress percentage + chevron icon
- 100% complete sections: Green background (`success + 20%` opacity)
- Questions are **lazy rendered** — only mount when section is opened
- Toggling is managed per-section independently

### Rule 23: Auto-Question Button Labels & Icons
**File:** `utils.ts`, `AutoQuestionInput.tsx`

| aggregate_func | Button Text | Button Icon |
|---|---|---|
| `sum` | `کل` | `add-circle-outline` |
| `total` | `کل` | `add-circle-outline` |
| `count` | `تعداد` | `list-outline` |
| `avg` | `اوسط` | `analytics-outline` |
| `plus` | `اضافہ` | `add-circle-outline` |
| `minus` | `کمی` | `remove-circle-outline` |
| default/null | `تعداد` | `calculator-outline` |

### Rule 24: Popup Modal Behavior
**File:** `AutoQuestionInput.tsx`

- Four separate modals: Contacts, Activities, Strength Records, Baitulmal
- **Loading state:** Spinner + "لوڈ ہو رہا ہے..."
- **Error state:** Red error message
- **Empty state:** "کوئی {type} نہیں ملے/ملی"
- **Cancel button** ("منسوخ کریں"): Closes modal and clears all fetched data from state
- **OK button** ("ٹھیک ہے"): Sets calculated value, saves answer, closes modal
- OK button shows the count/value in parentheses
- Data is fetched fresh on every popup open (no caching between opens)

### Rule 25: Success/Error Feedback
**Files:** `AutoQuestionInput.tsx`, `SectionList.tsx`

- Success messages: Auto-hide after 3 seconds
- Error messages: Persist until next user action (typing or calculation)
- Save loading: Shows loading indicator on the input field during save
- Calculation loading: Shows spinner on the calculate button

### Rule 26: AutoQuestionInput Keyboard Type
**File:** `AutoQuestionInput.tsx`

- Auto questions respect the `input_type` field: `numeric` for `number`, `default` for others
- Manual questions in `SectionList` also switch keyboard based on `input_type`

---

## I. Archived Content Rules

### Rule 27: Archived Sections & Questions Filtering
**File:** `qaSlice.ts` (`initializeReportData`)

The visibility of archived sections and questions depends on the **submission status**:

| Submission Status | Sections Filter | Questions Filter |
|---|---|---|
| `published` or `submitted` | All (including archived) | All (including archived) |
| `draft` or `pending` | Exclude archived (`status != 'archived'`) | Exclude archived (`status != 'archived'`) |

**Rationale:** Published/submitted reports must show all historical answers, even if the corresponding questions or sections have since been archived. Draft reports should only show currently active questions.

**Implementation:**
```typescript
const isPublished = submission.status === 'published' || submission.status === 'submitted';
// Sections filter
const sectionsFilter = isPublished
  ? JSON.stringify({ template_id: { _eq: params.template_id } })
  : JSON.stringify({ _and: [{ template_id: { _eq: ... } }, { status: { _neq: 'archived' } }] });
// Questions filter — same pattern
```

**Answers:** Always fetched for the submission regardless of question status (no filtering on answers).

---

## J. Baitulmal Scope Rules

### Rule 28: Baitulmal Screen Unit Scope
**File:** `app/screens/(stack)/Baitulmal.tsx`

- The Baitulmal screen shows only the **currently selected unit's** records — it does NOT include children's records
- Uses `selectDashboardSelectedUnitId` with fallback to `selectUserUnitDetails`
- Records are client-side filtered by: unit ID, report month/year, archived status, and income/expense category

### Rule 29: Baitulmal Auto-Question Unit Scope
**File:** `AutoQuestionInput.tsx`

- Auto-question calculations for `linked_to_type === 'baitulmal'` also filter by `Tanzeemi_Unit = currentUnitId` (current unit only)
- This matches the Baitulmal screen behavior — only the unit's own records are counted/summed

---

## K. Data Flow Summary

```
Screen Opens
  └→ CreateReportScreen.useEffect dispatches initializeReportData()
       └→ qaSlice fetches: submission, sections, questions, answers
            └→ Normalizes into Redux state (byId + allIds)
                 └→ Calculates all section progress

User Opens Section Accordion
  └→ Questions render (lazy) via SectionList → Question component
       ├→ Manual: FormInput renders
       └→ Auto: AutoQuestionInput renders

User Types in Manual Question
  └→ handleInputChange validates input
       └→ debouncedSave (500ms) → saveAnswerToApi
            └→ dispatch(saveAnswer()) → API POST/PATCH
                 └→ qaSlice updates answers + recalculates affected section progress

User Blurs Manual Question Input
  └→ handleBlur checks if value changed
       └→ If changed: immediate save (cancels pending debounce)

User Types in Auto Question (manual category)
  └→ onChange updates local state
       └→ Debounced 500ms → onValueChange fires
            └→ Question dispatches saveAnswer

User Taps Auto-Calculate Button
  └→ handleFetchCount determines linked_to_type
       ├→ contacts: Opens popup → fetches Persons → OK → sets count
       ├→ activity: Opens popup → fetches Activities → OK → sets published count
       ├→ strength: Opens popup OR direct fetch → sets count/new_total
       └→ baitulmal: Opens popup → fetches baitulmal_records → OK → sets count or sum
            └→ onValueChange fires → Question dispatches saveAnswer
                 └→ API POST/PATCH → affected section progress update

User Taps Submit (جمع کروائیں)
  └→ Check overall progress
       ├→ < 70%: Warning dialog → user confirms or cancels
       └→ >= 70%: Confirmation dialog
            └→ handleConfirmSubmit
                 └→ dispatch(submitReport()) → PATCH status='published'
                      └→ Success dialog (2s auto-close) → navigate back
```

---

*Last updated: 2026-03-01*
