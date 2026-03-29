# E-Tanzeem Diary App - AI Assistant Guidelines

This document provides comprehensive guidelines for AI assistants (like Claude) working on the E-Tanzeem Diary App codebase. It contains patterns, conventions, and best practices specific to this project.

---

## Project Context

**Application**: E-Tanzeem Diary App - Organizational management for Jamat-e-Islami Pakistan
**Stack**: React Native 0.76.9 + Expo 52 + TypeScript 5.3.3 + Redux Toolkit
**Backend**: Directus CMS at https://admin.jiislamabad.org
**Primary Language**: Urdu with RTL support
**Platform**: iOS and Android

### Sister projects (monorepo)

This repository shares a Directus + PostgreSQL backend with other apps in the same tree:

- **`E-Tanzeem-Dashboard/`** — Next.js admin analytics and panel. **Use this for all new web admin and dashboard development.**
- **`E-Tanzeem-Admin-Frontend/`** — Older react-admin UI. **Obsolete — read-only reference** for field mappings, `dataProvider` / resource patterns, and legacy behavior when porting features to the Dashboard. Do not treat it as a target for new production work.

Repo-wide context: [`../AGENTS.md`](../AGENTS.md). Dashboard-focused notes: [`../CLAUDE.md`](../CLAUDE.md) and [`../E-Tanzeem-Dashboard/CLAUDE.md`](../E-Tanzeem-Dashboard/CLAUDE.md).

### Key Characteristics
- Enterprise-grade organizational management application
- Hierarchical organizational structure (Tanzeem units)
- Three member categories: Rukun (ارکان), Umeedwar (امیدوار), Karkun (کارکن)
- Three activity types: Tanzeemi (تنظیمی), Daawati (دعوتی), Tarbiyat (تربیت)
- Complete Urdu localization with JameelNooriNastaleeq font
- RTL (Right-to-Left) layout support
- Offline-capable with MMKV storage
- Token-based authentication with automatic refresh

---

## File Structure Conventions

### Directory Organization

