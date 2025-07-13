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
  transferStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  transferError: string | null;
  rukunUpdateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  rukunUpdateError: string | null;
  rukunUpdateRequests: Record<number, any>; // Store update requests by contact_id
  existingTransfers: RukunTransferRequest[];
  checkTransferStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  checkTransferError: string | null;
  createTransferStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createTransferError: string | null;
  personCountStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  personCountError: string | null;
  personCount: number | null;
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
  transferStatus: 'idle',
  transferError: null,
  rukunUpdateStatus: 'idle',
  rukunUpdateError: null,
  rukunUpdateRequests: {},
  existingTransfers: [],
  checkTransferStatus: 'idle',
  checkTransferError: null,
  createTransferStatus: 'idle',
  createTransferError: null,
  personCountStatus: 'idle',
  personCountError: null,
  personCount: null,
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
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';
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

// Transfer Rukun to new unit
export interface TransferRukunPayload {
  id: number;
  contact_id: number; // This is the new tanzeemi_unit ID
}

export interface RukunTransferRequestPayload {
  contact_id: number;
  transfer_type: 'local' | 'outside';
  local_unit_id?: number;
  city_name?: string;
  transfer_date: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
}

export interface RukunTransferRequest {
  id?: number;
  contact_id: number;
  transfer_type: 'local' | 'outside';
  local_unit_id?: number;
  city_name?: string;
  transfer_date: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  date_created?: string;
  date_updated?: string;
}

export interface CheckExistingTransferResponse {
  data: RukunTransferRequest[];
}

export interface CreateRukunTransferResponse {
  data: RukunTransferRequest;
}

export interface RukunUpdateResponse {
  data: {
    id: number;
    status: string;
    sort: null | number;
    user_created: string;
    date_created: string;
    user_updated: null | string;
    date_updated: string;
    date_of_birth: string;
    Father_Name: string;
    Phone_Number: string;
    Email: string;
    Address: string;
    Profession: string;
    Education: string;
    Additional_Phones: null | string;
    contact_id: number;
  };
}

export const transferRukun = createAsyncThunk<
  Person,
  TransferRukunPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/transferRukun', async (transferData, { getState, dispatch, rejectWithValue }) => {
  try {
    // Check if user is authenticated before making API call
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] User not authenticated, skipping transfer rukun (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }
    
    console.log(`[Persons] Transferring Rukun ID ${transferData.id} to unit ${transferData.contact_id} (${Platform.OS})`);
    
    // First, get the current person data to capture the previous unit
    let previousUnit = null;
    try {
      const currentPersonResponse = await directApiRequest<SinglePersonResponse>(
        `/items/Person/${transferData.id}`,
        'GET'
      );
      previousUnit = currentPersonResponse.data?.Tanzeemi_Unit || null;
      console.log(`[Persons] Previous unit: ${previousUnit} (${Platform.OS})`);
    } catch (error) {
      console.warn(`[Persons] Could not fetch current person data: ${error} (${Platform.OS})`);
    }
    
    // Step 1: Update the Person record with the new Tanzeemi_Unit
    const updatePersonPayload = {
      Tanzeemi_Unit: transferData.contact_id
    };
    
    console.log('Updating Person record:', updatePersonPayload);
    
    const updateResponse = await directApiRequest<SinglePersonResponse>(
      `/items/Person/${transferData.id}`,
      'PATCH',
      updatePersonPayload
    );
    console.log('----->>>>>>',updateResponse);
    
    
    if (!updateResponse.data) throw new Error(`Failed to update person with ID ${transferData.id}`);
    
    console.log(`[Persons] Person update successful (${Platform.OS}):`, updateResponse.data);
    
    // Step 2: Log the transfer in Rukun_Update collection (optional)
    try {
      const transferLogPayload = {
        // Transfer details
        contact_id: updateResponse.data.Tanzeemi_Unit, // New unit ID        
        // Person details from the updated response
        Name: updateResponse.data.Name,
        Email: updateResponse.data.Email,
        Phone_Number: updateResponse.data.Phone_Number,
        Father_Name: updateResponse.data.Father_Name,
        Gender: updateResponse.data.Gender,
        CNIC: updateResponse.data.CNIC,
        Address: updateResponse.data.Address,
        Profession: updateResponse.data.Profession,
        Education: updateResponse.data.Education,
        Date_of_birth: updateResponse.data.Date_of_birth,
      
        
        // Transfer tracking
        person_id: updateResponse.data.id,
        Transfer_from: previousUnit, // Previous unit ID
        Transfer_to: updateResponse.data.Tanzeemi_Unit, // New unit ID

      };
      
      console.log('Logging transfer:', transferLogPayload);
      
      await directApiRequest<any>(
        '/items/Rukn_Update',
        'POST',
        transferLogPayload
      );
      
      console.log(`[Persons] Transfer logged successfully (${Platform.OS})`);
    } catch (logError) {
      console.warn(`[Persons] Failed to log transfer, but person update was successful (${Platform.OS}):`, logError);
      // Don't throw error here as the main operation (person update) was successful
    }
    
    // Return the normalized updated person data
    return normalizePersonData(updateResponse.data);
  } catch (error: any) {
    console.error(`[Persons] Transfer rukun error: ${error.message || error} (${Platform.OS})`);
    
    // Handle specific API errors
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return rejectWithValue('Authentication error. Please log in again.');
    }
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return rejectWithValue('You do not have permission to transfer this rukun.');
    }
    if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      return rejectWithValue('Rukun or destination unit not found.');
    }
    if (error.message?.includes('500')) {
      return rejectWithValue('Server error. Please try again later.');
    }
    
    return rejectWithValue(error.message || `Failed to transfer rukun with ID ${transferData.id}`);
  }
});

