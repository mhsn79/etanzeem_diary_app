import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './Header';
import { BORDER_RADIUS, COLORS } from '../constants/theme';

interface ScreenLayoutProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  headerStyle?: object;
  containerStyle?: object;
  showHeader?: boolean;
  borderRadius?: number;
}

const ScreenLayout = ({
  title,
  onBack,
  children,
  containerStyle,
  showHeader = true,
  borderRadius = BORDER_RADIUS.md,
}: ScreenLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, containerStyle]}
    >
      {showHeader && (
        <View style={[styles.headerSection, { paddingTop: insets.top }]}>
          <Header
            title={title}
            onBack={onBack}
            borderRadius={borderRadius}
            containerStyle={{ backgroundColor: COLORS.primary }}
          />
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});

export default ScreenLayout; 