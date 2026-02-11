# E-Tanzeem Diary App - Technical Specifications

## Project Overview

**Application Name**: E-Tanzeem Diary App
**Organization**: Jamat-e-Islami Islamabad
**Version**: 1.0.0
**Platform**: React Native with Expo
**Bundle ID**: com.jiislamabad.etanzeemdiaryapp
**Owner**: jiislamabad

### Purpose
Enterprise-grade organizational management application for managing hierarchical organizational structures, member records, activities, reports, and financial data for Jamat-e-Islami Islamabad.

### Target Users
- Organizational administrators at various hierarchical levels
- Unit managers (Nazimeen)
- Member coordinators
- Report compilers

---

## Technical Architecture

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.76.9 | Core mobile framework |
| Expo | ~52.0.46 | Build and deployment platform |
| TypeScript | 5.3.3 | Type safety and development experience |
| Expo Router | ~4.0.20 | File-based navigation system |
| Redux Toolkit | 1.9.3 | State management |
| React Redux | 8.0.5 | React bindings for Redux |
| Redux Persist | 6.0.0 | State persistence |
| React Native MMKV | 2.1.0 | High-performance secure storage |

### Backend Integration

| Service | Technology | Purpose |
|---------|------------|---------|
| CMS/API | Directus 19.1.0 | Headless CMS and API backend |
| API Base URL | https://admin.jiislamabad.org | Production backend |
| Authentication | JWT with refresh tokens | Secure user authentication |
| Storage | Expo SecureStore + MMKV | Token and data persistence |

### UI/UX Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| React Native Vector Icons | 10.2.0 | Icon library |
| Expo Vector Icons | 14.0.2 | Additional icon sets |
| React Native Modal | 14.0.0-rc.1 | Modal dialogs |
| React Native Fast Image | 8.6.3 | Optimized image loading |
| React Native Responsive Screen | 1.4.2 | Responsive sizing |
| React Native Responsive Fontsize | 0.5.1 | Responsive typography |
| React Native SVG | 15.8.0 | SVG rendering |

### Additional Capabilities

| Feature | Library | Version |
|---------|---------|---------|
| Internationalization | i18n-js | 4.5.1 |
| Date Handling | dayjs | 1.11.7 |
| Image Picking | expo-image-picker | 16.0.6 |
| Push Notifications | expo-notifications | 0.29.14 |
| Haptics | expo-haptics | 14.0.1 |
| Date/Time Picker | @react-native-community/datetimepicker | 8.2.0 |
| Gestures | react-native-gesture-handler | 2.20.2 |
| Animations | react-native-reanimated | 3.16.1 |

---

## Application Architecture

### File Structure

```
etanzeem_diary_app/
├── app/
│   ├── _layout.tsx                    # Root layout with providers
│   ├── components/                    # Reusable UI components (30+)
│   │   ├── AuthGuard.tsx             # Authentication wrapper
│   │   ├── CustomButton.tsx          # Button component
│   │   ├── CustomDropdown.tsx        # Dropdown selector
│   │   ├── FormInput.tsx             # Input with validation
│   │   ├── RukunCard.tsx             # Member card display
│   │   ├── ActivityCard.tsx          # Activity card display
│   │   ├── Dialog.tsx                # Modal dialogs
│   │   ├── ProfileHeader.tsx         # User profile header
│   │   ├── TabBar.tsx                # Custom tab navigation
│   │   ├── Toast.tsx                 # Toast notifications
│   │   └── ...                       # Additional components
│   ├── constants/
│   │   ├── theme.ts                  # Colors, spacing, typography
│   │   └── urduLocalization.ts       # Urdu date/number formatting
│   ├── context/
│   │   └── LanguageContext.tsx       # Language switching context
│   ├── features/                      # Redux slices (domain-driven)
│   │   ├── activities/
│   │   │   └── activitySlice.ts      # Activity state management
│   │   ├── auth/
│   │   │   └── authSlice.ts          # Authentication state
│   │   ├── persons/
│   │   │   └── personsSlice.ts       # Member management
│   │   ├── reports/
│   │   │   └── reportsSlice_new.ts   # Report management
│   │   ├── tanzeem/
│   │   │   └── tanzeemSlice.ts       # Organizational units
│   │   ├── tanzeemHierarchy/
│   │   │   └── tanzeemHierarchySlice.ts # Unit hierarchy
│   │   ├── qa/
│   │   │   └── qaSlice.ts            # Q&A for reports
│   │   ├── strength/
│   │   │   └── strengthSlice.ts      # Workforce statistics
│   │   ├── activityTypes/
│   │   │   └── activityTypesSlice.ts # Activity type definitions
│   │   └── notifications/
│   │       └── notificationsSlice.ts # Push notifications
│   ├── models/                        # TypeScript interfaces
│   │   ├── Person.ts                 # Member/person model
│   │   ├── TanzeemiUnit.ts           # Organizational unit model
│   │   ├── Activity.ts               # Activity model
│   │   └── ...                       # Additional models
│   ├── screens/                       # Screen components
│   │   ├── (tabs)/                   # Tab-based navigation
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── Reports.tsx           # Reports listing
│   │   │   ├── Activities.tsx        # Activities listing
│   │   │   ├── Arkan.tsx            # Members listing
│   │   │   └── _layout.tsx          # Tab layout
│   │   ├── (stack)/                  # Stack screens
│   │   │   ├── ActivityScreen.tsx
│   │   │   ├── AllReportsScreen.tsx
│   │   │   ├── CreateReportScreen.tsx
│   │   │   ├── MeetingScreen.tsx
│   │   │   ├── ReportsManagementScreen.tsx
│   │   │   ├── RukanDetails.tsx
│   │   │   ├── ScheduleActivitiesScreen.tsx
│   │   │   ├── SubmittedReportScreen.tsx
│   │   │   └── components/           # Screen-specific components
│   │   ├── LoginScreen.tsx
│   │   ├── ProfileEdit.tsx
│   │   ├── ProfileView.tsx
│   │   ├── RukunAddEdit.tsx
│   │   ├── RukunUpdateScreen.tsx
│   │   ├── Income.tsx
│   │   ├── Meetings.tsx
│   │   └── Workforce.tsx
│   ├── services/                      # External services
│   │   ├── apiClient.ts              # Enhanced API client
│   │   ├── directus.ts               # Directus SDK config
│   │   └── refreshOrchestrator.ts    # Token refresh coordination
│   ├── store/
│   │   ├── index.ts                  # Store configuration
│   │   ├── mmkvStorage.ts            # MMKV storage adapter
│   │   └── middleware/               # Redux middleware
│   ├── utils/
│   │   ├── apiClient.ts              # API wrapper with token mgmt
│   │   ├── tokenRefresh.ts           # Token refresh hook
│   │   ├── imageUpload.ts            # Image upload utilities
│   │   ├── apiNormalizer.ts          # Data normalization
│   │   └── formatUnitName.ts         # Unit name formatting
│   └── i18n/
│       └── locales/
│           └── en.json               # English translations
├── assets/
│   ├── fonts/
│   │   └── JameelNooriNastaleeq.ttf # Urdu font
│   └── images/                       # App images and icons
├── android/                           # Android native code
├── ios/                              # iOS native code
├── docs/                             # Documentation
│   ├── SPECS.md                      # This file
│   ├── CLAUDE.md                     # AI assistance guidelines
│   └── USER_GUIDE_URDU.md           # Urdu user guide
└── app.json                          # Expo configuration
```

