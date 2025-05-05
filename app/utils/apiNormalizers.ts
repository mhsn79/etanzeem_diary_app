import { Person } from '../models/Person';
import { Activity } from '@/src/types/Activity';
import { ActivityType } from '../features/activityTypes/activityTypesSlice';
import { TanzeemiUnit } from '../models/TanzeemiUnit';

/**
 * Generic type for field mappings
 */
type FieldMappings = Record<string, string>;

/**
 * Base normalizer function that can be used for any entity type
 * @param data The API response data object
 * @param fieldMappings Mapping of API field names to model field names
 * @param specialCases Special case handlers for specific fields
 * @returns A normalized object with both original and mapped fields
 */
export function normalizeData<T extends Record<string, any>, R>(
  data: T,
  fieldMappings: FieldMappings,
  specialCases?: (normalized: Record<string, any>, apiField: string, apiValue: any) => void
): T & Partial<R> {
  // Handle null or undefined data gracefully
  if (!data) return data as T & Partial<R>;
  
  try {
    // Create a shallow copy of the original data to preserve all fields
    const normalized = { ...data } as Record<string, any>;
    
    // Apply mappings
    Object.entries(fieldMappings).forEach(([apiField, modelField]) => {
      try {
        // Use type assertion to access properties that might exist on the data object
        const apiValue = data[apiField as keyof T];
        const modelValue = data[modelField as keyof T];
        
        // Only add the mapped field if the source exists and target doesn't
        if (apiValue !== undefined && modelValue === undefined) {
          normalized[modelField] = apiValue;
          
          // Apply special case handlers if provided
          if (specialCases) {
            try {
              specialCases(normalized, apiField, apiValue);
            } catch (specialCaseError) {
              // Silently handle special case errors to prevent app crashes
              console.warn(`Special case handler error for field ${apiField}:`, specialCaseError);
            }
          }
        }
      } catch (fieldError) {
        // Silently handle field mapping errors to prevent app crashes
        console.warn(`Error mapping field ${apiField} to ${modelField}:`, fieldError);
      }
    });
    
    return normalized as T & Partial<R>;
  } catch (error) {
    // In case of any unexpected error, return the original data to prevent app crashes
    console.warn('Error in normalizeData:', error);
    return data as T & Partial<R>;
  }
}

/**
 * Normalizes an array of API response data
 * @param dataArray Array of API response data objects
 * @param fieldMappings Mapping of API field names to model field names
 * @param specialCases Special case handlers for specific fields
 * @returns Array of normalized objects
 */
export function normalizeDataArray<T extends Record<string, any>, R>(
  dataArray: T[],
  fieldMappings: FieldMappings,
  specialCases?: (normalized: Record<string, any>, apiField: string, apiValue: any) => void
): (T & Partial<R>)[] {
  try {
    // Handle invalid input gracefully
    if (!dataArray) return [];
    
    // Ensure we're working with an array
    if (!Array.isArray(dataArray)) {
      console.warn('normalizeDataArray received non-array data:', dataArray);
      return [];
    }
    
    // Process each item, handling errors individually to prevent the entire array from failing
    return dataArray.map(item => {
      try {
        return normalizeData<T, R>(item, fieldMappings, specialCases);
      } catch (itemError) {
        // If normalization fails for an item, return the original item to prevent app crashes
        console.warn('Error normalizing array item:', itemError);
        return item as T & Partial<R>;
      }
    });
  } catch (error) {
    // In case of any unexpected error, return an empty array to prevent app crashes
    console.warn('Error in normalizeDataArray:', error);
    return [];
  }
}

// Person-specific field mappings
const personFieldMappings: FieldMappings = {
  'Name': 'name',
  'Address': 'address',
  'Phone_Number': 'phone',
  'Email': 'email',
  'Father_Name': 'parent',
  'Date_of_birth': 'dob',
  'CNIC': 'cnic',
  'Tanzeemi_Unit': 'unit',
  'date_created': 'created_at',
  'date_updated': 'updated_at'
};

