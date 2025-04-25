export interface Person {
  id: number;
  name: string;
  parent?: string;
  dob?: string;
  cnic?: string;
  unit?: string | number;
  status?: string;
  address?: string;
  phone?: string;
  whatsApp?: string;
  sms?: string;
  email?: string;
  picture?: string | null;
  created_at?: string;
  updated_at?: string;
  
  // Additional API fields that might be present
  Name?: string;
  Address?: string;
  Phone_Number?: string;
  Email?: string;
  Father_Name?: string;
  Date_of_birth?: string;
  CNIC?: string;
  Tanzeemi_Unit?: string | number;
  Gender?: string;
  Education?: string;
  Profession?: string;
  User_id?: string;
  date_created?: string;
  date_updated?: string;
  [key: string]: any; // Allow for any additional fields
}

export interface PersonResponse {
  data: Person[];
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

export interface SinglePersonResponse {
  data: Person;
}

export interface CreatePersonPayload {
  name: string;
  parent?: string;
  dob?: string;
  cnic?: string;
  unit?: string;
  status?: string;
  address?: string;
  phone?: string;
  whatsApp?: string;
  sms?: string;
  email?: string;
  picture?: string | null;
}

export interface UpdatePersonPayload extends Partial<CreatePersonPayload> {
  id: number;
}