---

## State Management

### Redux Store Structure

```typescript
RootState {
  auth: AuthState
  persons: PersonsState
  activities: ActivitiesState
  tanzeem: TanzeemState
  tanzeemHierarchy: TanzeemHierarchyState
  reports: ReportsState
  qa: QAState
  strength: StrengthState
  activityTypes: ActivityTypesState
  notifications: NotificationsState
}
```

### State Persistence

Persisted slices (stored in MMKV):
- `auth` - Authentication tokens and user info
- `persons` - Member directory cache
- `activities` - Activity records
- `tanzeem` - Organizational unit data
- `tanzeemHierarchy` - Unit hierarchy
- `reports` - Report templates and submissions
- `qa` - Q&A data for reports
- `strength` - Workforce statistics

### Entity Adapter Pattern

Multiple slices use Redux Toolkit's `createEntityAdapter` for normalized state:

```typescript
// Example: personsSlice.ts
const personsAdapter = createEntityAdapter<Person>({
  selectId: (person) => person.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Normalized state shape:
{
  ids: [1, 2, 3],
  entities: {
    1: { id: 1, name: "..." },
    2: { id: 2, name: "..." },
    3: { id: 3, name: "..." }
  },
  loading: false,
  error: null
}
```

Slices using entity adapters:
- `personsSlice` - Member management
- `activitiesSlice` - Activity tracking
- `qaSlice` - Q&A sections and questions

---

## Authentication & Security

### Authentication Flow

1. **Login** ([app/features/auth/authSlice.ts](app/features/auth/authSlice.ts))
   - Email/password authentication via Directus
   - Returns access token and refresh token
   - Tokens stored in Expo SecureStore
   - User data stored in Redux + MMKV

2. **Token Refresh** ([app/utils/tokenRefresh.ts](app/utils/tokenRefresh.ts))
   - Automatic refresh when access token expires
   - Centralized refresh orchestrator prevents race conditions
   - Request queuing during refresh
   - 5-minute expiration buffer for proactive refresh
   - 10-second timeout with auto-logout fallback

3. **API Request Flow** ([app/services/apiClient.ts](app/services/apiClient.ts))
   ```typescript
   Request → Check token expiry → Refresh if needed → Add auth header → Send request
                                                     ↓
                                          If 401 → Trigger refresh → Retry request
                                                     ↓
                                          If refresh fails → Logout user
   ```

4. **Logout**
   - Clear Redux state
   - Clear MMKV storage
   - Remove tokens from SecureStore
   - Navigate to login screen

### Security Features

- **Token Storage**: Expo SecureStore (encrypted on device)
- **Data Persistence**: MMKV with encryption capability
- **Request Queuing**: Prevents multiple concurrent refresh attempts
- **Exponential Backoff**: Retry failed requests with increasing delays
- **HTTPS Only**: All API communication over HTTPS
- **Role-Based Access**: User permissions based on organizational role

### API Client Architecture

Two API client methods:

1. **`apiRequest()`** - Uses Directus SDK
   - Automatic authentication handling
   - Built-in retry logic
   - Type-safe Directus queries

2. **`directApiRequest()`** - Direct fetch wrapper
   - Custom endpoints outside Directus
   - Manual Bearer token management
   - Custom retry and timeout logic

---

## Data Models

### Person (Member)

**Database Table**: `Person`

