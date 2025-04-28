import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import UrduText from './UrduText';

export interface FormInputProps {
  mainTitle?: string;
  inputTitle: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  direction?: 'rtl' | 'ltr';
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
  rightIcon?: React.ReactNode;
  editable?: boolean;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  helpText?: string;
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
  rightIcon,
  editable = true,
  error,
  required,
  multiline = false,
  helpText,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {mainTitle && <UrduText style={styles.mainTitle}>{mainTitle}</UrduText>}
        <View style={styles.titleRow}>
          <UrduText style={styles.inputTitle}>{inputTitle}</UrduText>
          {required && <Text style={styles.requiredStar}>*</Text>}
        </View>
      </View>
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : null
      ]}>
      {rightIcon && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
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
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helpText && <UrduText style={styles.helpText}>{helpText}</UrduText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  titleContainer: {
    marginBottom: SPACING.sm,
    lineHeight: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'left',
    lineHeight: 40
  },
  inputTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  requiredStar: {
    color: COLORS.error || 'red',
    marginLeft: 4,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.small,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error || 'red',
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingHorizontal: SPACING.md,
    color: COLORS.black,
  },
  iconContainer: {
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error || 'red',
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 4,
    marginLeft: 4,
  },
  helpText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
    textAlign: 'right',
  },
});

export default FormInput; 