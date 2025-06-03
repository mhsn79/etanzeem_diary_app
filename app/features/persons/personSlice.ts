import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import { selectAuthState } from '../auth/authSlice';
import { fetchUserTanzeemiUnit } from '../tanzeem/tanzeemSlice';
import { Person, CreatePersonPayload, UpdatePersonPayload, PersonResponse, SinglePersonResponse } from '@/app/models/Person';
import { normalizePersonData, normalizePersonDataArray } from '@/app/utils/apiNormalizer';
import { uploadImage } from '@/app/utils/imageUpload';
import { Platform } from 'react-native';
import { TanzeemiUnit } from '@/app/models/TanzeemiUnit';
import apiRequest, { directApiRequest } from '../../services/apiClient';

interface ContactType {
  id: number;
  type: string;
}

// Entity adapter for persons
const personsAdapter = createEntityAdapter<Person>({
  selectId: person => person.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Initial state setup
interface PersonsExtraState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createError: string | null;
  updateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  updateError: string | null;
  userDetails: Person | null;
  userDetailsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  userDetailsError: string | null;
  nazimDetails: Person | null;
  nazimDetailsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  nazimDetailsError: string | null;
  selectedPersonStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedPersonError: string | null;
  contactTypes: ContactType[];
  contactTypesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  contactTypesError: string | null;
}

export type PersonsState = ReturnType<typeof personsAdapter.getInitialState<PersonsExtraState>>;

const initialState: PersonsState = personsAdapter.getInitialState<PersonsExtraState>({
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
  userDetails: null,
  userDetailsStatus: 'idle',
  userDetailsError: null,
  nazimDetails: null,
  nazimDetailsStatus: 'idle',
  nazimDetailsError: null,
  selectedPersonStatus: 'idle',
  selectedPersonError: null,
  contactTypes: [],
  contactTypesStatus: 'idle',
  contactTypesError: null,
});

// We use the centralized apiRequest function from services/apiClient

// We no longer need the executeWithTokenRefresh function here
// Token refresh is now handled centrally by the auth middleware and apiClient

// Fetch persons by Tanzeemi Unit IDs
export const fetchPersonsByUnit = createAsyncThunk<
  Person[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchByUnit', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    // Check if user is authenticated before making API call
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] User not authenticated, skipping fetch persons by unit (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }
    
    const { tanzeem } = getState();
    const tanzeemiUnitIds = tanzeem?.userUnitHierarchyIds ?? [];
    if (!tanzeemiUnitIds.length) {
      console.log('No Tanzeemi Unit IDs found');
      return [];
    }

    // Create a more explicit URLSearchParams object to ensure consistent behavior across platforms
    const params = new URLSearchParams();
    params.append('filter[Tanzeemi_Unit][_in]', tanzeemiUnitIds.join(','));
    params.append('sort', 'id');
    params.append('fields', '*');
    
    console.log(`[Persons] Fetching persons by unit (${Platform.OS}), Unit IDs:`, tanzeemiUnitIds);

    // Construct the URL with proper encoding
    const url = `/items/Person`;
    const queryString = params.toString();
    
    console.log(`[Persons] API request URL: ${url}?${queryString} (${Platform.OS})`);
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<PersonResponse>(
      `${url}?${queryString}`,
      'GET'
    );
    
    if (!response.data) throw new Error('Failed to fetch persons');
    const transformedData = normalizePersonDataArray(response.data);

    // Fetch unit details for each person
    transformedData.forEach(person => {
      const unitId = person.Tanzeemi_Unit || person.unit;
      if (typeof unitId === 'number') {
        dispatch(fetchUserTanzeemiUnit(unitId));
      }
    });

    return transformedData;
  } catch (error: any) {
    console.error(`[Persons] Fetch persons error: ${error.message} (${Platform.OS})`);
    return rejectWithValue(error.message || 'Failed to fetch persons');
  }
});