```
app/
├── components/          # Reusable UI components (shared across screens)
├── constants/           # Theme, colors, Urdu localization utilities
├── context/             # React Context (LanguageContext)
├── features/            # Redux slices (domain-driven organization)
│   ├── auth/
│   ├── persons/         # Member management
│   ├── activities/
│   ├── reports/
│   ├── tanzeem/         # Organizational units
│   ├── tanzeemHierarchy/
│   ├── qa/              # Q&A for reports
│   ├── strength/        # Workforce statistics
│   ├── baitulmal/       # Financial records (income/expense)
│   ├── activityTypes/
│   └── notifications/
├── models/              # TypeScript interfaces and types
├── screens/             # Screen components
│   ├── (tabs)/         # Tab navigation screens
│   ├── (stack)/        # Stack navigation screens
│   └── *.tsx           # Other screens (Login, Profile, etc.)
├── services/            # API clients and external services
├── store/               # Redux store configuration
├── utils/               # Utility functions and helpers
└── i18n/                # Internationalization
```

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `CustomButton.tsx`, `RukunCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `apiClient.ts`, `formatUnitName.ts`)
- Redux slices: `camelCase + Slice.ts` (e.g., `personsSlice.ts`, `authSlice.ts`)
- Models: `PascalCase.ts` (e.g., `Person.ts`, `TanzeemiUnit.ts`)

**Code**:
- Components: `PascalCase` (e.g., `CustomButton`, `FormInput`)
- Functions: `camelCase` (e.g., `formatUrduDate`, `apiRequest`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `COLORS`, `API_BASE_URL`)
- Types/Interfaces: `PascalCase` (e.g., `Person`, `Activity`, `RootState`)
- Props interfaces: `ComponentNameProps` (e.g., `FormInputProps`)

---

## Database Schema & Field Naming Conventions

**Canonical reference:** [`datamodel.sql`](datamodel.sql) in this app directory — PostgreSQL `CREATE TABLE` definitions for tables and **exact column names** (use it when unsure of spelling, casing, or types). This document summarizes common fields; `datamodel.sql` is authoritative for the full datamodel.

### Critical: Database Field Naming

**The Directus backend database uses PascalCase for most field names**, which differs from typical JavaScript/TypeScript conventions.

#### Common Field Names (Database → TypeScript)

**Person Table** (`Person`):
- `Name` - Full name (Urdu)
- `Name_en` - Full name (English)
- `Father_Name` - Father's name
- `Date_of_birth` - Date of birth
- `CNIC` - National ID card number
- `Gender` - Gender ('m' or 'f')
- `Phone_Number` - Primary phone
- `Email` - Email address
- `Address` - Full address
- `Tanzeemi_Unit` - FK to organizational unit (NOT `unit`)
- `contact_type` - FK to contact_type table (NOT a string like 'rukun')
- `Rukn_No` - Unique member number
- `Rukinat_Date` - Membership date
- `Transfer_from` - Previous unit
- `Transfet_to` - Destination unit (**Note: typo in DB!**)
- `Education` - Educational qualification
- `Profession` - Profession/occupation
- `User_id` - FK to directus_users (UUID)
- `additional_phones` - JSON array of phones
- `notes` - Additional notes
- `archived_at` - Archival timestamp

**Tanzeemi_Unit Table** (`Tanzeemi_Unit`):
- `Name` - Unit name (unique)
- `Description` - Unit description
- `Level_id` - FK to Tanzeemi_Level
- `level` - Numeric level
- `Parent_id` - FK to parent unit
- `Nazim_id` - FK to Person (unit leader)
- `user_id` - FK to directus_users

**Activities Table** (`Activities`):
- `activity_type` - FK to Activity_Type
- `activity_date_and_time` - Activity timestamp
- `location` - Location name
- `location_coordinates` - GPS coordinates
- `activity_details` - Description
- `activity_summary` - Summary
- `attendance` - Attendee count
- `tanzeemi_unit` - FK to Tanzeemi_Unit
- `report_month` - Month (1-12)
- `report_year` - Year

**Activity_Type Table** (`Activity_Type`):
- `Name` - Activity type name (unique)
- `Name_plural` - Plural form
- `Level_id` - FK to Tanzeemi_Level
- `category` - Category type
- `target` - Target count
- `target_duration` - Duration for target

**Tanzeemi_Level Table** (`Tanzeemi_Level`):
- `Name` - Level name (unique)
- `Nazim_Label` - Label for manager

**contact_type Table** (`contact_type`):
- `type` - Type identifier ('rukun', 'umeedwar', 'karkun')
- `label_singular` - Singular label ('رکن')
- `label_plural` - Plural label ('ارکان')

**Strength_Type Table** (`Strength_Type`):
- `Name_Singular` - Singular name
- `Name_Plural` - Plural name
- `Gender` - 'M' or 'F'
- `Category` - Category type
- `Reporting_Unit_Level` - FK to Tanzeemi_Level

**baitulmal_type Table** (`baitulmal_type`):
- `Name` - Type name (Urdu)
- `Name_en` - Type name (English)
- `main_category` - `'income'` or `'expense'`
- `Reporting_Unit_Level` - FK to Tanzeemi_Level

**baitulmal_records Table** (`baitulmal_records`):
- `Tanzeemi_Unit` - FK to Tanzeemi_Unit
- `Type` - FK to baitulmal_type
- `amount` - Amount (integer, default 0)
- `notes` - Optional notes
- `report_year` - Year
- `report_month` - Month (1-12)

**Strength_Records Table** (`Strength_Records`):
- `Tanzeemi_Unit` - FK to unit
- `Type` - FK to Strength_Type
- `plus_value` - Monthly increase (اضافہ)
- `minus_value` - Monthly decrease (کمی)
- `previous_total` - Total at start of month (carried forward)
- `new_total` - = previous_total + plus_value - minus_value
- `report_year` - Year (e.g. 2026)
- `report_month` - Month (1-12)
- `notes` - Optional comments/notes
- UNIQUE constraint on (Tanzeemi_Unit, Type, report_year, report_month)

### Directus Collection Names

Collections in Directus match table names exactly:
- `Person` (NOT `persons` or `people`)
- `Tanzeemi_Unit` (NOT `tanzeemi_units`)
- `Activities` (plural)
- `Activity_Type` (singular with underscore)
- `Tanzeemi_Level`
- `contact_type` (lowercase with underscore)
- `Strength_Type`
- `Strength_Records`
- `report_templates` (lowercase with underscore)
- `report_sections`
- `report_questions`
- `reports_mgmt`
- `reports_submissions`
- `report_answers`
- `rukun_transfers`
- `strength_targets`
- `baitulmal_type`
- `baitulmal_records`

### Important Notes

1. **PascalCase Fields**: Most custom fields use PascalCase (e.g., `Name`, `Phone_Number`, `Tanzeemi_Unit`)
2. **System Fields**: Directus system fields use snake_case (e.g., `user_created`, `date_created`, `date_updated`)
3. **Database Typo**: `Transfet_to` has a typo (should be `Transfer_to`) - handle carefully in code
4. **Contact Type**: `contact_type` field in Person is an **integer FK**, not a string
5. **UUID Fields**: User-related FKs are UUIDs (e.g., `User_id`, `user_created`), not integers
6. **JSON Fields**: `additional_phones` in Person and `tags` in directus_users are JSON types

### When Writing API Queries

Always use exact database field names:

```typescript
// CORRECT
await apiRequest((client) =>
  client.request(readItems('Person', {
    fields: ['id', 'Name', 'Phone_Number', 'Tanzeemi_Unit', 'contact_type'],
    filter: { status: { _eq: 'published' } }
  }))
);

// INCORRECT - will fail
await apiRequest((client) =>
  client.request(readItems('Person', {
    fields: ['id', 'name', 'phone', 'unit', 'contact_type'],  // Wrong field names!
  }))
);
```

---

## Redux Patterns

### State Management Architecture

This project uses **Redux Toolkit** with a **domain-driven slice organization**.

### Creating a New Redux Slice

**Pattern**: Use `createSlice` with entity adapters for collections.

**File Location**: `app/features/{domain}/{domain}Slice.ts`

**Template**:

```typescript
import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { apiRequest } from '@/services/apiClient';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

// 1. Define the entity type (or import from models/)
interface MyEntity {
  id: number;
  Name: string;  // Note: Database uses PascalCase for most fields
  // ... other fields
}

// 2. Create entity adapter
const myEntityAdapter = createEntityAdapter<MyEntity>({
  selectId: (entity) => entity.id,
  sortComparer: (a, b) => a.Name.localeCompare(b.Name), // Optional sorting
});

// 3. Define initial state
interface MyEntityState {
  loading: boolean;
  error: string | null;
  // Additional state fields as needed
}

const initialState = myEntityAdapter.getInitialState<MyEntityState>({
  loading: false,
  error: null,
});

// 4. Create async thunks for API operations
export const fetchMyEntities = createAsyncThunk(
  'myEntity/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest((client) =>
        client.request(readItems('my_collection', {
          fields: ['*'],
          limit: -1, // Get all items
        }))
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch entities');
    }
  }
);

