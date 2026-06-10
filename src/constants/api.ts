// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';
export const API_TIMEOUT = 30000; // 30 seconds

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  
  // User endpoints
  USER_ME: '/users/me',
  USER_UPDATE: '/users/me',
  
  // File upload
  FILES: '/files',
  
  // Person endpoints
  PERSONS: '/items/Person',
  // PERSON_BY_EMAIL removed - we follow the correct flow: user_id -> Tanzeemi_Unit -> Nazim_id -> Person
  
  // Activity endpoints
  ACTIVITIES: '/items/Activity',
  ACTIVITY_TYPES: '/items/Activity_Type',
  
  // Tanzeemi Unit endpoints
  TANZEEMI_UNITS: '/items/Tanzeemi_Unit',
  
  // Reports endpoints
  REPORTS: '/items/Report',
  REPORT_SUBMISSIONS: '/items/Report_Submission',
  
  // QA endpoints
  QA_SUBMISSIONS: '/items/QA_Submission',
  
  // Strength endpoints
  STRENGTH: '/items/Strength',
} as const;
// Default export to prevent Expo Router from treating this as a route
export default {
  API_BASE_URL,
  API_TIMEOUT,
  ENDPOINTS
};