// Fetch person by email
export const fetchPersonByEmail = createAsyncThunk<
  Person | null,
  string,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchByEmail', async (email, { getState, dispatch, rejectWithValue }) => {
  try {
    // Check if user is authenticated before making API call
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] User not authenticated, skipping fetch person by email (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }
    
    // Normalize the email to lowercase to ensure consistent handling across platforms
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log(`[Persons] Fetching person by email: ${normalizedEmail} (${Platform.OS})`);
    
    // Construct the URL with proper encoding and use a more robust approach
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
    const endpoint = '/items/Person';
    const filter = encodeURIComponent(`{"Email":{"_eq":"${normalizedEmail}"}}`);
    const fields = encodeURIComponent('*');
    const fullUrl = `${baseUrl}${endpoint}?filter=${filter}&fields=${fields}`;
    
    console.log(`[Persons] Making request to: ${fullUrl} (${Platform.OS})`);
    
    try {
      // First try with directApiRequest which uses fetch directly
      const response = await directApiRequest<PersonResponse>(
        `${endpoint}?filter=${filter}&fields=${fields}`,
        'GET'
      );
      
      // console.log(`[Persons] Fetching person response by email (${Platform.OS})`, response);

      if (!response.data || response.data.length === 0) {
        console.log(`[Persons] No person found with email ${normalizedEmail} (${Platform.OS})`);
        return null;
      }
      
      // Normalize the person data to ensure consistent field names
      const person = normalizePersonData(response.data[0]);
      
      // If we have a person with a Tanzeemi Unit, fetch the unit details
      if (person && (person.Tanzeemi_Unit || person.unit)) {
        const unitId = person.Tanzeemi_Unit || person.unit;
        if (typeof unitId === 'number') {
          try {
            // Fetch unit details but don't block the person data return
            dispatch(fetchUserTanzeemiUnit(unitId));
          } catch (unitError) {
            console.error(`[Persons] Error fetching Tanzeemi Unit: ${unitError} (${Platform.OS})`);
            // Continue even if unit fetch fails
          }
        }
      }
      
      // Set userDetails in the state
      if (person) {
        dispatch(setUserDetails(person));
      }
      
      return person;
    } catch (apiError: any) {
      console.warn(`[Persons] First attempt failed: ${apiError.message} (${Platform.OS})`);
      
      // If the first attempt fails, try a fallback approach with apiRequest
      try {
        console.log(`[Persons] Trying fallback approach... (${Platform.OS})`);
        
        const params = new URLSearchParams();
        params.append('filter[Email][_eq]', normalizedEmail);
        params.append('fields', '*');
        
        const response = await apiRequest<PersonResponse>(() => ({
          path: `/items/Person?${params.toString()}`,
          method: 'GET'
        }));
        
        console.log(`[Persons] Fallback response: (${Platform.OS})`, response);
        
        if (!response.data || response.data.length === 0) {
          console.log(`[Persons] No person found with email ${normalizedEmail} in fallback (${Platform.OS})`);
          return null;
        }
        
        // Normalize the person data to ensure consistent field names
        const person = normalizePersonData(response.data[0]);
        
        // If we have a person with a Tanzeemi Unit, fetch the unit details
        if (person && (person.Tanzeemi_Unit || person.unit)) {
          const unitId = person.Tanzeemi_Unit || person.unit;
          if (typeof unitId === 'number') {
            dispatch(fetchUserTanzeemiUnit(unitId));
          }
        }
        
        // Set userDetails in the state
        if (person) {
          dispatch(setUserDetails(person));
        }
        
        return person;
      } catch (fallbackError: any) {
        console.error(`[Persons] Fallback attempt also failed: ${fallbackError.message} (${Platform.OS})`);
        
        // Handle specific API errors
        if (fallbackError.message?.includes('401') || fallbackError.message?.includes('Unauthorized')) {
          throw new Error('Authentication error. Please log in again.');
        }
        if (fallbackError.message?.includes('403') || fallbackError.message?.includes('Forbidden')) {
          throw new Error('You do not have permission to access this data.');
        }
        if (fallbackError.message?.includes('404') || fallbackError.message?.includes('Not Found')) {
          console.log(`[Persons] Person with email ${normalizedEmail} not found (${Platform.OS})`);
          return null;
        }
        if (fallbackError.message?.includes('500')) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Rethrow other errors
        throw fallbackError;
      }
    }
  } catch (error: any) {
    console.error(`[Persons] Fetch person by email error: ${error.message} (${Platform.OS})`);
    return rejectWithValue(error.message || `Failed to fetch person with email ${email}`);
  }
});