export const createMyEntity = createAsyncThunk(
  'myEntity/create',
  async (entity: Partial<MyEntity>, { rejectWithValue }) => {
    try {
      // Note: Directus collection names match table names (often PascalCase)
      const data = await apiRequest((client) =>
        client.request(createItem('My_Collection', entity))
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create entity');
    }
  }
);

export const updateMyEntity = createAsyncThunk(
  'myEntity/update',
  async ({ id, updates }: { id: number; updates: Partial<MyEntity> }, { rejectWithValue }) => {
    try {
      const data = await apiRequest((client) =>
        client.request(updateItem('my_collection', id, updates))
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update entity');
    }
  }
);

export const deleteMyEntity = createAsyncThunk(
  'myEntity/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiRequest((client) =>
        client.request(deleteItem('my_collection', id))
      );
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete entity');
    }
  }
);

// 5. Create slice
const myEntitySlice = createSlice({
  name: 'myEntity',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchMyEntities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMyEntities.fulfilled, (state, action) => {
      state.loading = false;
      myEntityAdapter.setAll(state, action.payload);
    });
    builder.addCase(fetchMyEntities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create
    builder.addCase(createMyEntity.fulfilled, (state, action) => {
      myEntityAdapter.addOne(state, action.payload);
    });

    // Update
    builder.addCase(updateMyEntity.fulfilled, (state, action) => {
      myEntityAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
    });

    // Delete
    builder.addCase(deleteMyEntity.fulfilled, (state, action) => {
      myEntityAdapter.removeOne(state, action.payload);
    });
  },
});

// 6. Export actions
export const { clearError } = myEntitySlice.actions;

// 7. Export entity selectors
export const {
  selectAll: selectAllMyEntities,
  selectById: selectMyEntityById,
  selectIds: selectMyEntityIds,
} = myEntityAdapter.getSelectors((state: RootState) => state.myEntity);

// 8. Export custom selectors
export const selectMyEntitiesLoading = (state: RootState) => state.myEntity.loading;
export const selectMyEntitiesError = (state: RootState) => state.myEntity.error;

// 9. Export reducer
export default myEntitySlice.reducer;
```

### Best Practices for Redux

1. **Always use entity adapters for collections**
   - Provides normalized state structure
   - Automatic ID-based lookups (O(1))
   - Built-in CRUD selectors

2. **Async thunks for all API calls**
   - Consistent error handling
   - Automatic loading states
   - Type-safe with TypeScript

3. **Use rejectWithValue for errors**
   - Allows custom error payloads
   - Accessible in rejected action handlers

4. **Memoized selectors for derived state**
   ```typescript
   import { createSelector } from '@reduxjs/toolkit';

   export const selectFilteredEntities = createSelector(
     [selectAllMyEntities, (state: RootState, filter: string) => filter],
     (entities, filter) => entities.filter(e => e.name.includes(filter))
   );
   ```

5. **Keep slices focused**
   - One slice per domain/feature
   - Don't mix concerns
   - Use separate slices for related but distinct data

### Adding a Slice to the Store

**File**: [app/store/index.ts](app/store/index.ts)

```typescript
import myEntityReducer from '@/features/myEntity/myEntitySlice';

const rootReducer = combineReducers({
  // ... existing reducers
  myEntity: myEntityReducer,
});

// Add to persistConfig if needed
const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['auth', 'myEntity'], // Add to persist
};
```

---

## Component Patterns

### Functional Components with TypeScript

**Always use functional components with TypeScript interfaces for props.**

**Template**:

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  // ... other props
}

const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  title: {
    ...TYPOGRAPHY.body,
    color: COLORS.surface,
  },
});

export default MyComponent;
```

### Screen Component Pattern

**Screens should follow this structure:**

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyEntities, selectAllMyEntities, selectMyEntitiesLoading } from '@/features/myEntity/myEntitySlice';
import MyEntityCard from '@/components/MyEntityCard';
import { COLORS, SPACING } from '@/constants/theme';

const MyScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const entities = useAppSelector(selectAllMyEntities);
  const loading = useAppSelector(selectMyEntitiesLoading);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchMyEntities());
  }, [dispatch]);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyEntities());
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={entities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MyEntityCard entity={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
});

export default MyScreen;
```

### Component Best Practices

1. **Use typed Redux hooks**
   ```typescript
   import { useAppDispatch, useAppSelector } from '@/store/hooks';
   // NOT: import { useDispatch, useSelector } from 'react-redux';
   ```

2. **Destructure props in function signature**
   ```typescript
   const MyComponent: React.FC<Props> = ({ title, onPress }) => {
     // Good
   };
   ```

3. **Use StyleSheet.create for styles**
   - Better performance
   - Type checking for style props
   - Consistent pattern

4. **Import theme constants**
   ```typescript
   import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
   ```

5. **Handle loading and error states**
   ```typescript
   if (loading) return <LoadingSpinner />;
   if (error) return <ErrorMessage message={error} />;
   return <ActualContent />;
   ```

---

## API Integration Patterns

### Using the API Client

**Two methods available:**

1. **apiRequest()** - For Directus SDK operations (preferred)
2. **directApiRequest()** - For custom endpoints

### Directus SDK Pattern

**File**: Import from `@/services/apiClient`

```typescript
import { apiRequest } from '@/services/apiClient';
import { readItems, createItem, updateItem, deleteItem, readItem } from '@directus/sdk';