```typescript
interface Person {
  id: number;
  status: string;                       // draft, published, archived
  sort?: number | null;

  // Personal Information
  Name?: string | null;                 // Full name (Urdu)
  Name_en?: string | null;              // Full name (English)
  Father_Name?: string | null;          // Father's name
  Date_of_birth?: string | null;        // Date of birth (timestamp)
  CNIC?: string | null;                 // National ID card number
  Gender?: string | null;               // 'm' (male) or 'f' (female), default: 'm'

  // Contact Information
  Phone_Number?: string | null;         // Primary phone number
  additional_phones?: object | null;    // JSON array of additional phone numbers
  Email?: string | null;                // Email address
  Address?: string | null;              // Full address (text)

  // Organizational
  Tanzeemi_Unit?: number | null;        // FK to Tanzeemi_Unit (assigned unit)
  contact_type?: number | null;         // FK to contact_type (rukun/umeedwar/karkun), default: 4
  Rukn_No?: number | null;              // Unique member number (for Rukun only)
  Rukinat_Date?: string | null;         // Date of Rukinat (membership confirmation)

  // Transfer Information
  Transfer_from?: string | null;        // Previous unit (if transferred)
  Transfet_to?: string | null;          // Destination unit (if transferring) [Note: typo in DB]

  // Professional Information
  Education?: string | null;            // Educational qualification
  Profession?: string | null;           // Profession/occupation

  // Additional
  notes?: string | null;                // Additional notes (text)
  archived_at?: string | null;          // Archival timestamp

  // User Association
  User_id?: string | null;              // FK to directus_users (UUID) - if person has login

  // System Fields (Directus)
  user_created?: string | null;         // UUID of creator
  date_created?: string | null;         // Creation timestamp
  user_updated?: string | null;         // UUID of last updater
  date_updated?: string | null;         // Last update timestamp
}
```

**Note**: Database field `Transfet_to` has a typo (should be `Transfer_to`).

### TanzeemiUnit (Organizational Unit)

**Database Table**: `Tanzeemi_Unit`

```typescript
interface TanzeemiUnit {
  id: number;
  status: string;                       // draft, published, archived
  sort?: number | null;

  // Basic Information
  Name: string;                         // Unit name (unique)
  Description?: string | null;          // Unit description

  // Hierarchy
  Level_id?: number | null;             // FK to Tanzeemi_Level (level definition)
  level?: number | null;                // Numeric level in hierarchy
  Parent_id?: number | null;            // FK to parent Tanzeemi_Unit (self-referencing)

  // Management
  Nazim_id?: number | null;             // FK to Person (unit leader/Nazim) - unique
  user_id?: string | null;              // FK to directus_users (UUID) - associated user

  // Computed/Virtual Fields (not in DB)
  zaili_unit_hierarchy?: TanzeemiUnit[]; // Child units (computed from Parent_id relationships)

  // System Fields (Directus)
  user_created?: string | null;         // UUID of creator
  date_created?: string | null;         // Creation timestamp
  user_updated?: string | null;         // UUID of last updater
  date_updated?: string | null;         // Last update timestamp
}
```

**Indexes**:
- `tanzeemi_unit_name_index` on `Name`

**Constraints**:
- `tanzeemi_unit_name_unique`: Name must be unique
- `tanzeemi_unit_nazim_id_unique`: Each Nazim can only lead one unit

### Activity

**Database Table**: `Activities`

```typescript
interface Activity {
  id: number;
  status: string;                       // draft, published, pending - default: 'draft'
  sort?: number | null;

  // Activity Information
  activity_type?: number | null;        // FK to Activity_Type
  activity_date_and_time?: string | null; // Activity date/time (timestamp)
  location?: string | null;             // Location name/address
  location_coordinates?: string | null; // GPS coordinates (optional)
  activity_details?: string | null;     // Activity description (text)
  activity_summary?: string | null;     // Summary after completion (text)
  attendance?: number | null;           // Number of attendees

  // Organizational Context
  tanzeemi_unit?: number | null;        // FK to Tanzeemi_Unit (which unit conducted)

  // Reporting Context
  report_month?: number | null;         // Report month (1-12), default: 1
  report_year?: number | null;          // Report year, default: 2025

  // System Fields (Directus)
  user_created?: string | null;         // UUID of creator
  date_created?: string | null;         // Creation timestamp
  user_updated?: string | null;         // UUID of last updater
  date_updated?: string | null;         // Last update timestamp
}
```

### ActivityType

**Database Table**: `Activity_Type`

```typescript
interface ActivityType {
  id: number;
  sort?: number | null;

  // Basic Information
  Name?: string | null;                 // Activity type name (unique) - e.g., تنظیمی, دعوتی, تربیت
  Name_plural?: string | null;          // Plural form of name

  // Configuration
  Level_id?: number | null;             // FK to Tanzeemi_Level (which level can use this type)
  category?: string | null;             // Category type, default: 'event'
  target?: number | null;               // Target count for this activity type
  target_duration?: string | null;      // Duration for target, default: 'monthly'

  // System Fields (Directus)
  user_created?: string | null;         // UUID of creator
  date_created?: string | null;         // Creation timestamp
  user_updated?: string | null;         // UUID of last updater
  date_updated?: string | null;         // Last update timestamp
}
```

**Constraints**:
- `activity_type_name_unique`: Name must be unique

### Report Templates & Related Tables

**Database Tables**: `report_templates`, `report_sections`, `report_questions`, `reports_mgmt`, `reports_submissions`, `report_answers`

#### report_templates

