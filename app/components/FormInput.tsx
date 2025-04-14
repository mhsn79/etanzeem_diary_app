import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import UrduText from './UrduText';

interface FormInputProps {
  mainTitle?: string;
  inputTitle: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  direction?: 'rtl' | 'ltr';
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
}

const FormInput: React.FC<FormInputProps> = ({
  mainTitle,
  inputTitle,
  value,
  onChange,
  placeholder = '',
  direction = 'rtl',
  keyboardType = 'default',
  maxLength,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {mainTitle && <UrduText style={styles.mainTitle}>{mainTitle}</UrduText>}
        <UrduText style={styles.inputTitle}>{inputTitle}</UrduText>
      </View>
      <TextInput
        style={[
          styles.input,
          { textAlign: direction === 'rtl' ? 'right' : 'left' }
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
      
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        textAlignVertical="center"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  titleContainer: {
    marginBottom: SPACING.sm,
    lineHeight:40,
  },
  mainTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'left',
    lineHeight:40
  },
  inputTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    height:55,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    fontFamily:TYPOGRAPHY.fontFamily.regular,
    paddingHorizontal:SPACING.md,
    color: COLORS.black,
    ...SHADOWS.small,
  },
});

export default FormInput; 