// Fetch all items
const items = await apiRequest((client) =>
  client.request(readItems('collection_name', {
    fields: ['*'],
    filter: { status: { _eq: 'published' } },
    limit: -1,
  }))
);

// Fetch single item
const item = await apiRequest((client) =>
  client.request(readItem('collection_name', itemId, {
    fields: ['*'],
  }))
);

// Create item
const newItem = await apiRequest((client) =>
  client.request(createItem('collection_name', {
    name: 'New Item',
    // ... other fields
  }))
);

// Update item
const updatedItem = await apiRequest((client) =>
  client.request(updateItem('collection_name', itemId, {
    name: 'Updated Name',
  }))
);

// Delete item
await apiRequest((client) =>
  client.request(deleteItem('collection_name', itemId))
);
```

### Direct API Request Pattern

**Use when endpoint is not a standard Directus collection:**

```typescript
import { directApiRequest } from '@/services/apiClient';

// GET request
const data = await directApiRequest('/custom/endpoint', {
  method: 'GET',
});

// POST request
const result = await directApiRequest('/custom/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key: 'value' }),
});
```

### Error Handling in API Calls

**Always wrap in try-catch within async thunks:**

```typescript
export const fetchData = createAsyncThunk(
  'feature/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest((client) =>
        client.request(readItems('collection'))
      );
      return data;
    } catch (error: any) {
      // Log error for debugging
      console.error('Failed to fetch data:', error);

      // Return user-friendly error message
      return rejectWithValue(
        error.message || 'Failed to load data. Please try again.'
      );
    }
  }
);
```

### API Client Features

- **Automatic token refresh**: Handled transparently
- **Request queuing**: Requests pause during token refresh
- **Retry logic**: Failed requests retry with exponential backoff (max 2 retries)
- **Timeout**: 10-second default timeout
- **Error handling**: Network errors, auth errors, timeout errors

---

## Urdu & RTL Development Guidelines

### Using Urdu Text

**Component**: Use regular `<Text>` component; RTL is handled globally.

```typescript
import { Text, View } from 'react-native';

const MyComponent = () => (
  <View>
    <Text style={styles.urduText}>ارکان</Text>
  </View>
);

const styles = StyleSheet.create({
  urduText: {
    fontFamily: 'JameelNooriNastaleeq', // Urdu font
    fontSize: 18,
    textAlign: 'right', // RTL alignment
  },
});
```

### Urdu Utilities

**File**: [app/constants/urduLocalization.ts](app/constants/urduLocalization.ts)

```typescript
import {
  urduMonths,
  urduWeekdays,
  convertToUrduDigits,
  formatUrduDate,
  getUrduMonth,
} from '@/constants/urduLocalization';

// Get Urdu month name
const month = getUrduMonth(1); // 'جنوری'

// Convert numbers to Urdu digits
const number = convertToUrduDigits(123); // '۱۲۳'

// Format date in Urdu
const date = formatUrduDate(new Date('2024-01-15')); // '۱۵ جنوری ۲۰۲۴'
```

### RTL Layout Considerations

1. **FlexDirection**: RTL automatically reverses `row` to `row-reverse`
   ```typescript
   // In RTL, this will be right-to-left automatically
   <View style={{ flexDirection: 'row' }}>
     <Text>First</Text>
     <Text>Second</Text>
   </View>
   ```

2. **Text Alignment**
   - Use `textAlign: 'right'` for Urdu text
   - Use `textAlign: 'left'` for English text (if any)

3. **Icons and Images**
   - Some icons may need mirroring in RTL
   - Use `transform: [{ scaleX: -1 }]` for mirroring if needed

4. **Testing RTL**
   - Always test UI in RTL mode
   - Check for layout issues
   - Verify text alignment

### Language Context

**File**: [app/context/LanguageContext.tsx](app/context/LanguageContext.tsx)

```typescript
import { useLanguage } from '@/context/LanguageContext';

const MyComponent = () => {
  const { language, isRTL, setLanguage } = useLanguage();

  return (
    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      {/* Content */}
    </View>
  );
};
```

### i18n Translations

**File**: [app/i18n/locales/en.json](app/i18n/locales/en.json)

```json
{
  "welcome": "Welcome",
  "login": "Login",
  "dashboard": "Dashboard"
}
```

**Usage**:
```typescript
import { i18n } from '@/i18n';

const translated = i18n.t('welcome'); // 'Welcome'
```

---

## Adding New Features

### Step-by-Step: Adding a New Feature

**Example**: Adding a "Donations" feature

#### 1. Define the Data Model

**File**: `app/models/Donation.ts`

```typescript
export interface Donation {
  id: number;
  donor_name: string;
  amount: number;
  donation_date: string;
  category: string;
  unit?: number;
  status: string;
  date_created?: string;
  date_updated?: string;
}
```

#### 2. Create Redux Slice

**File**: `app/features/donations/donationsSlice.ts`

Follow the Redux slice template above.

#### 3. Add to Store

**File**: `app/store/index.ts`

```typescript
import donationsReducer from '@/features/donations/donationsSlice';

const rootReducer = combineReducers({
  // ... existing
  donations: donationsReducer,
});

// Add to persist config if needed
const persistConfig = {
  // ...
  whitelist: ['auth', 'donations'],
};
```

#### 4. Create Screen Component

**File**: `app/screens/Donations.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDonations, selectAllDonations } from '@/features/donations/donationsSlice';
import DonationCard from '@/components/DonationCard';

const DonationsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const donations = useAppSelector(selectAllDonations);

  useEffect(() => {
    dispatch(fetchDonations());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <FlatList
        data={donations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <DonationCard donation={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DonationsScreen;
```

#### 5. Create Reusable Components

**File**: `app/components/DonationCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Donation } from '@/models/Donation';
import { COLORS, SPACING } from '@/constants/theme';

interface DonationCardProps {
  donation: Donation;
  onPress?: () => void;
}

const DonationCard: React.FC<DonationCardProps> = ({ donation, onPress }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{donation.donor_name}</Text>
      <Text style={styles.amount}>Rs. {donation.amount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 14,
    color: COLORS.primary,
  },
});

export default DonationCard;
```

#### 6. Add Navigation

**Option A**: Add to tab navigation

**File**: `app/screens/(tabs)/_layout.tsx`

```typescript
// Add new tab
<Tabs.Screen
  name="donations"
  options={{
    title: 'عطیات',
    tabBarIcon: ({ color }) => <Icon name="gift" color={color} />,
  }}
/>
```

**Option B**: Add to stack navigation

Create file `app/screens/(stack)/DonationDetails.tsx` and navigate to it:

```typescript
import { router } from 'expo-router';

router.push('/donations/123');
```

#### 7. Add Translations

**File**: `app/i18n/locales/en.json`

```json
{
  "donations": "Donations",
  "donor_name": "Donor Name",
  "amount": "Amount"
}
```

---

## Performance Guidelines

### Redux Performance

1. **Use memoized selectors**
   ```typescript
   import { createSelector } from '@reduxjs/toolkit';

   const selectExpensiveDerivedData = createSelector(
     [selectAllItems, selectFilters],
     (items, filters) => {
       // Expensive computation only runs when inputs change
       return items.filter(/* ... */);
     }
   );
   ```

2. **Normalize state with entity adapters**
   - Already covered in Redux patterns
   - Prevents O(n) lookups

3. **Split large slices**
   - Keep slices focused
   - Avoid massive state objects

### Component Performance

1. **Use React.memo for expensive components**
   ```typescript
   const ExpensiveComponent = React.memo<Props>(({ data }) => {
     // Component only re-renders when props change
     return <View>{/* ... */}</View>;
   });
   ```

2. **Optimize FlatList rendering**
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

3. **Avoid inline functions in render**
   ```typescript
   // Bad
   <Button onPress={() => handlePress(id)} />

   // Good
   const handleButtonPress = useCallback(() => {
     handlePress(id);
   }, [id]);

   <Button onPress={handleButtonPress} />
   ```

### API Performance

1. **Use request deduplication**
   - Already handled by apiClient
   - Token refresh uses centralized orchestrator

2. **Implement pagination**
   ```typescript
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);

   const loadMore = async () => {
     const data = await apiRequest((client) =>
       client.request(readItems('collection', {
         limit: 20,
         offset: (page - 1) * 20,
       }))
     );
     if (data.length < 20) setHasMore(false);
     setPage(page + 1);
   };
   ```

3. **Cache aggressively**
   - Use Redux + MMKV persistence
   - Implement pull-to-refresh for manual updates

---

## Common Patterns & Solutions

### 1. Form Input Handling

**Component**: Use `FormInput` component

```typescript
import FormInput from '@/components/FormInput';

const [name, setName] = useState('');
const [error, setError] = useState('');

<FormInput
  label="نام"
  value={name}
  onChangeText={setName}
  error={error}
  placeholder="نام درج کریں"
/>
```

### 2. Dropdown Selection

**Component**: Use `CustomDropdown`

```typescript
import CustomDropdown from '@/components/CustomDropdown';

const [selected, setSelected] = useState<string | null>(null);

<CustomDropdown
  label="رابطہ کی قسم"
  options={[
    { label: 'رکن', value: 'rukun' },
    { label: 'امیدوار', value: 'umeedwar' },
    { label: 'کارکن', value: 'karkun' },
  ]}
  value={selected}
  onChange={setSelected}
/>
```

### 3. Date Picker

```typescript
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

const [date, setDate] = useState(new Date());
const [show, setShow] = useState(false);

<TouchableOpacity onPress={() => setShow(true)}>
  <Text>{date.toLocaleDateString()}</Text>
</TouchableOpacity>

{show && (
  <DateTimePicker
    value={date}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShow(false);
      if (selectedDate) setDate(selectedDate);
    }}
  />
)}
```

### 4. Loading States

```typescript
const loading = useAppSelector(selectLoading);

if (loading) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}
```

### 5. Error Handling

```typescript
const error = useAppSelector(selectError);

{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
  </View>
)}
```

### 6. Pull-to-Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  await dispatch(fetchData());
  setRefreshing(false);
};

<FlatList
  data={data}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  }
/>
```

### 7. Toast Notifications

**Component**: Use `Toast`

```typescript
import Toast from '@/components/Toast';
import { useState } from 'react';

const [toastVisible, setToastVisible] = useState(false);
const [toastMessage, setToastMessage] = useState('');
const [toastType, setToastType] = useState<'success' | 'error'>('success');

const showToast = (message: string, type: 'success' | 'error') => {
  setToastMessage(message);
  setToastType(type);
  setToastVisible(true);
};

<Toast
  visible={toastVisible}
  message={toastMessage}
  type={toastType}
  onDismiss={() => setToastVisible(false)}
/>
```

### 8. Modal Dialogs

**Component**: Use `Dialog`

```typescript
import Dialog from '@/components/Dialog';

const [dialogVisible, setDialogVisible] = useState(false);

<Dialog
  visible={dialogVisible}
  title="تصدیق"
  message="کیا آپ واقعی حذف کرنا چاہتے ہیں؟"
  onConfirm={() => {
    handleDelete();
    setDialogVisible(false);
  }}
  onCancel={() => setDialogVisible(false)}
/>
```