```typescript
interface ReportTemplate {
  id: number;
  sort?: number | null;

  // Template Information
  report_name: string;                  // Report name (unique)
  unit_level_id: number;                // FK to Tanzeemi_Level (which level uses this template)

  // Relations (computed)
  sections?: ReportSection[];           // Sections in this template

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

**Constraints**:
- `report_templates_report_name_unique`: Report name must be unique

#### report_sections

```typescript
interface ReportSection {
  id: number;
  status: string;                       // draft, published
  sort?: number | null;

  // Section Information
  template_id: number;                  // FK to report_templates
  section_label: string;                // Section title/label

  // Relations (computed)
  questions?: ReportQuestion[];         // Questions in this section

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

#### report_questions

```typescript
interface ReportQuestion {
  id: number;
  status: string;                       // draft, published
  sort?: number | null;

  // Question Information
  section_id: number;                   // FK to report_sections
  question_text: string;                // Question text (required)
  input_type: string;                   // Input type: 'text', 'number', 'date', etc. (required)
  category?: string | null;             // 'manual' or 'auto', default: 'manual'
  highlight?: boolean | null;           // Whether to highlight in UI

  // Auto-calculation (for computed questions)
  linked_to_type?: string | null;       // Type of linked entity (e.g., 'activity_type')
  linked_to_id?: number | null;         // ID of linked entity
  aggregate_func?: string | null;       // Aggregation function (sum, count, avg, etc.)

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

#### reports_mgmt

```typescript
interface ReportManagement {
  id: number;
  status: string;                       // draft, published
  sort?: number | null;

  // Report Period
  month: number;                        // Report month (1-12)
  year: number;                         // Report year, default: 2025
  reporting_start_date?: Date | null;   // Start date for submissions
  reporting_end_date?: Date | null;     // End date for submissions
  extended_days?: number | null;        // Extension days beyond end date

  // Template
  report_template_id: number;           // FK to report_templates

  // Statistics
  submitted_reports_count?: number | null; // Count of submissions

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

#### reports_submissions

```typescript
interface ReportSubmission {
  id: number;
  status: string;                       // draft, submitted, approved, rejected
  sort?: number | null;

  // Submission Information
  unit_id?: number | null;              // FK to Tanzeemi_Unit (submitting unit)
  template_id?: number | null;          // FK to report_templates
  mgmt_id?: number | null;              // FK to reports_mgmt (which report period)

  // Relations (computed)
  answers?: ReportAnswer[];             // Answers for this submission

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

#### report_answers

```typescript
interface ReportAnswer {
  id: number;

  // Answer Information
  submission_id: number;                // FK to reports_submissions (required)
  question_id?: number | null;          // FK to report_questions

  // Answer Values (only one should be filled based on input_type)
  number_value?: number | null;         // For numeric answers
  string_value?: string | null;         // For short text answers
  text_value?: string | null;           // For long text answers
}
```

### Contact Type

**Database Table**: `contact_type`

```typescript
interface ContactType {
  id: number;
  sort?: number | null;

  // Contact Type Information
  type?: string | null;                 // Type identifier (e.g., 'rukun', 'umeedwar', 'karkun')
  label_singular?: string | null;       // Singular label (e.g., 'رکن')
  label_plural?: string | null;         // Plural label (e.g., 'ارکان')

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

**Note**: contact_type is a lookup table defining the member categories (rukun, umeedwar, karkun).

### Tanzeemi Level

**Database Table**: `Tanzeemi_Level`

```typescript
interface TanzeemiLevel {
  id: number;
  status: string;
  sort?: number | null;

  // Level Information
  Name: string;                         // Level name (unique) - e.g., 'حلقہ', 'زون', 'شعبہ'
  Nazim_Label?: string | null;          // Label for manager at this level, default: 'ناظم'

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

**Constraints**:
- `tanzeemi_level_name_unique`: Name must be unique

### Strength Type

**Database Table**: `Strength_Type`

```typescript
interface StrengthType {
  id: number;
  sort?: number | null;

  // Type Information
  Name_Singular: string;                // Singular name (required)
  Name_Plural?: string | null;          // Plural name
  Gender?: string | null;               // 'M' or 'F', default: 'M'
  Category: string;                     // Category type, default: 'workforce'

  // Reporting Configuration
  Reporting_Unit_Level?: number | null; // FK to Tanzeemi_Level (which level reports this)

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

### Strength Records

**Database Table**: `Strength_Records`

```typescript
interface StrengthRecord {
  id: number;

  // Record Information
  Tanzeemi_Unit?: number | null;        // FK to Tanzeemi_Unit
  Type?: number | null;                 // FK to Strength_Type
  Value?: number | null;                // Change value, default: 0
  change_type?: string | null;          // 'plus' or 'minus', default: 'plus'
  new_total?: number | null;            // New total after change
  Reporting_Time?: string | null;       // Timestamp of report

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

**Indexes**:
- `strength_records_reporting_time_index` on `Reporting_Time`
- `strength_records_tanzeemi_unit_index` on `Tanzeemi_Unit`
- `strength_records_type_index` on `Type`

### Strength Targets

**Database Table**: `strength_targets`

```typescript
interface StrengthTarget {
  id: number;
  status: string;
  sort?: number | null;

