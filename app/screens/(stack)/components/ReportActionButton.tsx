import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import UrduText from '../../../components/UrduText';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';

interface ReportActionButtonProps {
  text: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: object;
  textStyle?: object;
}

const ReportActionButton: React.FC<ReportActionButtonProps> = ({ text, onPress, icon, style, textStyle }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
    >
      <View style={styles.content}>
        <UrduText style={[styles.text, textStyle]}>{text}</UrduText>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginHorizontal: SPACING.xs,
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    writingDirection: 'rtl',
  },
  icon: {
    marginLeft: SPACING.xs,
  },
});

export default ReportActionButton; 