### 9. Image Upload

```typescript
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/utils/imageUpload';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    const uploadedImageId = await uploadImage(imageUri);
    // Use uploadedImageId
  }
};
```

### 10. Navigation

```typescript
import { router } from 'expo-router';

// Navigate to screen
router.push('/screen-name');

// Navigate with params
router.push({
  pathname: '/details',
  params: { id: 123 },
});

// Go back
router.back();

// Replace current screen
router.replace('/login');
```

---

## Common Pitfalls & Solutions

### 1. RTL Layout Issues

**Problem**: UI elements not aligning correctly in RTL mode

**Solution**:
- Use `flexDirection: 'row'` (auto-reverses in RTL)
- Avoid absolute positioning for text
- Test thoroughly in RTL mode

### 2. Token Refresh Race Conditions

**Problem**: Multiple token refresh calls happening simultaneously

**Solution**:
- Already handled by `refreshOrchestrator.ts`
- Never call token refresh directly
- Use `apiRequest()` which handles it automatically

### 3. Redux State Not Persisting

**Problem**: State resets on app restart

**Solution**:
- Add slice to `persistConfig.whitelist` in `app/store/index.ts`
- Ensure MMKV is initialized correctly

### 4. Urdu Text Not Rendering

**Problem**: Urdu text appears as boxes or incorrect characters

**Solution**:
- Ensure font is loaded: Check `app/_layout.tsx`
- Set `fontFamily: 'JameelNooriNastaleeq'`
- Verify font file exists in `assets/fonts/`

### 5. API Calls Failing After Token Expiry

**Problem**: 401 errors after token expires

**Solution**:
- Use `apiRequest()` or `directApiRequest()` which handle refresh
- Don't use raw `fetch()` for authenticated requests
- Check token refresh logic in `tokenRefresh.ts`

### 6. Component Re-rendering Too Often

**Problem**: Performance issues due to excessive re-renders

**Solution**:
- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` hooks
- Use memoized selectors in Redux

### 7. FlatList Performance Issues

**Problem**: Laggy scrolling with large lists

**Solution**:
- Implement `getItemLayout` for fixed-height items
- Set `removeClippedSubviews={true}`
- Reduce `windowSize` and `maxToRenderPerBatch`

### 8. Entity Adapter Not Updating

**Problem**: Redux state not updating when using entity adapter

**Solution**:
- Use entity adapter's update methods: `addOne`, `updateOne`, `removeOne`, `setAll`
- Don't mutate state directly (even though Redux Toolkit uses Immer)

---

## Testing Patterns

### Unit Testing Components

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent title="Test" onPress={onPress} />);

    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Testing Redux Slices

```typescript
import reducer, { fetchData } from './mySlice';

describe('mySlice', () => {
  it('should set loading to true when fetching', () => {
    const state = reducer(undefined, fetchData.pending('', undefined));
    expect(state.loading).toBe(true);
  });

  it('should add entities when fetch succeeds', () => {
    const entities = [{ id: 1, name: 'Test' }];
    const state = reducer(undefined, fetchData.fulfilled(entities, '', undefined));
    expect(state.ids).toEqual([1]);
    expect(state.entities[1]).toEqual(entities[0]);
  });
});
```

### Testing API Calls (Mocking)

```typescript
import { apiRequest } from '@/services/apiClient';

jest.mock('@/services/apiClient', () => ({
  apiRequest: jest.fn(),
}));

describe('API Integration', () => {
  it('fetches data correctly', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    (apiRequest as jest.Mock).mockResolvedValue(mockData);

    const result = await fetchDataFunction();
    expect(result).toEqual(mockData);
  });
});
```

---

## Security Best Practices

### 1. Never Store Sensitive Data Unencrypted

**Use Expo SecureStore for tokens:**
```typescript
import * as SecureStore from 'expo-secure-store';

// Store
await SecureStore.setItemAsync('access_token', token);

// Retrieve
const token = await SecureStore.getItemAsync('access_token');

// Delete
await SecureStore.deleteItemAsync('access_token');
```

### 2. Validate All User Inputs

```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateCNIC = (cnic: string): boolean => {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
};
```

### 3. Sanitize Data Before API Calls

```typescript
const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};
```

### 4. Use HTTPS Only

- Already configured in `apiClient.ts`
- Never downgrade to HTTP

### 5. Implement Proper Error Messages

```typescript
// Don't expose internal errors to users
catch (error: any) {
  console.error('Internal error:', error); // Log for debugging
  return rejectWithValue('Something went wrong. Please try again.'); // User-friendly message
}
```

---

## Debugging Tips

### 1. Redux DevTools

Already integrated in development mode. Use Redux DevTools to inspect state changes.

### 2. Console Logging

```typescript
// In development
if (__DEV__) {
  console.log('Debug info:', data);
}
```

### 3. React Native Debugger

- Press `Cmd + D` (iOS) or `Cmd + M` (Android) for debug menu
- Enable "Debug JS Remotely"

### 4. Network Inspection

- Use Reactotron or Flipper for network request inspection
- Check API responses in console

### 5. MMKV Inspection

```typescript
import { storage } from '@/store/mmkvStorage';

// List all keys
const keys = storage.getAllKeys();
console.log('MMKV keys:', keys);

