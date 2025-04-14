// Common Images
export const COMMON_IMAGES = {
  // App Icons
  logo: require('../../assets/images/jamat-logo.png'),
  smallTarazu: require('../../assets/images/small-tarazu.png'),
  splashLogo: require('../../assets/images/splash-icon.png'),
  splashLogoDark: require('../../assets/images/splash-icon-dark.png'),
  favicon: require('../../assets/images/favicon.png'),
  icon: require('../../assets/images/icon.png'),
  adaptiveIcon: require('../../assets/images/adaptive-icon.png'),
  
  // Status Icons
  success: require('../../assets/images/checkmark-badge.svg'),
  error: require('../../assets/images/modal-close-icon.svg'),
  warning: require('../../assets/images/modal-close-icon.svg'),
  
  // UI Icons
  edit: require('../../assets/images/edit-icon.png'),
  edit2: require('../../assets/images/edit-icon-2.png'),
  plus: require('../../assets/images/plus-icon.svg'),
  minus: require('../../assets/images/minus-icon.svg'),
  close: require('../../assets/images/modal-close-icon.svg'),
  back: require('../../assets/images/left-up-arrow.png'),
  forward: require('../../assets/images/left-up-arrow.png'),
  search: require('../../assets/images/magnifier.png'),
  add: require('../../assets/images/add-icon.png'),
  
  // Profile Icons
  profile: require('../../assets/images/user-icon.png'),
  avatar: require('../../assets/images/avatar.png'),
  multipleUsers: require('../../assets/images/multiple-users.png'),
  
  // Report Icons
  report: require('../../assets/images/report-icon-1.png'),
  report2: require('../../assets/images/report-icon-2.png'),
  
  // Workforce Icons
  greenArkan: require('../../assets/images/green-arkan-icon.png'),
  redTarget: require('../../assets/images/red-target-icon.png'),
  yellowArkan: require('../../assets/images/yellow-arkan-icon.png'),
  arkan: require('../../assets/images/arkan-icon.png'),
  
  // Location Icons
  locationBlue: require('../../assets/images/location-icon-blue.png'),
  locationYellow: require('../../assets/images/location-icon-yellow.png'),
  
  // Communication Icons
  phone: require('../../assets/images/phone-icon.png'),
  sms: require('../../assets/images/sms-icon.png'),
  whatsapp: require('../../assets/images/whatsapp-icon.png'),
  transfer: require('../../assets/images/transfer-icon.png'),
  
  // Pattern
  pattern: require('../../assets/images/pattern.png'),
};

// SVG Icons
export const SVG_ICONS = {
  // UI Icons
  edit: require('../../assets/images/edit-icon.svg'),
  plus: require('../../assets/images/plus-icon.svg'),
  minus: require('../../assets/images/minus-icon.svg'),
  close: require('../../assets/images/modal-close-icon.svg'),
  back: require('../../assets/images/left-up-arrow-blue.svg'),
  backWhite: require('../../assets/images/left-up-arrow-white.svg'),
  
  // Status Icons
  success: require('../../assets/images/checkmark-badge.svg'),
  
  // App Icons
  smallTarazu: require('../../assets/images/small-tarazu.svg'),
  
  // Location Icons
  locationBlue: require('../../assets/images/location-icon-blue.svg'),
  locationYellow: require('../../assets/images/location-icon-yellow.svg'),
  
  // Report Icons
  report1: require('../../assets/images/report-icon-1.svg'),
  report2Black: require('../../assets/images/report-icon-2-black.svg'),
  report2White: require('../../assets/images/report-icon-2-white.svg'),
  
  // Navigation Icons
  homeBlack: require('../../assets/images/home-icon-black.svg'),
  homeWhite: require('../../assets/images/home-icon-white.svg'),
  arkanBlack: require('../../assets/images/arkan-icon-black.svg'),
  arkanWhite: require('../../assets/images/arkan-icon-white.svg'),
  activitiesBlack: require('../../assets/images/activities-icon-black.svg'),
  activitiesWhite: require('../../assets/images/activities-icon-white.svg'),
  user: require('../../assets/images/user-icon.svg'),
  target: require('../../assets/images/target-icon.svg'),
};

// Image Types
export type ImageKey = keyof typeof COMMON_IMAGES;
export type SvgIconKey = keyof typeof SVG_ICONS;

// Image Helper Functions
export const getImage = (key: ImageKey) => COMMON_IMAGES[key];
export const getSvgIcon = (key: SvgIconKey) => SVG_ICONS[key];

// Example usage:
/*
import { COMMON_IMAGES, SVG_ICONS, getImage, getSvgIcon } from '../constants/images';

// Using PNG/JPG images
<Image source={COMMON_IMAGES.logo} />
<Image source={getImage('logo')} />

// Using SVG icons
<SVG_ICONS.edit width={24} height={24} />
<getSvgIcon('edit') width={24} height={24} />
*/ 