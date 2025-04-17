import React, { ReactNode, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './Header';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

interface ScreenLayoutProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  /** Extra styles for the outer <KeyboardAvoidingView> */
  containerStyle?: object;
  /** Extra styles for the Header wrapper */
  headerStyle?: object;
  showHeader?: boolean;
  borderRadius?: number;
  /** iOS & Android status‑bar content style */
  statusBarStyle?: 'light-content' | 'dark-content' | 'default';
  /** Background tint for the Header *and* StatusBar */
  statusBarBackgroundColor?: string;
  /** Hide the native status‑bar entirely */
  statusBarHidden?: boolean;
  /** Enable dev colour‑cycling for header backgrounds (green→pink→red→blue) */
  debugCycleColors?: boolean;
}

/**
 * Cross‑platform Screen wrapper
 * -------------------------------------------------------------
 * • Provides an optional Header with configurable bottom‑corner radii.
 * • Keeps the StatusBar tinted & in‑sync on both iOS and Android.
 * • Handles keyboard avoidance + safe‑area insets automatically.
 */
const ScreenLayout = ({
  title,
  onBack,
  children,
  containerStyle,
  headerStyle,
  showHeader = true,
  borderRadius = BORDER_RADIUS.lg,
  statusBarStyle = 'light-content',
  statusBarBackgroundColor = COLORS.primary,
  statusBarHidden = false,
  debugCycleColors = false,
}: ScreenLayoutProps) => {
  const insets = useSafeAreaInsets();

  // ---------- DEBUG COLOUR‑CYCLING -----------------------------------------
  const cycle = useRef(0);
  const headerColor = useMemo(() => {
    if (!debugCycleColors) return statusBarBackgroundColor;
    const palette = ['green', 'pink', 'red', 'blue'] as const;
    const colour = palette[cycle.current % palette.length];
    cycle.current += 1;
    return colour;
  }, [debugCycleColors, statusBarBackgroundColor]);

  // Compute iOS keyboard offset just once
  const keyboardOffset = useMemo(() => (Platform.OS === 'ios' ? insets.top : 0), [insets.top]);

  // ---------- RENDER --------------------------------------------------------
  return (
    <View style={styles.flex1}>
      {/* Native StatusBar */}
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === 'android' ? headerColor : 'transparent'}
        translucent={Platform.OS === 'android'}
        hidden={statusBarHidden}
      />

      {/* iOS — paint the area behind the translucent status‑bar */}
      {!statusBarHidden && Platform.OS === 'ios' && (
        <View style={[styles.statusBarSpacer, { height: insets.top, backgroundColor: headerColor }]} />
      )}

      {/* Layout & content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
        style={[styles.container, containerStyle]}
      >
        {showHeader && (
          <View
            style={[
              styles.headerWrapper,
              styles.headerPadding,
              {
                backgroundColor: headerColor,
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
              },
              headerStyle,
            ]}
          >
            <Header title={title} onBack={onBack} containerStyle={styles.transparent} />
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ------------------------- STYLES ------------------------------------------
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  /**
   * Header wrapper: will receive dynamic colour & radii via props.
   * We keep static props separate so they live in StyleSheet.
   */
  headerWrapper: {
    overflow: 'hidden', // ensure radii clip children
  },
  /** Platform‑specific padding for header */
  headerPadding: Platform.select({
    ios: {
      paddingBottom: SPACING.sm,
    },
    default: {
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
  }),
  /** Fills the translucent iOS status‑bar area */
  statusBarSpacer: {
    width: '100%',
  },
  content: {
    flex: 1,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
});

export default ScreenLayout;