  // Target Information
  unit?: number | null;                 // FK to Tanzeemi_Unit
  strength_type?: number | null;        // FK to Strength_Type
  target?: number | null;               // Target value
  target_duration?: string | null;      // Duration, default: 'monthly'

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

### Rukun Transfers

**Database Table**: `rukun_transfers`

```typescript
interface RukunTransfer {
  id: number;
  status: string;                       // draft, approved, rejected

  // Transfer Information
  contact_id?: number | null;           // FK to Person (who is being transferred)
  transfer_type?: string | null;        // 'local' or 'external', default: 'local'
  transfer_date?: Date | null;          // Date of transfer
  local_unit_id?: number | null;        // FK to Tanzeemi_Unit (destination if local)
  city_name?: string | null;            // Destination city (if external transfer)
  reason?: string | null;               // Reason for transfer (text)

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

### Rukn Update

**Database Table**: `Rukn_Update`

```typescript
interface RukunUpdate {
  id: number;
  status: string;
  sort?: number | null;

  // Update Request Information
  contact_id?: number | null;           // FK to Person (who is being updated)

  // Updated Fields (submitted by user for approval)
  Name?: string | null;
  Father_Name?: string | null;
  date_of_birth?: string | null;
  Email?: string | null;
  Address?: string | null;
  Phone_Number?: string | null;
  Additional_Phones?: string | null;
  Profession?: string | null;
  Education?: string | null;