// Check for existing transfer requests
export const checkExistingTransfer = createAsyncThunk<
  RukunTransferRequest[],
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/checkExistingTransfer', async (contactId, { getState, rejectWithValue }) => {
  try {
    // Check if user is authenticated before making API call
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] User not authenticated, skipping check existing transfer (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }
    
    console.log(`[Persons] Checking existing transfers for contact ID ${contactId} (${Platform.OS})`);
    
    // Only check for active transfer requests (pending or draft status)
    const response = await directApiRequest<CheckExistingTransferResponse>(
      `/items/rukun_transfers?filter[contact_id][_eq]=${contactId}&filter[status][_in]=pending,draft`,
      'GET'
    );
    
    if (!response.data) {
      throw new Error('Failed to check existing transfer requests');
    }
    
    console.log(`[Persons] Found ${response.data.length} existing transfers for contact ID ${contactId}:`, response.data);
    
    // If there are no active transfers, return an empty array
    if (response.data.length === 0) {
      return [];
    }
    
    return response.data;
  } catch (error: any) {
    console.error(`[Persons] Check existing transfer error: ${error.message || error} (${Platform.OS})`);
    return rejectWithValue(error.message || 'Failed to check existing transfer requests');
  }
});

// Create a new transfer request
export const createRukunTransfer = createAsyncThunk<
  RukunTransferRequest,
  RukunTransferRequestPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/createRukunTransfer', async (transferData, { getState, rejectWithValue }) => {
  try {
    // Check if user is authenticated before making API call
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] User not authenticated, skipping create transfer (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }
    
    console.log(`[Persons] Creating transfer request for contact ID ${transferData.contact_id} (${Platform.OS})`);
    
    // Set default status if not provided
    const payload = {
      ...transferData,
      status: transferData.status || 'draft'
    };
    
    const response = await directApiRequest<CreateRukunTransferResponse>(
      '/items/rukun_transfers',
      'POST',
      payload
    );
    
    if (!response.data) {
      throw new Error('Failed to create transfer request');
    }
    
    console.log(`[Persons] Transfer request created successfully (${Platform.OS})`);
    return response.data;
  } catch (error: any) {
    console.error(`[Persons] Create transfer error: ${error.message || error} (${Platform.OS})`);
    
    // Handle specific API errors
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return rejectWithValue('Authentication error. Please log in again.');
    }
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return rejectWithValue('You do not have permission to create a transfer request.');
    }
    if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      return rejectWithValue('Resource not found.');
    }
    if (error.message?.includes('500')) {
      return rejectWithValue('Server error. Please try again later.');
    }
    
    return rejectWithValue(error.message || 'Failed to create transfer request');
  }
});