// Create person
export const createPerson = createAsyncThunk<
  Person,
  CreatePersonPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/create', async (personData, { getState, dispatch, rejectWithValue }) => {
  try {

    // Map form fields to API payload structure
    const apiPersonData: Record<string, any> = {
      Name: personData.name,
      Email: personData.email || '',
      Gender: personData.gender || 'male',
      Phone_Number: personData.phone,
      contact_type: personData.contact_type,
      status: personData.status || 'draft',
      // Add some default values that might be required
      Address: '',
      Father_Name: '',
      CNIC: '',
      Date_of_birth: null,
      Tanzeemi_Unit: personData.tanzeemi_unit || null,
      Education: null,
      Profession: null,
    };

    // Remove undefined values to keep payload clean
    Object.keys(apiPersonData).forEach(key => {
      if (apiPersonData[key] === undefined) {
        delete apiPersonData[key];
      }
    });

    console.log(`[Persons][CreatePerson] API payload (${Platform.OS}):`, apiPersonData);
    console.log(`[Persons][CreatePerson] API request details - URL: /items/Person, Method: POST (${Platform.OS})`);

    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<SinglePersonResponse>(
      '/items/Person',
      'POST',
      apiPersonData
    );
    
    console.log(`[Persons][CreatePerson] API response (${Platform.OS}):`, response);
    
    if (!response) {
      const errorMsg = 'Failed to create person - no response';
      console.error(`[Persons][CreatePerson] Error: ${errorMsg} (${Platform.OS})`);
      throw new Error(errorMsg);
    }

    // Check if the response has the expected data
    if (!response.data || !response.data.id) {
      const errorMsg = 'Failed to create person - response missing data or ID';
      if (response.data) {
        console.error(`[Persons][CreatePerson] Data structure:`, Object.keys(response.data));
      }
      throw new Error(errorMsg);
    }

    const normalizedPerson = normalizePersonData(response.data);
    
    return normalizedPerson;
  } catch (error: any) {
   
    return rejectWithValue(error.message || 'Failed to create person');
  }
});

// Update person
export const updatePerson = createAsyncThunk<
  Person,
  UpdatePersonPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/update', async (personData, { getState, dispatch, rejectWithValue }) => {
  try {
    const { id, ...updateData } = personData;
    const apiPersonData: Record<string, any> = {};
    
    // Map new simplified fields
    if (updateData.name !== undefined) apiPersonData.Name = updateData.name;
    if (updateData.email !== undefined) apiPersonData.Email = updateData.email;
    if (updateData.gender !== undefined) apiPersonData.Gender = updateData.gender;
    if (updateData.phone !== undefined) apiPersonData.Phone_Number = updateData.phone;
    if (updateData.contact_type !== undefined) apiPersonData.contact_type = updateData.contact_type;
    if (updateData.status !== undefined) apiPersonData.status = updateData.status;
    
    // Keep backward compatibility for existing fields
    if (updateData.address !== undefined) apiPersonData.Address = updateData.address;
    if (updateData.parent !== undefined) apiPersonData.Father_Name = updateData.parent;
    if (updateData.dob !== undefined) apiPersonData.Date_of_birth = updateData.dob;
    if (updateData.cnic !== undefined) apiPersonData.CNIC = updateData.cnic;
    if (updateData.unit !== undefined) apiPersonData.Tanzeemi_Unit = updateData.unit;

    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<SinglePersonResponse>(
      `/items/Person/${id}`,
      'PATCH',
      apiPersonData
    );
    
    if (!response.data) throw new Error(`Failed to update person with ID ${id}`);
    return normalizePersonData(response.data);
  } catch (error: any) {
    console.error(`[Persons] Update person error: ${error.message} (${Platform.OS})`);
    return rejectWithValue(error.message || `Failed to update person with ID ${personData.id}`);
  }
});

