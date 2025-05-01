// Screen Groups
export const ROUTE_GROUPS = {
  AUTH: 'auth',
  MAIN: 'main',
  STACK: 'screens/(stack)',
  TABS: 'screens/(tabs)',
} as const;

// Screen Routes
export const ROUTES = {
  // Auth Routes
  LOGIN: `/${ROUTE_GROUPS.AUTH}/LoginScreen`,
  SPLASH: '/splash',
  INDEX: '/',

  // Main Routes
  DASHBOARD: `/${ROUTE_GROUPS.TABS}/Dashboard`,
  PROFILE: `/${ROUTE_GROUPS.STACK}/ProfileView`,
  PROFILE_EDIT: `/${ROUTE_GROUPS.STACK}/ProfileEdit`,

  // Stack Routes
  REPORTS_MANAGEMENT: `/${ROUTE_GROUPS.STACK}/ReportsManagementScreen`,
  ALL_REPORTS: `/${ROUTE_GROUPS.STACK}/AllReportsScreen`,
  CREATE_REPORT: `/${ROUTE_GROUPS.STACK}/CreateReportScreen`,
  SUBMITTED_REPORT: `/${ROUTE_GROUPS.STACK}/SubmittedReportScreen`,
  INCOME: `/${ROUTE_GROUPS.STACK}/Income`,
  MEETINGS: `/${ROUTE_GROUPS.STACK}/Meetings`,
  UNIT_SELECTION: `/${ROUTE_GROUPS.STACK}/UnitSelection`,
  WORKFORCE: `/${ROUTE_GROUPS.STACK}/Workforce`,
  RUKUN_VIEW: `/${ROUTE_GROUPS.STACK}/RukunView`,
  RUKUN_ADD_EDIT: `/${ROUTE_GROUPS.STACK}/RukunAddEdit`,
} as const;

// Type Definitions
export type RouteGroup = typeof ROUTE_GROUPS[keyof typeof ROUTE_GROUPS];
export type Route = typeof ROUTES[keyof typeof ROUTES];

// Helper Functions
export const getRoute = (route: Route, params?: Record<string, string>) => {
  if (!params) return route;
  
  const queryString = new URLSearchParams(params).toString();
  return `${route}?${queryString}`;
};

// Example usage:
/*
import { ROUTES, getRoute } from '../constants/navigation';

// Basic navigation
router.push(ROUTES.CREATE_REPORT);

// Navigation with params
router.push(getRoute(ROUTES.CREATE_REPORT, { 
  reportId: '123',
  mode: 'edit' 
}));
*/ 