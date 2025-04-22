// Enhanced Activity interface
export interface Activity {
    id: number;
    status: 'draft' | 'published' | 'archived' | string;
    activity_date_and_time: string; // ISO string
    location_coordinates: string | null; // lat,lng
    activity_details: string | null;
    created_at: string;
    updated_at: string;
    user_created: string;
    user_updated: string | null;
    // Add any other fields that might be returned by the API
    title?: string;
    description?: string;
    location_name?: string;
    activity_type?: string;
    participants?: number[];
    attachments?: string[];
    [key: string]: any; // Allow for additional fields
  }
  
  // Directus response type
  interface DirectusResponse<T> {
    data: T;
    meta: {
      total_count: number;
      filter_count: number;
    };
  }
  