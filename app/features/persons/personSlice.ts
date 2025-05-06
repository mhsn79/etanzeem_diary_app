import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import {
  selectAuthState,
  isTokenExpiredOrExpiring,
  refresh,
  checkAndRefreshTokenIfNeeded,
} from '../auth/authSlice';
import { fetchUserTanzeemiUnit } from '../tanzeem/tanzeemSlice';
import { Person, CreatePersonPayload, UpdatePersonPayload, PersonResponse, SinglePersonResponse } from '@/app/models/Person';
import { normalizePersonData, normalizePersonDataArray } from '@/app/utils/apiNormalizer';
import { uploadImage } from '@/app/utils/imageUpload';
import { API_BASE_URL } from '@/app/constants/api';

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Entity adapter + initial state
 * ────────────────────────────────────────────────────────────────────────────────
 */
const personsAdapter = createEntityAdapter<Person>({
  selectId: person => person.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

interface PersonsExtraState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createError: string | null;
  updateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  updateError: string | null;
  deleteStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  deleteError: string | null;
  selectedPersonId: number | null;
  selectedPersonStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedPersonError: string | null;
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
  deleteStatus: 'idle',
  deleteError: null,
  selectedPersonId: null,
  selectedPersonStatus: 'idle',
  selectedPersonError: null,
  userDetails: null,
  userDetailsStatus: 'idle',
  userDetailsError: null,
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * API Helper Functions
 * ────────────────────────────────────────────────────────────────────────────────
 */

// Helper function to handle API requests with token
const apiRequest = async <T>(
  url: string,
  method: string,
  token: string,
  body?: any,
  dispatch?: AppDispatch,
  getState?: () => RootState
): Promise<T> => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, options);

  if (!response.ok) {
    let errorText = '';
    try {
      const errorData = await response.json();
      errorText = JSON.stringify(errorData);
    } catch (e) {
      errorText = await response.text();
    }
    console.error('API Error:', errorText);
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data as T;
};

// Helper function to handle API requests with token refresh
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
    const msg = String(err?.message ?? err);

    if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
      const { tokens } = await dispatch(refresh()).unwrap();
      if (!tokens?.accessToken) throw new Error('Refresh failed');
      return await apiCall(tokens.accessToken);
    }
    throw new Error(msg);
  }
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch all persons
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchPersons = createAsyncThunk<
  Person[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchAll', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching persons...');

    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchPersons = async (accessToken: string) => {
      const response = await apiRequest<PersonResponse>(
        '/items/Person?fields=*',
        'GET',
        accessToken
      );
      console.log('API Response:', response);
      if (!response.data) throw new Error('Failed to fetch persons');
      
      // Transform the API response to match our expected format
      console.log('Setting persons:', response.data);
      const transformedData = normalizePersonDataArray(response.data);
      
      return transformedData;
    };

    return await executeWithTokenRefresh(fetchPersons, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch persons error:', error);
    return rejectWithValue(error.message || 'Failed to fetch persons');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch a single person by ID
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchPersonById = createAsyncThunk<
  Person,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchById', async (personId, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching person by ID:', personId);
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchPerson = async (accessToken: string) => {
      const response = await apiRequest<SinglePersonResponse>(
        `/items/Person/${personId}?fields=*`,
        'GET',
        accessToken
      );
      
      console.log('API Response for person:', response);
      if (!response.data) throw new Error(`Person with ID ${personId} not found`);
      
      // Transform the API response to match our expected format
      const transformedPerson = normalizePersonData(response.data);
      return transformedPerson;
    };

    return await executeWithTokenRefresh(fetchPerson, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch person error:', error);
    return rejectWithValue(error.message || `Failed to fetch person with ID ${personId}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch a single person by email
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchPersonByEmail = createAsyncThunk<
  Person | null,
  string,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchByEmail', async (email, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching person by email:', email);
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchPerson = async (accessToken: string) => {
      // Use filter query to find person by email
      const response = await apiRequest<PersonResponse>(
        `/items/Person?filter[Email][_eq]=${encodeURIComponent(email)}&fields=*`,
        'GET',
        accessToken
      );
      
      console.log('API Response for person by email:', response);
      if (!response.data || response.data.length === 0) {
        console.log(`No person found with email ${email}`);
        return null;
      }
      
      // Transform the API response to match our expected format
      const transformedPerson = normalizePersonData(response.data[0]);
      return transformedPerson;
    };

    const person = await executeWithTokenRefresh(fetchPerson, token, dispatch, getState);
    
    // If person data is fetched successfully and has a Tanzeemi_Unit, fetch the unit details
    if (person && (person.Tanzeemi_Unit || person.unit)) {
      const unitId = person.Tanzeemi_Unit || person.unit;

      console.log('-------------------unitId:', unitId);
      
      if (typeof unitId === 'number') {
        // Dispatch the action to fetch the tanzeemi unit
        dispatch(fetchUserTanzeemiUnit(unitId));
      }
    }
    
    return person;
  } catch (error: any) {
    console.error('Fetch person by email error:', error);
    return rejectWithValue(error.message || `Failed to fetch person with email ${email}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to create a new person
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const createPerson = createAsyncThunk<
  Person,
  CreatePersonPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/create', async (personData, { getState, dispatch, rejectWithValue }) => {
  try {
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    // Transform our data model to match the API's expected format
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
      Gender: 'm' // Default value
    };

    const createPersonRequest = async (accessToken: string) => {
      try {
        const response = await apiRequest<SinglePersonResponse>(
          '/items/Person',
          'POST',
          accessToken,
          apiPersonData
        );
        
        if (!response.data) throw new Error('Failed to create person');
        
        // Transform the response back to our expected format
        const transformedPerson = normalizePersonData(response.data);
        
        return transformedPerson;
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    };

    return await executeWithTokenRefresh(createPersonRequest, token, dispatch, getState);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to create person');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 *Thunk to update an existing person
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const updatePerson = createAsyncThunk<
  Person,
  UpdatePersonPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/update', async (personData, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Updating person:', personData);
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const { id, ...updateData } = personData;

    // Transform our data model to match the API's expected format
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

    console.log('API Person Data for update:', apiPersonData);

    const updatePersonRequest = async (accessToken: string) => {
      try {
        const response = await apiRequest<SinglePersonResponse>(
          `/items/Person/${id}`,
          'PATCH',
          accessToken,
          apiPersonData
        );
        
        if (!response.data) throw new Error(`Failed to update person with ID ${id}`);
        
        // Transform the response back to our expected format
        const transformedPerson = normalizePersonData(response.data);
        
        return transformedPerson;
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    };

    return await executeWithTokenRefresh(updatePersonRequest, token, dispatch, getState);
  } catch (error: any) {
    console.error('Update person error:', error);
    return rejectWithValue(error.message || `Failed to update person with ID ${personData.id}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to delete a person
 * ────────────────────────────────────────────────────────────────────────────────
 */
// export const deletePerson = createAsyncThunk<
//   number,
//   number,
//   { state: RootState; dispatch: AppDispatch; rejectValue: string }
// >('persons/delete', async (personId, { getState, dispatch, rejectWithValue }) => {
//   try {
//     // Refresh token if needed
//     await dispatch(checkAndRefreshTokenIfNeeded());

//     const auth = selectAuthState(getState());
//     let token = auth.tokens?.accessToken;
//     if (!token) return rejectWithValue('No access token');

//     const deletePerson = async (accessToken: string) => {
//       await apiRequest<void>(
//         `/items/Person/${personId}`,
//         'DELETE',
//         accessToken
//       );
//       return personId;
//     };

//     return await executeWithTokenRefresh(deletePerson, token, dispatch, getState);
//   } catch (error: any) {
//     return rejectWithValue(error.message || `Failed to delete person with ID ${personId}`);
//   }
// });

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to update a person's profile image
 * ────────────────────────────────────────────────────────────────────────────────
 */
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
    console.log('Updating person image:', { id, imageUri });
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const updatePersonImageRequest = async (accessToken: string) => {
      try {
        // 1. Upload the image to get the file ID
        const fileId = await uploadImage(imageUri, accessToken, onProgress);
        
        if (!fileId) {
          throw new Error('Failed to upload image');
        }
        
        console.log('Image uploaded successfully, file ID:', fileId);
        
        // 2. Update the person record with the new image ID
        const apiPersonData = {
          picture: fileId
        };
        
        const response = await apiRequest<SinglePersonResponse>(
          `/items/Person/${id}`,
          'PATCH',
          accessToken,
          apiPersonData
        );
        
        if (!response.data) throw new Error(`Failed to update person image with ID ${id}`);
        
        // Transform the response back to our expected format
        const transformedPerson = normalizePersonData(response.data);
        
        return transformedPerson;
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    };

    return await executeWithTokenRefresh(updatePersonImageRequest, token, dispatch, getState);
  } catch (error: any) {
    console.error('Update person image error:', error);
    return rejectWithValue(error.message || `Failed to update image for person with ID ${id}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Slice
 * ────────────────────────────────────────────────────────────────────────────────
 */
const personsSlice = createSlice({
  name: 'persons',
  initialState,
  reducers: {
    clearPersons(state) {
      personsAdapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
    },
    setSelectedPersonId(state, action: PayloadAction<number | null>) {
      state.selectedPersonId = action.payload;
    },
    resetCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus(state) {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    resetDeleteStatus(state) {
      state.deleteStatus = 'idle';
      state.deleteError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch all persons
      .addCase(fetchPersons.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPersons.fulfilled, (state, action: PayloadAction<Person[]>) => {
        state.status = 'succeeded';
        console.log('Setting persons:', action.payload); // Debug payload
        personsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchPersons.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch persons';
      })
      
      // Fetch person by ID
      .addCase(fetchPersonById.pending, state => {
        state.selectedPersonStatus = 'loading';
        state.selectedPersonError = null;
      })
      .addCase(fetchPersonById.fulfilled, (state, action: PayloadAction<Person>) => {
        state.selectedPersonStatus = 'succeeded';
        state.selectedPersonId = action.payload.id;
        personsAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchPersonById.rejected, (state, action) => {
        state.selectedPersonStatus = 'failed';
        state.selectedPersonError = action.payload ?? 'Failed to fetch person';
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
      
      // Fetch person by email
      .addCase(fetchPersonByEmail.pending, (state) => {
        state.userDetailsStatus = 'loading';
        state.userDetailsError = null;
      })
      .addCase(fetchPersonByEmail.fulfilled, (state, action: PayloadAction<Person | null>) => {
        state.userDetailsStatus = 'succeeded';
        if (action.payload) {
          state.userDetails = action.payload;
          // Also add to the entity adapter
          personsAdapter.upsertOne(state, action.payload);
        } else {
          state.userDetails = null;
        }
      })
      .addCase(fetchPersonByEmail.rejected, (state, action) => {
        state.userDetailsStatus = 'failed';
        state.userDetailsError = action.payload ?? 'Failed to fetch person by email';
        state.userDetails = null;
      })
      
      // Delete person
      // .addCase(deletePerson.pending, state => {
      //   state.deleteStatus = 'loading';
      //   state.deleteError = null;
      // })
      // .addCase(deletePerson.fulfilled, (state, action: PayloadAction<number>) => {
      //   state.deleteStatus = 'succeeded';
      //   personsAdapter.removeOne(state, action.payload);
      //   if (state.selectedPersonId === action.payload) {
      //     state.selectedPersonId = null;
      //   }
      // })
      // .addCase(deletePerson.rejected, (state, action) => {
      //   state.deleteStatus = 'failed';
      //   state.deleteError = action.payload ?? 'Failed to delete person';
      // });
  },
});

export const {
  clearPersons,
  setSelectedPersonId,
  resetCreateStatus,
  resetUpdateStatus,
  resetDeleteStatus,
} = personsSlice.actions;

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Selectors (with safe fallback)
 * ────────────────────────────────────────────────────────────────────────────────
 */
const selectPersonsState = (state: RootState): PersonsState =>
  (state as any).persons ?? (initialState as PersonsState);

export const {
  selectAll: selectAllPersons,
  selectById: selectPersonById,
  selectIds: selectPersonIds,
  selectEntities: selectPersonEntities,
  selectTotal: selectTotalPersons,
} = personsAdapter.getSelectors(selectPersonsState);

export const selectPersonsStatus = (state: RootState) => selectPersonsState(state).status;
export const selectPersonsError = (state: RootState) => selectPersonsState(state).error;
export const selectCreatePersonStatus = (state: RootState) => selectPersonsState(state).createStatus;
export const selectCreatePersonError = (state: RootState) => selectPersonsState(state).createError;
export const selectUpdatePersonStatus = (state: RootState) => selectPersonsState(state).updateStatus;
export const selectUpdatePersonError = (state: RootState) => selectPersonsState(state).updateError;
export const selectDeletePersonStatus = (state: RootState) => selectPersonsState(state).deleteStatus;
export const selectDeletePersonError = (state: RootState) => selectPersonsState(state).deleteError;
export const selectSelectedPersonId = (state: RootState) => selectPersonsState(state).selectedPersonId;
export const selectSelectedPerson = (state: RootState) => {
  const personId = selectSelectedPersonId(state);
  return personId ? selectPersonById(state, personId) : undefined;
};
export const selectSelectedPersonStatus = (state: RootState) => selectPersonsState(state).selectedPersonStatus;
export const selectSelectedPersonError = (state: RootState) => selectPersonsState(state).selectedPersonError;

// User details selectors
export const selectUserDetails = (state: RootState) => selectPersonsState(state).userDetails;
export const selectUserDetailsStatus = (state: RootState) => selectPersonsState(state).userDetailsStatus;
export const selectUserDetailsError = (state: RootState) => selectPersonsState(state).userDetailsError;

export default personsSlice.reducer;