// Update person image
export interface UpdatePersonImagePayload {
  id: number;
  imageUri: string;
  onProgress?: (progress: number) => void;
}

export const updatePersonImage = createAsyncThunk<
  Person,
  UpdatePersonImagePayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/updateImage', async ({ id, imageUri, onProgress }, { getState, dispatch, rejectWithValue }) => {
  try {
    // Get the current token for image upload
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');
    
    // Upload the image first
    const fileId = await uploadImage(imageUri, token, onProgress);
    if (!fileId) throw new Error('Failed to upload image');
    
    // Then update the person record with the new image ID
    const apiPersonData = { picture: fileId };
    
    // Use the centralized apiRequest function which handles token refresh automatically
    const response = await apiRequest<SinglePersonResponse>(() => ({
      path: `/items/Person/${id}`,
      method: 'PATCH',
      body: apiPersonData
    }));
    
    if (!response.data) throw new Error(`Failed to update person image with ID ${id}`);
    return normalizePersonData(response.data);
  } catch (error: any) {
    console.error(`[Persons] Update person image error: ${error.message} (${Platform.OS})`);
    return rejectWithValue(error.message || `Failed to update image for person with ID ${id}`);
  }
});

/**
 * Fetch Nazim details based on Nazim_id from a TanzeemiUnit
 * This function fetches the person details for a Nazim from the Person table
 * by matching the Nazim_id with the person.id
 */
/**
 * Fetch a person by ID
 * This function fetches the details of a specific person from the Person table
 * by their ID
 */
export const fetchPersonById = createAsyncThunk<
  Person,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchById', async (personId, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log(`[Persons] Fetching person details for ID: ${personId} (${Platform.OS})`);
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<SinglePersonResponse>(
      `/items/Person/${personId}?fields=*`,
      'GET'
    );
    
    if (!response.data) throw new Error(`Failed to fetch person with ID ${personId}`);
    return normalizePersonData(response.data);
  } catch (error: any) {
    console.error(`[Persons] Fetch person by ID error: ${error.message} (${Platform.OS})`);
    return rejectWithValue(error.message || `Failed to fetch person with ID ${personId}`);
  }
});

export const fetchNazimDetails = createAsyncThunk<
  Person,
  TanzeemiUnit | number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchNazimDetails', async (unitOrNazimId, { getState, dispatch, rejectWithValue }) => {
  try {
    // Check if user is authenticated before making API call
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] User not authenticated, skipping fetch Nazim details (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }
    
    console.log(`[Persons] Fetching Nazim details... (${Platform.OS})`);
    
    // Extract Nazim_id from the unit object or use the provided ID directly
    let nazimId: number;
    if (typeof unitOrNazimId === 'number') {
      nazimId = unitOrNazimId;
    } else {
      nazimId = unitOrNazimId.Nazim_id || 0;
      if (!nazimId) {
        return rejectWithValue('No Nazim_id found in the provided unit');
      }
    }
    
    console.log(`[Persons] Fetching Nazim details for Nazim_id: ${nazimId} (${Platform.OS})`);
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<SinglePersonResponse>(
      `/items/Person/${nazimId}?fields=*`,
      'GET'
    );
    
    console.log(`[Persons] API Response for Nazim details (${Platform.OS})`, response);
    if (!response.data) throw new Error(`Person with ID ${nazimId} not found`);
    
    // Transform the API response to match our expected format
    return normalizePersonData(response.data);
  } catch (error: any) {
    console.error(`[Persons] Fetch Nazim details error: ${error.message} (${Platform.OS})`);
    return rejectWithValue(error.message || 'Failed to fetch Nazim details');
  }
});

