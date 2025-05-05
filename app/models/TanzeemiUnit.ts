export interface TanzeemiUnit {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  level?: number;
  level_id?: number | null;
  zaili_unit_hierarchy?: any[] | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  
  // Additional API fields that might be present
  Name?: string;
  Description?: string;
  Parent_id?: number | null;
  Level?: number;
  Level_id?: number | null;
  Status?: string;
  date_created?: string;
  date_updated?: string;
  [key: string]: any; // Allow for any additional fields
}

export interface TanzeemiUnitResponse {
  data: TanzeemiUnit[];
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

export interface SingleTanzeemiUnitResponse {
  data: TanzeemiUnit;
}