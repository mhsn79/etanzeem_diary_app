import React from 'react';
import { Platform, TouchableOpacity, Dimensions, StyleSheet, View, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeIconBlack from '../../assets/images/home-icon-black.svg';
import ArkanIconBlack from '../../assets/images/arkan-icon-black.svg';
import ActivitiesIconBlack from '../../assets/images/activities-icon-black.svg';
import ReportIcon2Black from '../../assets/images/report-icon-2-black.svg';
import HomeIconWhite from '../../assets/images/home-icon-white.svg';
import ArkanIconWhite from '../../assets/images/arkan-icon-white.svg';
import ActivitiesIconWhite from '../../assets/images/activities-icon-white.svg';
import ReportIcon2White from '../../assets/images/report-icon-2-white.svg';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const VALID_LABELS = ['ڈیش بورڈ', 'ارکان', 'سرگرمیاں', 'کارکردگی'] as const;
type ValidLabel = typeof VALID_LABELS[number];

function getIcon(label: ValidLabel, focused: boolean) {
  const iconSize = wp(6);
  const iconStyle = { width: iconSize, height: iconSize };

  const icons = {
    'ڈیش بورڈ': focused ? HomeIconWhite : HomeIconBlack,
    'ارکان': focused ? ArkanIconWhite : ArkanIconBlack,
    'سرگرمیاں': focused ? ActivitiesIconWhite : ActivitiesIconBlack,
    'کارکردگی': focused ? ReportIcon2White : ReportIcon2Black,
  };

  if (!VALID_LABELS.includes(label)) {
    console.warn(`Invalid tab label: ${label}. Expected one of: ${VALID_LABELS.join(', ')}`);
    return null;
  }

  const IconComponent = icons[label];
  return <IconComponent style={iconStyle} />;
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const displayedRoutes = state.routes.slice(0, 4);

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Platform.select({
            ios: Math.max(insets.bottom, SPACING.sm),
            android: insets.bottom + SPACING.xs,
          }),
        },
      ]}
    >
      {displayedRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;

        if (!VALID_LABELS.includes(label as any)) {
          console.warn(`Skipping route with invalid label: ${label}`);
          return null;
        }

        const validLabel = label as ValidLabel;
        const icon = getIcon(validLabel, isFocused);
        if (!icon) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={validLabel}
            onPress={onPress}
            key={route.key}
            style={styles.tabContainer}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.tabBarButton,
                isFocused && styles.tabBarButtonFocused,
                isFocused && styles.tabBarButtonShadow,
              ]}
            >
              <View style={styles.iconContainer}>{icon}</View>
              {isFocused && <Text style={styles.textStyle} numberOfLines={1}>{validLabel}</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.xs,
    ...SHADOWS.medium,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
  },
  tabBarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: hp(6),
    width: '100%',
    overflow: 'hidden', // Ensure clipping for borderRadius
  },
  tabBarButtonFocused: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg, // Explicitly set for clarity
    width: wp(30), // Consistent with first code
    overflow: 'hidden', // Critical for Android borderRadius
  },
  tabBarButtonShadow: {
    ...SHADOWS.small,
    ...(Platform.OS === 'android' && { elevation: 2 }), // Lowered elevation to reduce interference
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(8),
    height: wp(8),
  },
  textStyle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginLeft: SPACING.xs,
    flexShrink: 1,
  },
});