  // System Fields (Directus)
  user_created?: string | null;
  date_created?: string | null;
  user_updated?: string | null;
  date_updated?: string | null;
}
```

**Note**: This table stores update requests that require approval before being applied to the Person record.

### Person Files

**Database Table**: `Person_files`

```typescript
interface PersonFile {
  id: number;
  Person_id?: number | null;            // FK to Person
  directus_files_id?: string | null;    // FK to directus_files (UUID)
}
```

**Note**: Junction table for many-to-many relationship between Person and files (documents, photos, etc.).

---

## Feature Specifications

### 1. Dashboard (ڈیش بورڈ)

**File**: [app/screens/(tabs)/Dashboard.tsx](app/screens/(tabs)/Dashboard.tsx)

**Features**:
- User profile header with photo and name
- Unit selection dropdown (hierarchical)
- Duration filter (last 2 weeks, month, quarter, etc.)
- Quick statistics cards:
  - Workforce count by category
  - Activity count by type
  - Report submission status
- Quick action buttons:
  - Generate report
  - Schedule activity
  - Add member
- Recent activities list
- Navigation to all sections

**State Dependencies**:
- `auth` - User information
- `tanzeem` - Current unit selection
- `tanzeemHierarchy` - Unit hierarchy for selector
- `strength` - Workforce statistics
- `activities` - Activity counts
- `reports` - Report status

### 2. Member Management (ارکان)

**File**: [app/screens/(tabs)/Arkan.tsx](app/screens/(tabs)/Arkan.tsx)

**Features**:
- Member list with search and filter
- Filter by:
  - Contact type (rukun, umeedwar, karkun)
  - Address
  - Phone number
  - Name
- Member card display with:
  - Profile photo
  - Name and contact type
  - Phone number
  - Address
  - Quick action buttons
- Add new member button
- Pull-to-refresh
- Infinite scroll/pagination

**Member Details Screen**:
**File**: [app/screens/(stack)/RukanDetails.tsx](app/screens/(stack)/RukanDetails.tsx)

- Complete member information display
- Edit member button
- Transfer member to another unit
- Contact actions (call, WhatsApp, email)
- Activity history
- Report participation

**Add/Edit Member Screen**:
**File**: [app/screens/RukanAddEdit.tsx](app/screens/RukanAddEdit.tsx)

- Form with validation
- Fields:
  - Name (required)
  - CNIC
  - Date of birth
  - Contact type (required)
  - Phone number
  - WhatsApp enabled
  - SMS enabled
  - Email
  - Address
  - Education
  - Profession
  - Unit assignment
- Profile photo upload
- Save/Update button

**State Dependencies**:
- `persons` - Member directory
- `tanzeem` - Unit information

### 3. Activities Management (سرگرمیاں)

**File**: [app/screens/(tabs)/Activities.tsx](app/screens/(tabs)/Activities.tsx)

**Features**:
- Activity list with filters
- Filter by:
  - Activity type (تنظیمی, دعوتی, تربیت)
  - Date range
  - Status (draft, published, pending)
- Activity count feature (auto-count matching activities)
- Schedule new activity button
- Report completed activity button
- Activity card with:
  - Activity type icon
  - Title/summary
  - Date and time
  - Location
  - Attendance count
  - Status badge

**Schedule Activity Screen**:
**File**: [app/screens/(stack)/ScheduleActivitiesScreen.tsx](app/screens/(stack)/ScheduleActivitiesScreen.tsx)

- Activity type selector
- Date and time picker
- Location input
- Activity details (description)
- Expected attendance
- Save as draft or publish

**Activity Details Screen**:
**File**: [app/screens/(stack)/ActivityScreen.tsx](app/screens/(stack)/ActivityScreen.tsx)

- Full activity information
- Edit activity
- Mark as completed
- Add attendance count
- Add activity summary
- Photo upload

**State Dependencies**:
- `activities` - Activity records
- `activityTypes` - Activity type definitions
- `tanzeem` - Unit context

### 4. Reports System (رپورٹس)

**File**: [app/screens/(tabs)/Reports.tsx](app/screens/(tabs)/Reports.tsx)

**Features**:
- Report templates list
- Filter by:
  - Time period
  - Status (pending, submitted, approved)
  - Unit level
- Report card with:
  - Template title
  - Due date
  - Submission status
  - Progress indicator
- Create new report button
- View submitted reports

**Create Report Screen**:
**File**: [app/screens/(stack)/CreateReportScreen.tsx](app/screens/(stack)/CreateReportScreen.tsx)

- Dynamic form based on template
- Q&A sections
- Question types:
  - Text input
  - Number input
  - Date picker
  - Dropdown selection
- Progress tracking
- Save draft
- Submit report
- Validation

**Reports Management Screen**:
**File**: [app/screens/(stack)/ReportsManagementScreen.tsx](app/screens/(stack)/ReportsManagementScreen.tsx)

- Manage report templates (admin)
- Assign templates to units
- Set due dates
- Review submissions
- Approve/reject reports

**Submitted Report Screen**:
**File**: [app/screens/(stack)/SubmittedReportScreen.tsx](app/screens/(stack)/SubmittedReportScreen.tsx)

- Read-only view of submitted report
- All Q&A responses
- Submission timestamp
- Approval status
- Comments/feedback

**State Dependencies**:
- `reports` - Report templates and submissions
- `qa` - Q&A sections, questions, and answers
- `tanzeem` - Unit context

### 5. Workforce Management (افرادی قوت)

**File**: [app/screens/Workforce.tsx](app/screens/Workforce.tsx)

**Features**:
- Workforce statistics dashboard
- Category breakdown:
  - Rukun (ارکان)
  - Umeedwar (امیدوار)
  - Karkun (کارکن)
- Metrics:
  - Current count
  - Target count
  - Increase/decrease
  - Percentage achievement
- Visual charts and graphs
- Filter by time period
- Export functionality

**State Dependencies**:
- `strength` - Workforce records
- `tanzeem` - Unit context

### 6. Financial Management (آمدنی)

**File**: [app/screens/Income.tsx](app/screens/Income.tsx)

**Features**:
- Income tracking
- Expense tracking
- Financial reports
- Category-wise breakdown
- Time period filters
- Add income/expense entries
- Financial summary cards

### 7. Meetings Management (جلسے)

**File**: [app/screens/Meetings.tsx](app/screens/Meetings.tsx)

**Features**:
- Meeting list
- Schedule new meeting
- Meeting details:
  - Date and time
  - Location
  - Agenda
  - Participants
  - Meeting type
- Attendance tracking
- Meeting minutes/summary
- Follow-up actions

**Meeting Screen**:
**File**: [app/screens/(stack)/MeetingScreen.tsx](app/screens/(stack)/MeetingScreen.tsx)

- Meeting details form
- Participant selection
- Attendance marking
- Meeting report
- Photo upload

---

## UI/UX Specifications

### Urdu Language & RTL Support

**Language Context**: [app/context/LanguageContext.tsx](app/context/LanguageContext.tsx)

- Default language: Urdu (`ur`)
- Fallback: English (`en`)
- RTL layout enabled when Urdu is active
- Dynamic text direction switching

**Urdu Font**:
- Font: JameelNooriNastaleeq
- Font file: [assets/fonts/JameelNooriNastaleeq.ttf](assets/fonts/JameelNooriNastaleeq.ttf)
- Loaded via expo-font plugin

**Urdu Utilities**: [app/constants/urduLocalization.ts](app/constants/urduLocalization.ts)

```typescript
// Urdu months
urduMonths = ['جنوری', 'فروری', 'مارچ', ...]

// Urdu weekdays
urduWeekdays = ['اتوار', 'پیر', 'منگل', ...]

// Number conversion
convertToUrduDigits(123) // ۱۲۳

// Date formatting
formatUrduDate(date) // "۱۵ جنوری ۲۰۲۴"
```

### Theme System

**File**: [app/constants/theme.ts](app/constants/theme.ts)

```typescript
export const COLORS = {
  primary: '#008CFF',      // Primary brand color
  secondary: '#4CAF50',    // Secondary actions
  background: '#F5F5F5',   // App background
  surface: '#FFFFFF',      // Card/surface background
  error: '#F44336',        // Error states
  warning: '#FF9800',      // Warning states
  success: '#4CAF50',      // Success states
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
  },
  // Member type colors
  rukun: '#2196F3',
  umeedwar: '#FF9800',
  karkun: '#4CAF50',
  // Activity type colors
  tanzeemi: '#9C27B0',
  daawati: '#FF5722',
  tarbiyat: '#00BCD4',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' },
  small: { fontSize: 12, fontWeight: 'normal' },
};
```

### Component Library

**Reusable Components**: [app/components/](app/components/)

1. **FormInput** - Text input with validation
   - Props: label, value, onChangeText, error, placeholder, multiline, etc.
   - Urdu text support
   - Error message display
   - Icon support

2. **CustomButton** - Styled button component
   - Variants: primary, secondary, outline, text
   - Loading state
   - Disabled state
   - Icon support
   - Haptic feedback

3. **CustomDropdown** - Dropdown selector
   - Urdu label support
   - Search functionality
   - Multi-select option
   - Custom item rendering

4. **RukunCard** - Member card display
   - Profile photo
   - Name and contact type badge
   - Contact information
   - Quick actions
   - Responsive layout

5. **ActivityCard** - Activity card display
   - Activity type icon and badge
   - Title and summary
   - Date, time, location
   - Attendance count
   - Status indicator

6. **Dialog** - Modal dialog
   - Title and message
   - Action buttons
   - Custom content support
   - Backdrop dismiss

7. **Toast** - Toast notification
   - Success, error, warning, info types
   - Auto-dismiss timer
   - Swipe to dismiss
   - Queue management

8. **ProfileHeader** - User profile header
   - Profile photo
   - Name and role
   - Unit information
   - Navigation actions

9. **TabBar** - Custom tab navigation
   - Urdu labels
   - Icon + text
   - Active state indicator
   - Badge support

10. **ProgressModal** - Progress indicator
    - Loading spinner
    - Progress message
    - Cancellable option

### Responsive Design

**Screen Sizes**: Uses `react-native-responsive-screen`

```typescript
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Usage
width: wp('90%')  // 90% of screen width
height: hp('10%') // 10% of screen height
```

**Font Sizes**: Uses `react-native-responsive-fontsize`

```typescript
import { RFValue } from 'react-native-responsive-fontsize';

// Usage
fontSize: RFValue(16) // Scales based on device
```

---

## Navigation Structure

### Expo Router File-Based Navigation

**Root Layout**: [app/_layout.tsx](app/_layout.tsx)

- Redux Provider
- Language Context Provider
- Font loading
- Authentication check
- Initial route redirect

### Tab Navigation

**File**: [app/screens/(tabs)/_layout.tsx](app/screens/(tabs)/_layout.tsx)

Tabs:
1. **Dashboard** (`/`) - [app/screens/(tabs)/Dashboard.tsx](app/screens/(tabs)/Dashboard.tsx)
2. **Reports** (`/reports`) - [app/screens/(tabs)/Reports.tsx](app/screens/(tabs)/Reports.tsx)
3. **Activities** (`/activities`) - [app/screens/(tabs)/Activities.tsx](app/screens/(tabs)/Activities.tsx)
4. **Arkan** (`/arkan`) - [app/screens/(tabs)/Arkan.tsx](app/screens/(tabs)/Arkan.tsx)

### Stack Navigation

**Stack Screens**: [app/screens/(stack)/](app/screens/(stack)/)

- Activity details
- Report creation
- Member details
- Submitted reports
- Meeting details
- Reports management
- Schedule activities

### Authentication Flow

```
App Launch → Check auth token → Valid? → Dashboard
                                       ↓ Invalid
                                Login Screen → Authenticate → Dashboard
```

**Auth Guard**: [app/components/AuthGuard.tsx](app/components/AuthGuard.tsx)

- Wraps protected routes
- Redirects to login if not authenticated
- Handles token refresh

---

## Performance Optimizations

### Redux Performance

1. **Normalized State** with Entity Adapters
   - O(1) lookups by ID
   - Efficient updates
   - Memoized selectors

2. **Memoized Selectors**
   ```typescript
   // Use createSelector for derived state
   const selectFilteredPersons = createSelector(
     [selectAllPersons, selectFilters],
     (persons, filters) => persons.filter(/* ... */)
   );
   ```

3. **State Persistence**
   - MMKV (fastest key-value storage)
   - Selective persistence (only necessary slices)
   - Debounced writes

### API Performance

1. **Request Deduplication**
   - Centralized token refresh prevents duplicate refresh calls
   - Request queuing during authentication

2. **Retry Logic**
   - Exponential backoff for failed requests
   - Maximum retry attempts (2)
   - Network error handling

3. **Caching**
   - Redux state acts as cache
   - MMKV persistence for offline access
   - Pull-to-refresh for manual updates

### Image Performance

1. **Fast Image**
   - Uses `react-native-fast-image`
   - Image caching
   - Priority-based loading

2. **Image Upload**
   - Image compression before upload
   - Progress tracking
   - Error handling

### List Performance

1. **FlatList Optimization**
   ```typescript
   <FlatList
     data={items}
     keyExtractor={(item) => item.id.toString()}
     getItemLayout={(data, index) => ({
       length: ITEM_HEIGHT,
       offset: ITEM_HEIGHT * index,
       index,
     })}
     removeClippedSubviews={true}
     maxToRenderPerBatch={10}
     windowSize={5}
   />
   ```

2. **Pagination**
   - Load items in batches
   - Infinite scroll
   - Pull-to-refresh

---

## API Integration

### Directus Integration

**Configuration**: [app/services/directus.ts](app/services/directus.ts)

```typescript
import { createDirectus, rest, authentication } from '@directus/sdk';

const client = createDirectus('https://admin.jiislamabad.org')
  .with(rest())
  .with(authentication('json', { credentials: 'include' }));
```

### API Client Methods

**File**: [app/services/apiClient.ts](app/services/apiClient.ts)

1. **apiRequest()** - Directus SDK wrapper
   ```typescript
   async function apiRequest<T>(
     requestFn: (client: DirectusClient) => Promise<T>,
     options?: {
       retries?: number;
       timeout?: number;
     }
   ): Promise<T>
   ```

2. **directApiRequest()** - Direct fetch wrapper
   ```typescript
   async function directApiRequest<T>(
     endpoint: string,
     options?: RequestInit & {
       retries?: number;
       timeout?: number;
     }
   ): Promise<T>
   ```

### Token Refresh Hook

**File**: [app/utils/tokenRefresh.ts](app/utils/tokenRefresh.ts)

```typescript
import { useTokenRefresh } from '@/utils/tokenRefresh';

// In component
const { isRefreshing, refreshError } = useTokenRefresh();
```

**Centralized Orchestrator**: [app/services/refreshOrchestrator.ts](app/services/refreshOrchestrator.ts)

- Ensures single refresh at a time
- Queues pending requests during refresh
- Handles refresh failures gracefully

---

## Testing Strategy

### Unit Testing

**Framework**: Jest with jest-expo

**Test Files Pattern**: `*.test.ts` or `*.spec.ts`

**Example Test**:
```typescript
import { formatUrduDate } from '@/constants/urduLocalization';

describe('Urdu Localization', () => {
  it('formats date in Urdu', () => {
    const date = new Date('2024-01-15');
    const formatted = formatUrduDate(date);
    expect(formatted).toContain('جنوری');
  });
});
```

### Integration Testing

- Test Redux async thunks
- Test API client methods
- Test navigation flows

### E2E Testing (Recommended)

- Use Detox or Maestro
- Test critical user flows:
  - Login/logout
  - Add member
  - Schedule activity
  - Submit report

---

## Build & Deployment

### Development

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Android Build

```bash
# Clean build
npm run android:clean

# Release build
npm run android:build
```

### EAS Build (Expo Application Services)

**EAS Project ID**: c94ec490-9e85-465c-bc59-cc7825b5312a

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Environment Variables

**File**: [app.json](app.json) - `extra` section

```json
{
  "extra": {
    "EXPO_PUBLIC_API_BASE_URL": "https://admin.jiislamabad.org"
  }
}
```

Access in code:
```typescript
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL;
```

---

## Security Considerations

### Data Protection

1. **Sensitive Data Storage**
   - Tokens in Expo SecureStore (encrypted)
   - User data in MMKV (can be encrypted)
   - Never store passwords

2. **API Security**
   - HTTPS only
   - Bearer token authentication
   - Token expiration and refresh
   - Request timeout (10 seconds)

3. **Input Validation**
   - Validate all user inputs
   - Sanitize data before API calls
   - TypeScript for type safety

### ProGuard Rules (Android)

**File**: [android/app/proguard-rules.pro](android/app/proguard-rules.pro)

- Minification enabled for release builds
- Obfuscation of code
- Removal of unused code

### iOS Security

- App Transport Security (ATS) enabled
- Certificate pinning (recommended for production)

---

## Known Issues & Technical Debt

### Current Issues

1. **Login Screen Flickering** (Recently fixed)
   - Issue: Screen flickers on auth state changes
   - Solution: Optimized auth checks and loading states

2. **Token Refresh Race Conditions** (Recently fixed)
   - Issue: Multiple refresh calls simultaneously
   - Solution: Centralized refresh orchestrator

3. **Deleted Contacts Cleanup** (Recently fixed)
   - Issue: Deleted contacts still appearing
   - Solution: Proper entity removal in Redux

### Technical Debt

1. **Report Slice Migration**
   - `reportsSlice_new.ts` suggests old version exists
   - TODO: Remove old slice after migration complete

2. **Code Duplication**
   - Some screen components have duplicated logic
   - Opportunity: Extract shared logic to custom hooks

3. **Type Safety**
   - Some `any` types in API responses
   - Opportunity: Generate types from Directus schema

4. **Testing Coverage**
   - Limited test coverage
   - Opportunity: Add unit and integration tests

5. **Error Handling**
   - Inconsistent error message display
   - Opportunity: Centralized error handling

---

## Future Enhancements

### Planned Features

1. **Offline-First Architecture**
   - Full offline support with sync
   - Conflict resolution
   - Background sync

2. **Advanced Analytics**
   - Dashboard with charts and graphs
   - Trend analysis
   - Predictive insights

3. **Push Notification Enhancements**
   - In-app notifications
   - Notification preferences
   - Rich notifications with actions

4. **File Attachments**
   - Attach documents to reports
   - Photo galleries for activities
   - File preview and download

5. **Real-time Collaboration**
   - Real-time updates via WebSocket
   - Collaborative report editing
   - Live activity tracking

6. **Export & Sharing**
   - Export reports to PDF
   - Share via WhatsApp/Email
   - Print-friendly formats

7. **Advanced Search**
   - Full-text search across all data
   - Filters and saved searches
   - Search history

8. **Multi-language Support**
   - Add English language option
   - Language switching in settings
   - Bilingual content support

### Performance Improvements

1. **Code Splitting**
   - Lazy load screens
   - Dynamic imports
   - Reduce initial bundle size

2. **Image Optimization**
   - WebP format support
   - Lazy loading images
   - Thumbnail generation

3. **Database Optimization**
   - IndexedDB for web
   - SQLite for mobile (alternative to MMKV)
   - Query optimization

---

## Maintenance Guidelines

### Code Style

- Follow TypeScript best practices
- Use ESLint for linting
- Consistent naming conventions:
  - Components: PascalCase
  - Files: PascalCase for components, camelCase for utilities
  - Variables: camelCase
  - Constants: UPPER_SNAKE_CASE

### Git Workflow

- Main branch: `main`
- Feature branches: `feature/feature-name`
- Bug fixes: `bugfix/issue-description`
- Commit messages: Descriptive and concise

### Documentation

- Update SPECS.md when adding features
- Update CLAUDE.md with new patterns
- Comment complex logic
- Keep README.md current

### Dependencies

- Regular dependency updates
- Security vulnerability scanning
- Test after updates
- Review changelogs before upgrading

---

## Support & Resources

### Documentation

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [Directus Docs](https://docs.directus.io/)

### Project Resources

- Backend Admin: https://admin.jiislamabad.org
- EAS Project: jiislamabad/e-tanzeem-diary

### Contact

For technical support or questions, contact the development team.

---

**Last Updated**: 2026-02-11
**Version**: 1.0.0
**Status**: Production
