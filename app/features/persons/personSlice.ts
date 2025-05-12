import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import { selectAuthState, isTokenExpiredOrExpiring, refresh, checkAndRefreshTokenIfNeeded } from '../auth/authSlice';
import { fetchUserTanzeemiUnit } from '../tanzeem/tanzeemSlice';
import { Person, CreatePersonPayload, UpdatePersonPayload, PersonResponse, SinglePersonResponse } from '@/app/models/Person';
import { normalizePersonData, normalizePersonDataArray } from '@/app/utils/apiNormalizer';
import { uploadImage } from '@/app/utils/imageUpload';
import { API_BASE_URL } from '@/app/constants/api';
import { Platform } from 'react-native';

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
});

// Helper function for API requests
const apiRequest = async <T>(url: string, method: string, token: string, body?: any): Promise<T> => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  // Ensure URL is properly formatted
  const requestUrl = `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  console.log(`Making ${method} request to: ${requestUrl}`, Platform.OS);
  
  const response = await fetch(requestUrl, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', errorText, Platform.OS);
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

// Helper function for token refresh
const executeWithTokenRefresh = async <T>(
  apiCall: (token: string) => Promise<T>,
  token: string,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<T> => {
  try {
    return await apiCall(token);
  } catch (err: any) {
    const auth = selectAuthState(getState());
    if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
      const { tokens } = await dispatch(refresh()).unwrap();
      if (!tokens?.accessToken) throw new Error('Token refresh failed');
      return await apiCall(tokens.accessToken);
    }
    throw new Error(String(err?.message ?? err));
  }
};

// Fetch persons by Tanzeemi Unit IDs
export const fetchPersonsByUnit = createAsyncThunk<
  Person[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchByUnit', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

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
    
    console.log('Fetching persons by unit:', Platform.OS, 'Unit IDs:', tanzeemiUnitIds);

    const fetchPersons = async (accessToken: string) => {
      // Construct the URL with proper encoding
      const url = `/items/Person`;
      const queryString = params.toString();
      
      console.log('API request URL:', `${url}?${queryString}`);
      
      const response = await apiRequest<PersonResponse>(
        `${url}?${queryString}`,
        'GET',
        accessToken
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
    };

    return await executeWithTokenRefresh(fetchPersons, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch persons error:', error);
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
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchPerson = async (accessToken: string) => {
      // Normalize the email to lowercase to ensure consistent handling across platforms
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log('Fetching person by email:', Platform.OS, normalizedEmail);
      
      // Construct the URL with proper encoding and use a more robust approach
      const url = `/items/Person`;
      const params = new URLSearchParams();
      params.append('filter[Email][_eq]', normalizedEmail);
      params.append('fields', '*');
      
      const response = await apiRequest<PersonResponse>(
        `${url}?${params.toString()}`,
        'GET',
        accessToken
      );
      console.log('Fetching person response by email:', Platform.OS, response);

      if (!response.data || response.data.length === 0) {
        console.log(`No person found with email ${normalizedEmail}`);
        return null;
      }
      return normalizePersonData(response.data[0]);
    };

    const person = await executeWithTokenRefresh(fetchPerson, token, dispatch, getState);
    if (person && (person.Tanzeemi_Unit || person.unit)) {
      const unitId = person.Tanzeemi_Unit || person.unit;
      if (typeof unitId === 'number') {
        dispatch(fetchUserTanzeemiUnit(unitId));
      }
    }
    return person;
  } catch (error: any) {
    console.error('Fetch person by email error:', error);
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
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const apiPersonData = {
      Name: personData.name,
      Address: personData.address,
      Phone_Number: personData.phone,
      Email: personData.email,
      Father_Name: personData.parent,
      Date_of_birth: personData.dob,
      CNIC: personData.cnic,
      Tanzeemi_Unit: personData.unit,
      status: personData.status || 'draft',
      Gender: 'm',
    };

    const createPersonRequest = async (accessToken: string) => {
      const response = await apiRequest<SinglePersonResponse>(
        '/items/Person',
        'POST',
        accessToken,
        apiPersonData
      );
      if (!response.data) throw new Error('Failed to create person');
      return normalizePersonData(response.data);
    };

    return await executeWithTokenRefresh(createPersonRequest, token, dispatch, getState);
  } catch (error: any) {
    console.error('Create person error:', error);
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
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const { id, ...updateData } = personData;
    const apiPersonData: Record<string, any> = {};
    if (updateData.name !== undefined) apiPersonData.Name = updateData.name;
    if (updateData.address !== undefined) apiPersonData.Address = updateData.address;
    if (updateData.phone !== undefined) apiPersonData.Phone_Number = updateData.phone;
    if (updateData.email !== undefined) apiPersonData.Email = updateData.email;
    if (updateData.parent !== undefined) apiPersonData.Father_Name = updateData.parent;
    if (updateData.dob !== undefined) apiPersonData.Date_of_birth = updateData.dob;
    if (updateData.cnic !== undefined) apiPersonData.CNIC = updateData.cnic;
    if (updateData.unit !== undefined) apiPersonData.Tanzeemi_Unit = updateData.unit;
    if (updateData.status !== undefined) apiPersonData.status = updateData.status;

    const updatePersonRequest = async (accessToken: string) => {
      const response = await apiRequest<SinglePersonResponse>(
        `/items/Person/${id}`,
        'PATCH',
        accessToken,
        apiPersonData
      );
      if (!response.data) throw new Error(`Failed to update person with ID ${id}`);
      return normalizePersonData(response.data);
    };

    return await executeWithTokenRefresh(updatePersonRequest, token, dispatch, getState);
  } catch (error: any) {
    console.error('Update person error:', error);
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
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const updatePersonImageRequest = async (accessToken: string) => {
      const fileId = await uploadImage(imageUri, accessToken, onProgress);
      if (!fileId) throw new Error('Failed to upload image');
      const apiPersonData = { picture: fileId };
      const response = await apiRequest<SinglePersonResponse>(
        `/items/Person/${id}`,
        'PATCH',
        accessToken,
        apiPersonData
      );
      if (!response.data) throw new Error(`Failed to update person image with ID ${id}`);
      return normalizePersonData(response.data);
    };

    return await executeWithTokenRefresh(updatePersonImageRequest, token, dispatch, getState);
  } catch (error: any) {
    console.error('Update person image error:', error);
    return rejectWithValue(error.message || `Failed to update image for person with ID ${id}`);
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
    },
    resetCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus(state) {
      state.updateStatus = 'idle';
      state.updateError = null;
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
        state.userDetailsStatus = 'succeeded';
        state.userDetails = action.payload;
        if (action.payload) {
          personsAdapter.upsertOne(state, action.payload);
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
      });
  },
});

export const { clearPersons, resetCreateStatus, resetUpdateStatus } = personsSlice.actions;

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

export default personsSlice.reducer;