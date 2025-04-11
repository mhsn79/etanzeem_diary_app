import { RFValue } from 'react-native-responsive-fontsize';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Standard screen dimensions for responsive calculations
const STANDARD_SCREEN_HEIGHT = 680;
const STANDARD_SCREEN_WIDTH = 375;

// Color palette
const COLORS = {
  primary: '#008CFF',
  secondary: '#E9E9E9',
  tertiary: '#0BA241',
  background: '#FFFFFF',
  black: '#000000',
  white: '#FFFFFF',
  textSecondary: '#666666',
  error: '#E63946',
  success: '#0BA241',
  border: '#E0E0E0',
  lightGray: '#E0E0E0',
  lightGray2: '#D7D7D7',
  lightPrimary: 'rgba(0, 140, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.1)',
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
};

// Spacing
const SPACING = {
  xs: hp('0.5%'),
  sm: hp('1%'),
  sm2: hp('1.5%'),
  md: hp('2%'),
  lg: hp('3%'),
  xl: hp('4%'),
};

// Border radius
const BORDER_RADIUS = {
  sm: wp('2%'),
  md: wp('4%'),
  lg: wp('6%'),
  xl: wp('8%'),
};

export {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
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

export {
  SIZES,
  SHADOWS,
}; 