// Person-specific special cases
const personSpecialCases = (normalized: Record<string, any>, apiField: string, apiValue: any) => {
  try {
    // Special case for phone number - also map to whatsApp and sms
    if (apiField === 'Phone_Number' && apiValue) {
      normalized['whatsApp'] = apiValue;
      normalized['sms'] = apiValue;
    }
  } catch (error) {
    // Silently handle errors in special cases to prevent app crashes
    console.warn(`Error in personSpecialCases for field ${apiField}:`, error);
  }
};

/**
 * Normalizes Person API response data
 * @param data The API response data object
 * @returns A normalized Person object
 */
export function normalizePersonData<T extends Record<string, any>>(data: T): T & Partial<Person> {
  return normalizeData<T, Person>(data, personFieldMappings, personSpecialCases);
}

/**
 * Normalizes an array of Person API response data
 * @param dataArray Array of API response data objects
 * @returns Array of normalized Person objects
 */
export function normalizePersonDataArray<T extends Record<string, any>>(dataArray: T[]): (T & Partial<Person>)[] {
  return normalizeDataArray<T, Person>(dataArray, personFieldMappings, personSpecialCases);
}

// Activity-specific field mappings
const activityFieldMappings: FieldMappings = {
  'date_created': 'created_at',
  'date_updated': 'updated_at',
  'location': 'location_name',
  'details': 'activity_details',
  'date_time': 'activity_date_and_time'
};

/**
 * Normalizes Activity API response data
 * @param data The API response data object
 * @returns A normalized Activity object
 */
export function normalizeActivityData<T extends Record<string, any>>(data: T): T & Partial<Activity> {
  return normalizeData<T, Activity>(data, activityFieldMappings);
}

/**
 * Normalizes an array of Activity API response data
 * @param dataArray Array of API response data objects
 * @returns Array of normalized Activity objects
 */
export function normalizeActivityDataArray<T extends Record<string, any>>(dataArray: T[]): (T & Partial<Activity>)[] {
  return normalizeDataArray<T, Activity>(dataArray, activityFieldMappings);
}

// ActivityType-specific field mappings
const activityTypeFieldMappings: FieldMappings = {
  'date_created': 'created_at',
  'date_updated': 'updated_at',
  'title': 'Name',
  'description': 'Description'
};

/**
 * Normalizes ActivityType API response data
 * @param data The API response data object
 * @returns A normalized ActivityType object
 */
export function normalizeActivityTypeData<T extends Record<string, any>>(data: T): T & Partial<ActivityType> {
  return normalizeData<T, ActivityType>(data, activityTypeFieldMappings);
}

/**
 * Normalizes an array of ActivityType API response data
 * @param dataArray Array of API response data objects
 * @returns Array of normalized ActivityType objects
 */
export function normalizeActivityTypeDataArray<T extends Record<string, any>>(dataArray: T[]): (T & Partial<ActivityType>)[] {
  return normalizeDataArray<T, ActivityType>(dataArray, activityTypeFieldMappings);
}

// TanzeemiUnit-specific field mappings
const tanzeemiUnitFieldMappings: FieldMappings = {
  'Name': 'name',
  'Description': 'description',
  'Parent_id': 'parent_id',
  'Level': 'level',
  'Level_id': 'level_id',
  'zaili_unit_hierarchy': 'zaili_unit_hierarchy',
  'Status': 'status',
  'date_created': 'created_at',
  'date_updated': 'updated_at'
};

/**
 * Normalizes TanzeemiUnit API response data
 * @param data The API response data object
 * @returns A normalized TanzeemiUnit object
 */
export function normalizeTanzeemiUnitData<T extends Record<string, any>>(data: T): T & Partial<TanzeemiUnit> {
  return normalizeData<T, TanzeemiUnit>(data, tanzeemiUnitFieldMappings);
}

/**
 * Normalizes an array of TanzeemiUnit API response data
 * @param dataArray Array of API response data objects
 * @returns Array of normalized TanzeemiUnit objects
 */
export function normalizeTanzeemiUnitDataArray<T extends Record<string, any>>(dataArray: T[]): (T & Partial<TanzeemiUnit>)[] {
  return normalizeDataArray<T, TanzeemiUnit>(dataArray, tanzeemiUnitFieldMappings);
}