// Get value
const value = storage.getString('persist:root');
console.log('Persisted state:', value);
```

---

## Code Quality Guidelines

### 1. TypeScript Strict Mode

- Always define types for props, state, and function returns
- Avoid `any` type unless absolutely necessary
- Use `unknown` instead of `any` when type is truly unknown

### 2. Linting

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### 3. Consistent Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Use trailing commas in objects/arrays

### 4. Code Comments

**Comment when:**
- Complex logic that's not immediately obvious
- Workarounds for known issues
- Important business logic

**Don't comment:**
- Obvious code (e.g., `// Set name to value`)
- Self-explanatory function names

**Example:**
```typescript
// Good comment
// Workaround: Directus SDK doesn't support nested filtering,
// so we fetch all and filter client-side
const filtered = allItems.filter(/* ... */);

// Bad comment
// Get all items
const items = getItems();
```

### 5. Function Length

- Keep functions focused and small (< 50 lines)
- Extract complex logic into separate functions
- One function, one responsibility

---

## Build & Deployment

### Local Development

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Production Build

```bash
# Android release build
npm run android:build

# iOS release build (macOS only)
cd ios && pod install && cd ..
npx expo run:ios --configuration Release
```

### EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## Useful Commands

```bash
# Clear cache and reinstall dependencies
rm -rf node_modules && npm install

# Clear Expo cache
npx expo start --clear

# Android clean build
npm run android:clean

# Reset Metro bundler cache
npx expo start --clear

# Check for dependency updates
npm outdated

# Update dependencies
npm update
```

---

## Resources & Documentation

### Project-Specific
- Backend Admin: https://admin.jiislamabad.org
- Directus Docs: https://docs.directus.io/

### Technology Stack
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- Redux Toolkit: https://redux-toolkit.js.org/
- TypeScript: https://www.typescriptlang.org/

### Urdu Resources
- Urdu Font: JameelNooriNastaleeq
- RTL Support: https://reactnative.dev/docs/text#textdirection

---

## Quick Reference

### Most Common Imports

```typescript
// React
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// React Native
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

// Redux
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';

// Navigation
import { router } from 'expo-router';

// Theme
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

// API
import { apiRequest } from '@/services/apiClient';
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk';

// Urdu
import { formatUrduDate, convertToUrduDigits } from '@/constants/urduLocalization';
```

### Most Used Components

```typescript
import FormInput from '@/components/FormInput';
import CustomButton from '@/components/CustomButton';
import CustomDropdown from '@/components/CustomDropdown';
import Dialog from '@/components/Dialog';
import Toast from '@/components/Toast';
import RukunCard from '@/components/RukunCard';
import ActivityCard from '@/components/ActivityCard';
```

---

---

## Database Schema Reference

### Complete Table List

The backend database contains the following tables:

**Core Entities**:
1. `Person` - Member/contact records
2. `Tanzeemi_Unit` - Organizational units (halqas, zones, etc.)
3. `Tanzeemi_Level` - Hierarchy level definitions
4. `Activities` - Activity records
5. `Activity_Type` - Activity type definitions
6. `contact_type` - Contact type lookup (rukun, umeedwar, karkun)

**Workforce/Strength Management**:
7. `Strength_Type` - Workforce type definitions
8. `Strength_Records` - Historical strength records
9. `strength_targets` - Workforce targets by unit

**Reports System**:
10. `report_templates` - Report template definitions
11. `report_sections` - Sections within templates
12. `report_questions` - Questions within sections
13. `reports_mgmt` - Report period management
14. `reports_submissions` - Submitted reports
15. `report_answers` - Individual answers

**Baitulmal (Financial)**:
16. `baitulmal_type` - Income/expense type definitions
17. `baitulmal_records` - Financial records per unit per month

**Supporting Tables**:
18. `Person_files` - File attachments for persons
19. `Rukn_Update` - Update requests (pending approval)
20. `rukun_transfers` - Member transfer tracking
21. `directus_users` - User accounts (Directus system table)
22. `directus_files` - File storage (Directus system table)
23. `directus_roles` - User roles (Directus system table)

### Foreign Key Relationships

```
Person
  ├─→ Tanzeemi_Unit (Tanzeemi_Unit field)
  ├─→ contact_type (contact_type field)
  └─→ directus_users (User_id field)

Tanzeemi_Unit
  ├─→ Tanzeemi_Level (Level_id field)
  ├─→ Tanzeemi_Unit (Parent_id field - self-referencing)
  ├─→ Person (Nazim_id field)
  └─→ directus_users (user_id field)

Activities
  ├─→ Activity_Type (activity_type field)
  └─→ Tanzeemi_Unit (tanzeemi_unit field)

Activity_Type
  └─→ Tanzeemi_Level (Level_id field)

Strength_Records
  ├─→ Tanzeemi_Unit (Tanzeemi_Unit field)
  └─→ Strength_Type (Type field)

Strength_Type
  └─→ Tanzeemi_Level (Reporting_Unit_Level field)

baitulmal_records
  ├─→ Tanzeemi_Unit (Tanzeemi_Unit field)
  └─→ baitulmal_type (Type field)

baitulmal_type
  └─→ Tanzeemi_Level (Reporting_Unit_Level field)

report_sections
  └─→ report_templates (template_id field)

report_questions
  └─→ report_sections (section_id field)

reports_mgmt
  └─→ report_templates (report_template_id field)

reports_submissions
  ├─→ Tanzeemi_Unit (unit_id field)
  ├─→ report_templates (template_id field)
  └─→ reports_mgmt (mgmt_id field)

report_answers
  ├─→ reports_submissions (submission_id field)
  └─→ report_questions (question_id field)

rukun_transfers
  ├─→ Person (contact_id field)
  └─→ Tanzeemi_Unit (local_unit_id field)

Rukn_Update
  └─→ Person (contact_id field)

Person_files
  ├─→ Person (Person_id field)
  └─→ directus_files (directus_files_id field)
```

