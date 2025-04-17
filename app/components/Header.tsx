import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UrduText from './UrduText';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  containerStyle?: object;
  contentStyle?: object;
  titleStyle?: TextStyle;
  borderRadius?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  showBack = true,
  containerStyle,
  contentStyle,
  titleStyle,
  borderRadius
}) => {
  return (
    <View style={[
      styles.container, 
      containerStyle,
      borderRadius ? {
        borderBottomLeftRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
        overflow: 'hidden'
      } : {}
    ]}>
      <View style={[styles.content, contentStyle]}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-forward" size={24} color="black" />
          </TouchableOpacity>
        )}
        <UrduText style={[styles.title, titleStyle]}>{title}</UrduText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 7,
    position: 'absolute',
    left: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '600',
    color: COLORS.background,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

export default Header; 