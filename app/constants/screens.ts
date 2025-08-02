import ScheduleActivitiesScreen from "../screens/(stack)/ScheduleActivitiesScreen";

// Screen Groups
export const SCREEN_GROUPS = {
  AUTH: 'auth',
  MAIN: 'main',
  STACK: 'stack',
  TABS: 'tabs',
} as const;

// Screen Names
export const SCREENS = {
  // Auth Screens
  LOGIN: 'LoginScreen',
  SPLASH: 'splash',
  INDEX: 'index',

  // Main Screens
  DASHBOARD: 'Dashboard',
  PROFILE: 'ProfileView',
  PROFILE_EDIT: 'ProfileEdit',

  // Stack Screens
  REPORTS_MANAGEMENT: 'ReportsManagementScreen',
  ALL_REPORTS: 'AllReportsScreen',
  CREATE_REPORT: 'CreateReportScreen',
  SUBMITTED_REPORT: 'SubmittedReportScreen',
  MEETING_SCREEN: 'MeetingScreen',
  ACTIVITY_SCREEN: 'ActivityScreen',
  SCHEDULE_ACTIVITIES_SCREEN:'ScheduleActivitiesScreen',
  INCOME: 'Income',
  MEETINGS: 'Meetings',
  UNIT_SELECTION: 'UnitSelection',
  WORKFORCE: 'Workforce',
  RUKUN_VIEW: 'RukunView',
  RUKUN_ADD_EDIT: 'RukunAddEdit',
  RUKAN_DETAILS: 'RukanDetails',
} as const;

// Screen Paths
export const SCREEN_PATHS = {
  // Auth Paths
  LOGIN: `/${SCREEN_GROUPS.AUTH}/${SCREENS.LOGIN}`,
  SPLASH: `/${SCREENS.SPLASH}`,
  INDEX: `/${SCREENS.INDEX}`,

  // Main Paths
  DASHBOARD: `/${SCREEN_GROUPS.MAIN}/${SCREENS.DASHBOARD}`,
  PROFILE: `/${SCREEN_GROUPS.MAIN}/${SCREENS.PROFILE}`,
  PROFILE_EDIT: `/${SCREEN_GROUPS.MAIN}/${SCREENS.PROFILE_EDIT}`,

  // Stack Paths
  REPORTS_MANAGEMENT: `/${SCREEN_GROUPS.STACK}/${SCREENS.REPORTS_MANAGEMENT}`,
  ALL_REPORTS: `/${SCREEN_GROUPS.STACK}/${SCREENS.ALL_REPORTS}`,
  CREATE_REPORT: `/${SCREEN_GROUPS.STACK}/${SCREENS.CREATE_REPORT}`,
  SUBMITTED_REPORT: `/${SCREEN_GROUPS.STACK}/${SCREENS.SUBMITTED_REPORT}`,
  MEETING_SCREEN: `/${SCREEN_GROUPS.STACK}/${SCREENS.MEETING_SCREEN}`,
  ACTIVITY_SCREEN: `/${SCREEN_GROUPS.STACK}/${SCREENS.ACTIVITY_SCREEN}`,
  SCHEDULE_ACTIVITIES_SCREEN: `/${SCREEN_GROUPS.STACK}/${SCREENS.SCHEDULE_ACTIVITIES_SCREEN}`,
  INCOME: `/${SCREEN_GROUPS.STACK}/${SCREENS.INCOME}`,
  MEETINGS: `/${SCREEN_GROUPS.STACK}/${SCREENS.MEETINGS}`,
  UNIT_SELECTION: `/${SCREEN_GROUPS.STACK}/${SCREENS.UNIT_SELECTION}`,
  WORKFORCE: `/${SCREEN_GROUPS.STACK}/${SCREENS.WORKFORCE}`,
  RUKUN_VIEW: `/${SCREEN_GROUPS.STACK}/${SCREENS.RUKUN_VIEW}`,
  RUKUN_ADD_EDIT: `/${SCREEN_GROUPS.STACK}/${SCREENS.RUKUN_ADD_EDIT}`,
  RUKAN_DETAILS: `/${SCREEN_GROUPS.STACK}/${SCREENS.RUKAN_DETAILS}`,
} as const;

// Screen Titles (in Urdu)
export const SCREEN_TITLES = {
  [SCREENS.DASHBOARD]: 'ڈیش بورڈ',
  [SCREENS.PROFILE]: 'پروفائل',
  [SCREENS.PROFILE_EDIT]: 'پروفائل میں ترمیم کریں',
  [SCREENS.REPORTS_MANAGEMENT]: 'رپورٹس',
  [SCREENS.ALL_REPORTS]: 'تمام رپورٹس',
  [SCREENS.CREATE_REPORT]: 'رپورٹ بنائیں',
  [SCREENS.SUBMITTED_REPORT]: 'جمع شدہ رپورٹس',
  [SCREENS.INCOME]: 'آمدنی',
  [SCREENS.MEETINGS]: 'اجلاسات',
  [SCREENS.UNIT_SELECTION]: 'تنظیمی ہیئت',
  [SCREENS.WORKFORCE]: 'تنظیمی قوت',
  [SCREENS.RUKUN_VIEW]: 'ارکان',
  [SCREENS.RUKUN_ADD_EDIT]: 'رکن شامل کریں',
  [SCREENS.SCHEDULE_ACTIVITIES_SCREEN]:'سرگرمی شیڈول کریں',
  [SCREENS.RUKAN_DETAILS]: 'رکن کی تفصیل'

} as const;

// Type Definitions
export type ScreenGroup = typeof SCREEN_GROUPS[keyof typeof SCREEN_GROUPS];
export type ScreenName = typeof SCREENS[keyof typeof SCREENS];
export type ScreenPath = typeof SCREEN_PATHS[keyof typeof SCREEN_PATHS];
export type ScreenTitle = typeof SCREEN_TITLES[keyof typeof SCREEN_TITLES];

// Helper Functions
export const getScreenPath = (screenName: ScreenName): ScreenPath => {
  return SCREEN_PATHS[screenName as keyof typeof SCREEN_PATHS];
};

export const getScreenTitle = (screenName: ScreenName): ScreenTitle => {
  return SCREEN_TITLES[screenName as keyof typeof SCREEN_TITLES];
};

// Example usage:
/*
import { SCREENS, SCREEN_PATHS, SCREEN_TITLES, getScreenPath, getScreenTitle } from '../constants/screens';

// Using screen names
router.push(SCREEN_PATHS.DASHBOARD);
// or
router.push(getScreenPath(SCREENS.DASHBOARD));

// Getting screen title
const title = SCREEN_TITLES[SCREENS.DASHBOARD];
// or
const title = getScreenTitle(SCREENS.DASHBOARD);
*/ 
// Default export to prevent Expo Router from treating this as a route
export default {
  SCREEN_GROUPS,
  SCREENS,
  SCREEN_PATHS,
  SCREEN_TITLES,
  getScreenPath,
  getScreenTitle
};