// Rukun Update Request interface
export interface RukunUpdateRequest {
  id?: number;
  contact_id: number;
  status: 'draft' | 'published';
  Name?: string;
  Father_Name?: string;
  date_of_birth?: string;
  Phone_Number?: string;
  Email?: string;
  Address?: string;
  Profession?: string;
  Education?: string;
  Additional_Phones?: string;
  date_created?: string;
  user_created?: string | null;
}

// Fetch Rukun Update Request by contact_id
export const fetchRukunUpdateRequest = createAsyncThunk<
  RukunUpdateRequest | null,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchRukunUpdateRequest', async (contactId, { getState, rejectWithValue }) => {
  try {
    console.log(`[Persons] 🚀 Starting fetchRukunUpdateRequest for contact_id: ${contactId} (${Platform.OS})`);
    
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] ❌ User not authenticated for contact_id: ${contactId} (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }

    console.log(`[Persons] ✅ Authentication verified for contact_id: ${contactId} (${Platform.OS})`);

    const params = new URLSearchParams();
    params.append('filter[contact_id][_eq]', contactId.toString());
    params.append('fields', '*');
    params.append('sort', '-date_created'); // Get the latest request

    const apiUrl = `/items/Rukn_Update?${params.toString()}`;
    console.log(`[Persons] 📡 Making API request to: ${apiUrl} (${Platform.OS})`);

    const response = await directApiRequest<{ data: RukunUpdateRequest[] }>(
      apiUrl,
      'GET'
    );

    console.log(`[Persons] 📥 API Response received for contact_id: ${contactId} (${Platform.OS}):`, {
      hasData: !!response.data,
      dataLength: response.data?.length || 0,
      responseKeys: Object.keys(response)
    });

    if (!response.data || response.data.length === 0) {
      console.log(`[Persons] 📭 No Rukun Update Request found for contact_id: ${contactId} (${Platform.OS})`);
      return null;
    }

    // Return the latest request
    const latestRequest = response.data[0];
    console.log(`[Persons] ✅ Found Rukun Update Request for contact_id: ${contactId} (${Platform.OS}):`, {
      id: latestRequest.id,
      status: latestRequest.status,
      contact_id: latestRequest.contact_id,
      hasName: !!latestRequest.Name,
      hasPhone: !!latestRequest.Phone_Number,
      hasEmail: !!latestRequest.Email,
    });
    
    return latestRequest;
  } catch (error: any) {
    console.error(`[Persons] ❌ Fetch Rukun Update Request error for contact_id: ${contactId} (${Platform.OS}):`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return rejectWithValue(error.message || 'Failed to fetch Rukun Update Request');
  }
});