### Data Model Quick Reference

See [docs/SPECS.md](docs/SPECS.md) for complete TypeScript interfaces and detailed field descriptions.

For the full SQL schema and field names, use **[datamodel.sql](datamodel.sql)** (same directory as this file).

---

**Last Updated**: 2026-03-01
**Version**: 1.1.0

---

## Business Logic Rules

### Activity Date Rules

**File**: `app/screens/(stack)/ActivityScreen.tsx`

When creating or editing activities, date selection is restricted based on mode:

| Mode | Minimum Date | Maximum Date |
|------|-------------|-------------|
| Schedule (new) | Today (or preset month start if later) | Preset month end (or unlimited) |
| Report (new) | Preset month start (or unlimited) | Today (or preset month end if earlier) |
| Edit (draft/schedule) | Today | Unlimited |
| Edit (published/report) | Unlimited | Today |

- `effectiveDateMode` determines rules: in edit mode, activity `status` decides (`published` → report rules, `draft` → schedule rules)
- When editing an activity and changing its date, `report_month` and `report_year` are always derived from the selected date, so the activity automatically moves to the correct reporting month

### Activity Schedule Display

**File**: `app/screens/(tabs)/Activities.tsx`

- Schedule tab (tab 0) splits activities into 3 groups: **گزشتہ شیڈول** (past) → **اگلے تین دن** (next 3 days) → **آنے والی سرگرمیاں** (upcoming)
- Auto-scrolls to the first non-past group on load
- Past activities are greyed out (opacity 0.65) **only in the schedule tab** — reported activities in the report tab are never greyed out
- Published activities are filtered out of the schedule tab (they appear in the report tab only)
- Deleting (archiving) an activity immediately removes it from the entity adapter via `activitiesAdapter.removeOne`

### Report Questions & Archived Content

**File**: `app/features/qa/qaSlice.ts`

- **Published/submitted reports**: Fetch ALL sections and questions (including archived) so all historical answers are visible
- **Draft reports**: Exclude archived sections and questions (`status: { _neq: 'archived' }`)
- Answers are always fetched regardless of question status

### Baitulmal (Financial Records)

**Files**: `app/screens/(stack)/Baitulmal.tsx`, `app/features/baitulmal/baitulmalSlice.ts`

- Shows only the **currently selected unit's** records — does NOT include children's records
- Records are filtered by: unit, report month/year, status (excludes archived), and category (income/expense tabs)
- Uses `selectDashboardSelectedUnitId` with fallback to `selectUserUnitDetails`
- Auto-question calculation (`linked_to_type === 'baitulmal'`) is supported in the report Q&A system

### Logging

**File**: `app/utils/logger.ts`

- `Logger.error()` uses `console.warn` in dev mode to avoid triggering React Native's red error overlay
- The `[ERROR]` prefix in the formatted message still clearly marks it as an error
- In production builds, `console.error` is used as normal
- All Redux slices and API client use the Logger utility (`reduxLogger`, `apiLogger`, `authLogger`) instead of raw `console.error`

### Dashboard Unit Selection

Multiple screens use the dashboard-selected unit pattern:
```typescript
const selectedUnitId = useAppSelector(selectDashboardSelectedUnitId);
const userUnitDetails = useAppSelector(selectUserUnitDetails);
const displayUnitId = selectedUnitId || userUnitDetails?.id;
```

Screens using this pattern: Activities, ActivityScreen, Baitulmal, Workforce, Reports

### Unit-Level Display in Activity Forms

**File**: `app/screens/(stack)/ActivityScreen.tsx`

- Uses `displayUnit` (dashboard-selected or user's unit) with `levelsById` lookup for level name resolution
- Three places resolve unit level: dropdown options, auto-fill details, edit mode location
- `selectedUnitLevelName` is extracted as a `useMemo` returning a string primitive to avoid infinite useEffect loops (prevents new array references from `selectChildUnits`)

---

## Notes for AI Assistants

When working on this codebase:

1. **Always follow existing patterns** - This codebase has established conventions; maintain consistency
2. **Use exact database field names** - Database uses PascalCase (e.g., `Name`, `Phone_Number`, `Tanzeemi_Unit`) - never guess field names
3. **Reference the schema** — **[datamodel.sql](datamodel.sql)** for tables and SQL field names; [docs/SPECS.md](docs/SPECS.md) for TypeScript-oriented specs. Prefer `datamodel.sql` when names or types must match PostgreSQL exactly.
4. **Prioritize Urdu support** - All UI text should support Urdu with proper RTL layout
5. **Use Redux properly** - Follow the entity adapter pattern for collections
6. **Don't break authentication** - Token refresh is critical; don't modify auth flow without understanding
7. **Test RTL thoroughly** - Always verify UI works correctly in right-to-left mode
8. **Respect the theme** - Use colors, spacing, and typography from theme constants
9. **Handle errors gracefully** - User-friendly error messages, proper error handling in async operations
10. **Performance matters** - This is a production app; optimize renders and API calls
11. **Security first** - Never expose tokens, always validate inputs, use secure storage
12. **Watch for DB typos** - `Person.Transfet_to` has a typo (not `Transfer_to`) - handle carefully in code
13. **Contact type is FK** - `Person.contact_type` is an integer FK to `contact_type` table, not a string
14. **Document as you go** - Update this file when adding new patterns or conventions

---

**Happy Coding! 🚀**