// Fetch contact types
export const fetchContactTypes = createAsyncThunk<
  ContactType[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchContactTypes', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    // Check if user is authenticated before making API call
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] User not authenticated, skipping fetch contact types (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }
    
    console.log(`[Persons] Fetching contact types... (${Platform.OS})`);
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<{ data: ContactType[] }>(
      '/items/contact_type',
      'GET'
    );
    
    console.log(`[Persons] Fetching contact types response (${Platform.OS})`);
    
    if (!response.data) throw new Error('Failed to fetch contact types');
    return response.data;
  } catch (error: any) {
    console.error(`[Persons] Fetch contact types error: ${error.message} (${Platform.OS})`);
    return rejectWithValue(error.message || 'Failed to fetch contact types');
  }
});

// Persons slice
const personsSlice = createSlice({
  name: 'persons',
  initialState,
  reducers: {
    clearPersons(state) {
      personsAdapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
      state.userDetails = null;
      state.userDetailsStatus = 'idle';
      state.userDetailsError = null;
      state.nazimDetails = null;
      state.nazimDetailsStatus = 'idle';
      state.nazimDetailsError = null;
      state.contactTypes = [];
      state.contactTypesStatus = 'idle';
      state.contactTypesError = null;
    },
    resetCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus(state) {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    // Add a new action to set user details directly
    setUserDetails(state, action: PayloadAction<Person>) {
      state.userDetails = action.payload;
      state.userDetailsStatus = 'succeeded';
      state.userDetailsError = null;
      // Also add to the entities collection
      personsAdapter.upsertOne(state, action.payload);
    },
    // Add an action to clear user details (useful for logout)
    clearUserDetails(state) {
      state.userDetails = null;
      state.userDetailsStatus = 'idle';
      state.userDetailsError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch persons by unit
      .addCase(fetchPersonsByUnit.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPersonsByUnit.fulfilled, (state, action: PayloadAction<Person[]>) => {
        state.status = 'succeeded';
        personsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchPersonsByUnit.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch persons';
      })
      // Fetch person by email
      .addCase(fetchPersonByEmail.pending, state => {
        state.userDetailsStatus = 'loading';
        state.userDetailsError = null;
      })
      .addCase(fetchPersonByEmail.fulfilled, (state, action: PayloadAction<Person | null>) => {
        if (action.payload) {
          state.userDetailsStatus = 'succeeded';
          state.userDetails = action.payload;
          personsAdapter.upsertOne(state, action.payload);
        } else {
          // If no person was found, set error state
          state.userDetailsStatus = 'failed';
          state.userDetailsError = 'User details not found';
          state.userDetails = null;
        }
      })
      .addCase(fetchPersonByEmail.rejected, (state, action) => {
        state.userDetailsStatus = 'failed';
        state.userDetailsError = action.payload ?? 'Failed to fetch person by email';
        state.userDetails = null;
      })
      // Create person
      .addCase(createPerson.pending, state => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createPerson.fulfilled, (state, action: PayloadAction<Person>) => {
        state.createStatus = 'succeeded';
        personsAdapter.addOne(state, action.payload);
      })
      .addCase(createPerson.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload ?? 'Failed to create person';
      })
      // Update person
      .addCase(updatePerson.pending, state => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updatePerson.fulfilled, (state, action: PayloadAction<Person>) => {
        state.updateStatus = 'succeeded';
        personsAdapter.upsertOne(state, action.payload);
      })
      .addCase(updatePerson.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload ?? 'Failed to update person';
      })
      // Update person image
      .addCase(updatePersonImage.pending, state => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updatePersonImage.fulfilled, (state, action: PayloadAction<Person>) => {
        state.updateStatus = 'succeeded';
        personsAdapter.upsertOne(state, action.payload);
      })
      .addCase(updatePersonImage.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload ?? 'Failed to update person image';
      })
      // Fetch Nazim details
      .addCase(fetchNazimDetails.pending, (state) => {
        state.nazimDetailsStatus = 'loading';
        state.nazimDetailsError = null;
      })
      .addCase(fetchNazimDetails.fulfilled, (state, action: PayloadAction<Person>) => {
        state.nazimDetailsStatus = 'succeeded';
        state.nazimDetails = action.payload;
        personsAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchNazimDetails.rejected, (state, action) => {
        state.nazimDetailsStatus = 'failed';
        state.nazimDetailsError = action.payload ?? 'Failed to fetch Nazim details';
      })
      // Fetch contact types
      .addCase(fetchContactTypes.pending, state => {
        state.contactTypesStatus = 'loading';
        state.contactTypesError = null;
      })
      .addCase(fetchContactTypes.fulfilled, (state, action: PayloadAction<ContactType[]>) => {
        state.contactTypesStatus = 'succeeded';
        state.contactTypes = action.payload;
      })
      .addCase(fetchContactTypes.rejected, (state, action) => {
        state.contactTypesStatus = 'failed';
        state.contactTypesError = action.payload ?? 'Failed to fetch contact types';
      })
      // Fetch Person by ID
      .addCase(fetchPersonById.pending, (state) => {
        state.selectedPersonStatus = 'loading';
        state.selectedPersonError = null;
      })
      .addCase(fetchPersonById.fulfilled, (state, action: PayloadAction<Person>) => {
        state.selectedPersonStatus = 'succeeded';
        personsAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchPersonById.rejected, (state, action) => {
        state.selectedPersonStatus = 'failed';
        state.selectedPersonError = action.payload ?? 'Failed to fetch person details';
      });
  },
});

export const { 
  clearPersons, 
  resetCreateStatus, 
  resetUpdateStatus,
  setUserDetails,
  clearUserDetails
} = personsSlice.actions;

// Selectors
const selectPersonsState = (state: RootState): PersonsState =>
  (state as any).persons ?? (initialState as PersonsState);

export const {
  selectAll: selectAllPersons,
  selectById: selectPersonById,
  selectTotal: selectTotalPersons,
} = personsAdapter.getSelectors(selectPersonsState);

export const selectPersonsStatus = (state: RootState) => selectPersonsState(state).status;
export const selectPersonsError = (state: RootState) => selectPersonsState(state).error;
export const selectCreatePersonStatus = (state: RootState) => selectPersonsState(state).createStatus;
export const selectCreatePersonError = (state: RootState) => selectPersonsState(state).createError;
export const selectUpdatePersonStatus = (state: RootState) => selectPersonsState(state).updateStatus;
export const selectUpdatePersonError = (state: RootState) => selectPersonsState(state).updateError;
export const selectUserDetails = (state: RootState) => selectPersonsState(state).userDetails;
export const selectUserDetailsStatus = (state: RootState) => selectPersonsState(state).userDetailsStatus;
export const selectUserDetailsError = (state: RootState) => selectPersonsState(state).userDetailsError;

// Nazim details selectors
export const selectNazimDetails = (state: RootState) => selectPersonsState(state).nazimDetails;
export const selectNazimDetailsStatus = (state: RootState) => selectPersonsState(state).nazimDetailsStatus;
export const selectNazimDetailsError = (state: RootState) => selectPersonsState(state).nazimDetailsError;

// Contact types selectors
export const selectContactTypes = (state: RootState) => selectPersonsState(state).contactTypes;
export const selectContactTypesStatus = (state: RootState) => selectPersonsState(state).contactTypesStatus;
export const selectContactTypesError = (state: RootState) => selectPersonsState(state).contactTypesError;

export default personsSlice.reducer;