// Submit Rukun Update Request
export const submitRukunUpdateRequest = createAsyncThunk<
  RukunUpdateRequest,
  RukunUpdateRequest,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/submitRukunUpdateRequest', async (requestData, { getState, rejectWithValue }) => {
  try {
    console.log(`[Persons] 🚀 Starting submitRukunUpdateRequest for contact_id: ${requestData.contact_id} (${Platform.OS})`);
    console.log(`[Persons] 📝 Request data:`, {
      contact_id: requestData.contact_id,
      status: requestData.status,
      hasId: !!requestData.id,
      hasName: !!requestData.Name,
      hasPhone: !!requestData.Phone_Number,
      hasEmail: !!requestData.Email
    });
    
    const authState = getState().auth;
    if (!authState.tokens?.accessToken) {
      console.log(`[Persons] ❌ User not authenticated for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      return rejectWithValue('User not authenticated');
    }

    console.log(`[Persons] ✅ Authentication verified for contact_id: ${requestData.contact_id} (${Platform.OS})`);

    // Prepare payload matching the successful API format
    const apiPayload: any = {
      contact_id: Number(requestData.contact_id), // Convert to string as shown in successful example
      status: requestData.status || 'draft', // Use 'draft' as default like in the example
    };

    // Add fields conditionally and with validation
    if (requestData.Name && requestData.Name.trim()) {
      apiPayload.Name = requestData.Name.trim().substring(0, 100); // Limit length
    }
    
    if (requestData.Father_Name && requestData.Father_Name.trim()) {
      apiPayload.Father_Name = requestData.Father_Name.trim().substring(0, 100);
    }
    
    // Always include Phone_Number (can be null/empty)
    if (requestData.Phone_Number && requestData.Phone_Number.trim()) {
      // Clean and validate phone number
      const phone = requestData.Phone_Number.trim().replace(/[^\d+\-\s()]/g, '');
      if (phone.length <= 20) {
        apiPayload.Phone_Number = phone;
      } else {
        apiPayload.Phone_Number = null;
      }
    } else {
      apiPayload.Phone_Number = null;
    }
    
    if (requestData.Email && requestData.Email.trim()) {
      const email = requestData.Email.trim();
      if (email.length <= 100 && email.includes('@')) {
        apiPayload.Email = email;
      }
    }
    
    if (requestData.Address && requestData.Address.trim()) {
      apiPayload.Address = requestData.Address.trim().substring(0, 255);
    }
    
    if (requestData.Profession && requestData.Profession.trim()) {
      apiPayload.Profession = requestData.Profession.trim().substring(0, 100);
    }
    
    if (requestData.Education && requestData.Education.trim()) {
      apiPayload.Education = requestData.Education.trim().substring(0, 100);
    }
    
    // Always include Additional_Phones (can be null/empty)
    if (requestData.Additional_Phones && requestData.Additional_Phones.trim()) {
      const additionalPhone = requestData.Additional_Phones.trim().replace(/[^\d+\-\s()]/g, '');
      if (additionalPhone.length <= 20) {
        apiPayload.Additional_Phones = additionalPhone;
      } else {
        apiPayload.Additional_Phones = null;
      }
    } else {
      apiPayload.Additional_Phones = null;
    }
    
    if (requestData.date_of_birth) {
      // Convert date to DD/MM/YYYY format as shown in successful example
      let dateValue = requestData.date_of_birth;
      
      // Remove time component if present
      if (dateValue.includes('T')) {
        dateValue = dateValue.split('T')[0];
      }
      
      // Convert from YYYY-MM-DD to DD/MM/YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split('-');
        apiPayload.date_of_birth = `${day}/${month}/${year}`;
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        // Already in DD/MM/YYYY format
        apiPayload.date_of_birth = dateValue;
      }
    }

    console.log(`[Persons] 📋 Validation summary for contact_id: ${requestData.contact_id} (${Platform.OS}):`, {
      hasName: !!apiPayload.Name,
      hasPhone: !!apiPayload.Phone_Number,
      hasEmail: !!apiPayload.Email,
      hasDate: !!apiPayload.date_of_birth,
      contactIdType: typeof apiPayload.contact_id,
      fieldCount: Object.keys(apiPayload).length
    });

    console.log(`[Persons] 📋 Prepared API payload for contact_id: ${requestData.contact_id} (${Platform.OS}):`, apiPayload);
    console.log(`[Persons] 🔍 Payload field types:`, {
      contact_id: typeof apiPayload.contact_id,
      status: typeof apiPayload.status,
      Phone_Number: typeof apiPayload.Phone_Number,
      Additional_Phones: typeof apiPayload.Additional_Phones,
      payloadKeys: Object.keys(apiPayload)
    });

    let response;
    let existingRecordId = null;
    
    // Step 1: Check if a Rukun Update record already exists for this contact_id
    console.log(`[Persons] 🔍 Checking for existing Rukun Update record for contact_id: ${requestData.contact_id} (${Platform.OS})`);
    
    try {
      const checkUrl = `/items/Rukn_Update`;
      const checkParams = new URLSearchParams();
      checkParams.append('filter[contact_id][_eq]', String(requestData.contact_id));
      checkParams.append('limit', '1');
      checkParams.append('fields', 'id,contact_id,status');
      
      const checkResponse = await directApiRequest<{ data: Array<{ id: number; contact_id: string | number; status: string }> }>(
        `${checkUrl}?${checkParams.toString()}`,
        'GET'
      );
      
      console.log(`[Persons] 📋 Existing record check result for contact_id: ${requestData.contact_id} (${Platform.OS}):`, {
        found: checkResponse.data && checkResponse.data.length > 0,
        recordCount: checkResponse.data ? checkResponse.data.length : 0,
        firstRecord: checkResponse.data && checkResponse.data.length > 0 ? checkResponse.data[0] : null
      });
      
      if (checkResponse.data && checkResponse.data.length > 0) {
        existingRecordId = checkResponse.data[0].id;
        console.log(`[Persons] ✅ Found existing Rukun Update record ID: ${existingRecordId} for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      } else {
        console.log(`[Persons] 🆕 No existing Rukun Update record found for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      }
    } catch (checkError) {
      console.log(`[Persons] ⚠️ Error checking for existing record for contact_id: ${requestData.contact_id} (${Platform.OS}):`, checkError);
      // Continue with creation if check fails
      existingRecordId = null;
    }
    
    // Step 2: Decide whether to UPDATE (PATCH) or CREATE (POST)
    if (existingRecordId) {
      // Update existing record using PATCH
      console.log(`[Persons] 🔄 Updating existing Rukun Update Request ID: ${existingRecordId} for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      const updateUrl = `/items/Rukn_Update/${existingRecordId}`;
      console.log(`[Persons] 📡 PATCH request to: ${updateUrl} (${Platform.OS})`);
      console.log(`[Persons] 📤 PATCH payload:`, apiPayload);
      
      response = await directApiRequest<{ data: RukunUpdateRequest }>(
        updateUrl,
        'PATCH',
        apiPayload
      );
      
      console.log(`[Persons] ✅ Successfully updated existing record ID: ${existingRecordId} for contact_id: ${requestData.contact_id} (${Platform.OS})`);
    } else {
      // Create new record using POST
      console.log(`[Persons] 🆕 Creating new Rukun Update Request for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      const createUrl = '/items/Rukn_Update';
      console.log(`[Persons] 📡 POST request to: ${createUrl} (${Platform.OS})`);
      console.log(`[Persons] 📤 POST payload:`, apiPayload);
      
      response = await directApiRequest<{ data: RukunUpdateRequest }>(
        createUrl,
        'POST',
        apiPayload
      );
      
      console.log(`[Persons] ✅ Successfully created new record for contact_id: ${requestData.contact_id} (${Platform.OS})`);
    }

    console.log(`[Persons] 📥 API Response received for contact_id: ${requestData.contact_id} (${Platform.OS}):`, {
      hasData: !!response.data,
      responseKeys: Object.keys(response)
    });

    if (!response.data) {
      console.log(`[Persons] ❌ No response data for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      throw new Error('Failed to submit Rukun Update Request - no response data');
    }

    console.log(`[Persons] ✅ Rukun Update Request submitted successfully for contact_id: ${requestData.contact_id} (${Platform.OS}):`, {
      id: response.data.id,
      status: response.data.status,
      contact_id: response.data.contact_id
    });
    
    return response.data;
  } catch (error: any) {
    console.error(`[Persons] ❌ Submit Rukun Update Request error for contact_id: ${requestData.contact_id} (${Platform.OS}):`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      status: error.status,
      response: error.response
    });
    
    // Handle specific API errors
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.log(`[Persons] 🔐 Authentication error for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      return rejectWithValue('Authentication error. Please log in again.');
    }
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      console.log(`[Persons] 🚫 Permission error for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      return rejectWithValue('You do not have permission to submit this request.');
    }
    if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      console.log(`[Persons] 🔍 Not found error for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      return rejectWithValue('Contact not found.');
    }
    if (error.message?.includes('500')) {
      console.log(`[Persons] 🔥 Server error for contact_id: ${requestData.contact_id} (${Platform.OS})`);
      return rejectWithValue('Server error. Please try again later.');
    }
    
    console.log(`[Persons] ⚠️ Generic error for contact_id: ${requestData.contact_id} (${Platform.OS}): ${error.message}`);
    return rejectWithValue(error.message || 'Failed to submit Rukun Update Request');
  }
});

// Fetch person count based on contact_type
export const fetchPersonCount = createAsyncThunk<
  number,
  { linkedToId: number; questionId: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('persons/fetchCount', async ({ linkedToId, questionId }, { rejectWithValue, getState }) => {
  try {
    console.log(`[PERSON_COUNT] 🚀 Starting person count fetch for question ${questionId}`);
    console.log(`[PERSON_COUNT] 🔗 Using linked_to_id:`, linkedToId);
    
    // Get the current user ID from auth state
    const state = getState();
    const userId = state.auth.user?.id;
    const userToken = state.auth.tokens?.accessToken;
    
    // Get user's unit hierarchy IDs from tanzeem state
    const userUnitHierarchyIds = state.tanzeem?.userUnitHierarchyIds ?? [];
    
    console.log(`[PERSON_COUNT] 👤 User ID: ${userId}`);
    console.log(`[PERSON_COUNT] 🔑 Token available: ${!!userToken}`);
    console.log(`[PERSON_COUNT] 🏢 User unit hierarchy IDs:`, userUnitHierarchyIds);
    
    if (!userId) {
      console.error(`[PERSON_COUNT] ❌ No user ID found in auth state`);
      return rejectWithValue('User not authenticated. Please log in again.');
    }

    if (!linkedToId) {
      console.warn('[PERSON_COUNT] ⚠️ No linked_to_id provided');
      return 0;
    }

    if (!userUnitHierarchyIds.length) {
      console.warn('[PERSON_COUNT] ⚠️ No user unit hierarchy IDs found');
      return 0;
    }

    // Build the filter with both contact_type and Tanzeemi_Unit conditions
    const contactTypeFilter = `filter[contact_type][_eq]=${linkedToId}`;
    const unitFilter = `filter[Tanzeemi_Unit][_in]=${userUnitHierarchyIds.join(',')}`;
    const queryString = `/items/Person?${contactTypeFilter}&${unitFilter}`;
    
    console.log(`[PERSON_COUNT] 🔗 Query string: ${queryString}`);

    // Use directApiRequest to fetch the persons (with limit=0 to get count)
    const response = await directApiRequest<{ data: any[], meta?: { filter_count?: number } }>(
      queryString,
      'GET'
    );
    console.log(`[PERSON_COUNT] 📥 Response received:`, response);

    let personCount = 0;
    if (response.meta?.filter_count !== undefined) {
      personCount = response.meta.filter_count;
      console.log(`[PERSON_COUNT] ✅ Success! Person count from meta: ${personCount}`);
    } else if (response.data) {
      personCount = response.data.length;
      console.log(`[PERSON_COUNT] ✅ Success! Person count from data length: ${personCount}`);
    } else {
      throw new Error('No count information in response');
    }

    console.log(`[PERSON_COUNT] 🎯 Final person count result: ${personCount}`);
    return personCount;
  } catch (error: any) {
    console.error('[PERSON_COUNT] 💥 Critical error in fetchPersonCount:', error);
    console.error('[PERSON_COUNT] 📋 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return rejectWithValue(error.message || 'Failed to fetch person count');
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
    resetTransferStatus(state) {
      state.transferStatus = 'idle';
      state.transferError = null;
      state.checkTransferStatus = 'idle';
      state.checkTransferError = null;
      state.createTransferStatus = 'idle';
      state.createTransferError = null;
      // Also clear existing transfers to start with a fresh state
      state.existingTransfers = [];
    },
    resetRukunUpdateStatus(state) {
      state.rukunUpdateStatus = 'idle';
      state.rukunUpdateError = null;
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
      })
      // Transfer Rukun
      .addCase(transferRukun.pending, state => {
        state.transferStatus = 'loading';
        state.transferError = null;
      })
      .addCase(transferRukun.fulfilled, (state, action: PayloadAction<Person>) => {
        state.transferStatus = 'succeeded';
        personsAdapter.upsertOne(state, action.payload);
      })
      .addCase(transferRukun.rejected, (state, action) => {
        state.transferStatus = 'failed';
        state.transferError = action.payload ?? 'Failed to transfer rukun';
      })
      
      // Check Existing Transfer
      .addCase(checkExistingTransfer.pending, state => {
        state.checkTransferStatus = 'loading';
        state.checkTransferError = null;
      })
      .addCase(checkExistingTransfer.fulfilled, (state, action: PayloadAction<RukunTransferRequest[]>) => {
        state.checkTransferStatus = 'succeeded';
        
        // Ensure we're setting a valid array and log for debugging
        console.log('[PersonsSlice] Saving existing transfers:', action.payload);
        
        // Only set existingTransfers if we got a valid array
        if (Array.isArray(action.payload)) {
          state.existingTransfers = action.payload;
        } else {
          console.warn('[PersonsSlice] Invalid existingTransfers data:', action.payload);
          state.existingTransfers = [];
        }
      })
      .addCase(checkExistingTransfer.rejected, (state, action) => {
        state.checkTransferStatus = 'failed';
        state.checkTransferError = action.payload ?? 'Failed to check existing transfer requests';
      })
      
      // Create Rukun Transfer Request
      .addCase(createRukunTransfer.pending, state => {
        state.createTransferStatus = 'loading';
        state.createTransferError = null;
      })
      .addCase(createRukunTransfer.fulfilled, (state, action: PayloadAction<RukunTransferRequest>) => {
        state.createTransferStatus = 'succeeded';
        state.existingTransfers.push(action.payload);
      })
      .addCase(createRukunTransfer.rejected, (state, action) => {
        state.createTransferStatus = 'failed';
        state.createTransferError = action.payload ?? 'Failed to create transfer request';
      })
      // Fetch Rukun Update Request
      .addCase(fetchRukunUpdateRequest.pending, (state, action) => {
        console.log(`[PersonsSlice] 🔄 fetchRukunUpdateRequest.pending for contact_id: ${action.meta.arg}`);
        state.rukunUpdateStatus = 'loading';
        state.rukunUpdateError = null;
      })
      .addCase(fetchRukunUpdateRequest.fulfilled, (state, action) => {
        console.log(`[PersonsSlice] ✅ fetchRukunUpdateRequest.fulfilled for contact_id: ${action.meta.arg}`, {
          hasPayload: !!action.payload,
          payloadStatus: action.payload?.status,
          payloadId: action.payload?.id
        });
        state.rukunUpdateStatus = 'succeeded';
        if (action.payload && action.meta.arg) {
          state.rukunUpdateRequests[action.meta.arg] = action.payload;
          console.log(`[PersonsSlice] 💾 Stored Rukun Update Request in state for contact_id: ${action.meta.arg}`);
        } else {
          console.log(`[PersonsSlice] 📭 No Rukun Update Request to store for contact_id: ${action.meta.arg}`);
        }
      })
      .addCase(fetchRukunUpdateRequest.rejected, (state, action) => {
        console.log(`[PersonsSlice] ❌ fetchRukunUpdateRequest.rejected for contact_id: ${action.meta.arg}`, {
          error: action.payload,
          errorMessage: action.error?.message
        });
        state.rukunUpdateStatus = 'failed';
        state.rukunUpdateError = action.payload ?? 'Failed to fetch Rukun Update Request';
      })
      // Submit Rukun Update Request
      .addCase(submitRukunUpdateRequest.pending, (state, action) => {
        console.log(`[PersonsSlice] 🔄 submitRukunUpdateRequest.pending for contact_id: ${action.meta.arg.contact_id}`);
        state.rukunUpdateStatus = 'loading';
        state.rukunUpdateError = null;
      })
      .addCase(submitRukunUpdateRequest.fulfilled, (state, action) => {
        console.log(`[PersonsSlice] ✅ submitRukunUpdateRequest.fulfilled for contact_id: ${action.payload.contact_id}`, {
          requestId: action.payload.id,
          status: action.payload.status,
          hasName: !!action.payload.Name
        });
        state.rukunUpdateStatus = 'succeeded';
        if (action.payload && action.payload.contact_id) {
          state.rukunUpdateRequests[action.payload.contact_id] = action.payload;
          console.log(`[PersonsSlice] 💾 Updated Rukun Update Request in state for contact_id: ${action.payload.contact_id}`);
        }
      })
      .addCase(submitRukunUpdateRequest.rejected, (state, action) => {
        console.log(`[PersonsSlice] ❌ submitRukunUpdateRequest.rejected for contact_id: ${action.meta.arg.contact_id}`, {
          error: action.payload,
          errorMessage: action.error?.message
        });
        state.rukunUpdateStatus = 'failed';
        state.rukunUpdateError = action.payload ?? 'Failed to submit Rukun Update Request';
      })
      // Fetch Person Count
      .addCase(fetchPersonCount.pending, state => {
        state.personCountStatus = 'loading';
        state.personCountError = null;
      })
      .addCase(fetchPersonCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.personCountStatus = 'succeeded';
        state.personCount = action.payload;
      })
      .addCase(fetchPersonCount.rejected, (state, action) => {
        state.personCountStatus = 'failed';
        state.personCountError = action.payload ?? 'Failed to fetch person count';
      });
  },
});

export const { 
  clearPersons, 
  resetCreateStatus, 
  resetUpdateStatus,
  resetTransferStatus,
  resetRukunUpdateStatus,
  setUserDetails,
  clearUserDetails
} = personsSlice.actions;

// Selectors
const selectPersonsState = (state: RootState): PersonsState => {
  try {
    return (state as any).persons ?? (initialState as PersonsState);
  } catch (error) {
    console.error('Error selecting persons state:', error);
    return initialState as PersonsState;
  }
};

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

// Transfer selectors
export const selectTransferStatus = (state: RootState) => selectPersonsState(state).transferStatus;
export const selectTransferError = (state: RootState) => selectPersonsState(state).transferError;

// New Transfer Request selectors
export const selectCheckStatus = (state: RootState) => selectPersonsState(state).checkTransferStatus;
export const selectCheckError = (state: RootState) => selectPersonsState(state).checkTransferError;
export const selectCreateStatus = (state: RootState) => selectPersonsState(state).createTransferStatus;
export const selectCreateError = (state: RootState) => selectPersonsState(state).createTransferError;
export const selectExistingTransfers = (state: RootState) => selectPersonsState(state).existingTransfers;
export const selectExistingTransfer = (state: RootState, contactId: number) => 
  selectPersonsState(state).existingTransfers.find(transfer => transfer.contact_id === contactId);

// Rukun Update selectors
export const selectRukunUpdateStatus = (state: RootState) => {
  try {
    return selectPersonsState(state).rukunUpdateStatus;
  } catch (error) {
    console.error('Error selecting rukun update status:', error);
    return 'idle';
  }
};

export const selectRukunUpdateError = (state: RootState) => {
  try {
    return selectPersonsState(state).rukunUpdateError;
  } catch (error) {
    console.error('Error selecting rukun update error:', error);
    return null;
  }
};

export const selectRukunUpdateRequests = (state: RootState) => {
  try {
    return selectPersonsState(state).rukunUpdateRequests;
  } catch (error) {
    console.error('Error selecting rukun update requests:', error);
    return {};
  }
};

export const selectRukunUpdateRequestByContactId = (state: RootState, contactId: number) => {
  try {
    console.log(`[PersonsSlice] 🔍 selectRukunUpdateRequestByContactId called for contact_id: ${contactId}`);
    const requests = selectPersonsState(state).rukunUpdateRequests;
    const request = requests ? requests[contactId] : null;
    
    console.log(`[PersonsSlice] 📋 Rukun Update Request selector result for contact_id: ${contactId}:`, {
      found: !!request,
      status: request?.status,
      requestId: request?.id,
      hasName: !!request?.Name,
      totalRequestsInState: Object.keys(requests || {}).length
    });
    
    return request;
  } catch (error) {
    console.error(`[PersonsSlice] ❌ Error selecting rukun update request by contact ID ${contactId}:`, error);
    return null;
  }
};

// Person count selectors
export const selectPersonCountStatus = (state: RootState) => selectPersonsState(state).personCountStatus;
export const selectPersonCountError = (state: RootState) => selectPersonsState(state).personCountError;
export const selectPersonCount = (state: RootState) => selectPersonsState(state).personCount;

export default personsSlice.reducer;