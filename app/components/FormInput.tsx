import React from 'react';
import { View, TextInput, StyleSheet, Text, I18nManager, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import UrduText from './UrduText';

export interface FormInputProps {
  mainTitle?: string;
  inputTitle: string;
  value: string;
  onChange: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  direction?: 'rtl' | 'ltr';
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
  rightIcon?: React.ReactNode;
  editable?: boolean;
  disabled?: boolean;
  error?: string | null;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  helpText?: string;
  loading?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  mainTitle,
  inputTitle,
  value,
  onChange,
  onBlur,
  placeholder = '',
  direction = 'rtl',
  keyboardType = 'default',
  maxLength,
  rightIcon,
  editable = true,
  disabled = false,
  error,
  required,
  multiline = false,
  numberOfLines,
  helpText,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {mainTitle && <UrduText style={styles.mainTitle}>{mainTitle}</UrduText>}
        <View style={styles.titleRow}>
          {required && <Text style={styles.requiredStar}>*</Text>}
          <UrduText style={styles.inputTitle}>{inputTitle}</UrduText>
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
            { textAlign: direction === 'rtl' ? 'right' : 'left' },
            disabled ? styles.disabledInput : null
          ]}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          keyboardType={keyboardType}
          maxLength={maxLength}
          textAlignVertical="center"
          editable={editable && !disabled && !loading}
          multiline={multiline}
          numberOfLines={numberOfLines || (multiline ? 3 : 1)}
        />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helpText && <UrduText style={styles.helpText}>{helpText}</UrduText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    position: 'absolute',
    right: SPACING.md,
    height: '100%',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: SPACING.sm,
    lineHeight: 40,
    width: '100%', // Ensure the container takes full width
    alignItems: 'flex-end', // Align children to the end (right in LTR, left in RTL)
  },
  titleRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Align to the right for RTL support
    width: '100%', // Ensure the row takes full width
  },
  mainTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right', // Changed to right alignment
    lineHeight: 40,
    width: '100%', // Ensure the title takes full width
  },
  inputTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'right', // Changed to right alignment
  },
  requiredStar: {
    color: COLORS.error || 'red',
    marginRight: 4, // Changed from marginLeft to marginRight for RTL support
    marginLeft: 2, // Small margin on left for spacing
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
  disabledInput: {
    opacity: 0.7,
    color: COLORS.textSecondary,
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
    marginRight: 4, // Changed from marginLeft to marginRight for RTL support
    textAlign: 'right', // Ensure error text is right-aligned
    width: '100%', // Ensure the error text takes full width
  },
  helpText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginRight: 4, // Changed from marginLeft to marginRight for RTL support
    textAlign: 'right',
    width: '100%', // Ensure the help text takes full width
  },
});

export default FormInput; 