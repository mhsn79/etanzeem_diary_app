import { RFValue } from 'react-native-responsive-fontsize';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Standard screen dimensions for responsive calculations
const STANDARD_SCREEN_HEIGHT = 680;
const STANDARD_SCREEN_WIDTH = 375;

// Color palette
const COLORS = {
  // Primary colors
  primary: '#008CFF',
  secondary: '#E9E9E9',
  tertiary: '#0BA241',
  orange: '#FFA500',
  
  // Background colors
  background: '#FFFFFF',
  black: '#000000',
  white: '#FFFFFF',
  
  // Text colors
  textPrimary: '#000000',
  textSecondary: '#666666',
  
  // Status colors
  error: '#E63946',
  success: '#0BA241',
  warning: '#FFA500',
  info: '#008CFF',
  disabled: '#CCCCCC',
  
  // Border and divider colors
  border: '##EBEBEB',
  lightGray: '#EBEBEB',
  lightGray2: '#D7D7D7',
  
  // Transparent colors
  lightPrimary: 'rgba(0, 140, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Typography
const TYPOGRAPHY = {
  fontFamily: {
    regular: 'JameelNooriNastaleeq',
    bold: 'JameelNooriNastaleeq',
    kasheeda: 'noori-kasheed',
  },
  fontSize: {
    xs: RFValue(10, STANDARD_SCREEN_HEIGHT),
    sm: RFValue(12, STANDARD_SCREEN_HEIGHT),
    md: RFValue(14, STANDARD_SCREEN_HEIGHT),
    lg: RFValue(16, STANDARD_SCREEN_HEIGHT),
    xl: RFValue(18, STANDARD_SCREEN_HEIGHT),
    xxl: RFValue(20, STANDARD_SCREEN_HEIGHT),
    xxxl: RFValue(22, STANDARD_SCREEN_HEIGHT),
  },
  lineHeight: {
    xs: RFValue(14, STANDARD_SCREEN_HEIGHT),
    sm: RFValue(16, STANDARD_SCREEN_HEIGHT),
    md: RFValue(18, STANDARD_SCREEN_HEIGHT),
    lg: RFValue(20, STANDARD_SCREEN_HEIGHT),
    xl: RFValue(22, STANDARD_SCREEN_HEIGHT),
    xxl: RFValue(24, STANDARD_SCREEN_HEIGHT),
    xxxl: RFValue(26, STANDARD_SCREEN_HEIGHT),
  },
};

// Spacing
const SPACING = {
  xs: hp('0.5%'),
  sm: hp('1%'),
  sm2: hp('1.5%'),
  md: hp('2%'),
  lg: hp('3%'),
  xl: hp('4%'),
  xxl: hp('5%'),
  xxxl: hp('6%'),
  xxxxl: hp('7%'),
};

// Border radius
const BORDER_RADIUS = {
  xs: wp('1%'),
  sm: wp('2%'),
  md: wp('4%'),
  lg: wp('6%'),
  xl: wp('8%'),
  round: 9999,
};

// Sizes
const SIZES = {
  // Responsive component sizes
  button: {
    height: hp('5%'),
    minWidth: wp('30%'),
  },
  input: {
    height: hp('5%'),
    width: wp('80%'),
  },
  icon: {
    sSmall:wp('4%'),
    small: wp('5%'),
    medium: wp('7%'),
    large: wp('10%'),
  },
  
  // Layout sizes
  header: {
    height: hp('8%'),
  },
  footer: {
    height: hp('8%'),
  },
  card: {
    width: wp('90%'),
    padding: hp('2%'),
  },
  
  // Modal sizes
  modal: {
    width: wp('85%'),
    height: hp('45%'),
  },
};

// Shadows
const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6.27,
    elevation: 8,
  },
};

// Animation
const ANIMATION = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'ease-in-out',
  },
};

// Z-index
const Z_INDEX = {
  modal: 1000,
  dropdown: 999,
  overlay: 998,
  header: 100,
  footer: 100,
};

export {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SIZES,
  SHADOWS,
  ANIMATION,
  Z_INDEX,
};

// Example usage:
/*
import { COLORS, TYPOGRAPHY, SPACING, SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.h1,
    lineHeight: TYPOGRAPHY.lineHeight.h1,
    color: COLORS.text,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  button: {
    height: SIZES.button.height,
    minWidth: SIZES.button.minWidth,
    borderRadius: BORDER_RADIUS.button,
    ...SHADOWS.small,
  },
});
*/ 