import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import UrduText from './UrduText';

interface ActivityActionButtonProps {
  text: string;
  onPress: () => void;
  iconComponent?: React.ReactNode;
}

const ActivityActionButton: React.FC<ActivityActionButtonProps> = ({ text, onPress, iconComponent }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <UrduText style={styles.text}>{text}</UrduText>
      {iconComponent && iconComponent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    paddingVertical: 8,
    width: '30%',
    justifyContent: 'center',
  },
  icon: {
    marginLeft: 10,
  },
  text: {
    fontWeight: '600',
    lineHeight: TYPOGRAPHY.lineHeight.lg,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginRight:SPACING.sm
  },
});

export default ActivityActionButton;
