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
  leftIcon?: React.ReactNode;
  editable?: boolean;
  disabled?: boolean;
  error?: string | null;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  helpText?: string;
  loading?: boolean;
  layout?: 'one-line' | 'two-line';
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
  leftIcon,
  editable = true,
  disabled = false,
  error,
  required,
  multiline = false,
  numberOfLines,
  helpText,
  loading = false,
  layout = 'two-line',
}) => {
  return (
    <View style={styles.container}>
      {mainTitle && <UrduText style={styles.mainTitle}>{mainTitle}</UrduText>}
      
      {layout === 'one-line' ? (
        // One-line layout: label and input on same line
        <View style={[
          styles.inputContainer,
          styles.oneLineContainer,
          error ? styles.inputError : null
        ]}>
          <View style={styles.labelContainer}>
            {required && <Text style={styles.requiredStar}>*</Text>}
            <UrduText style={styles.inputTitle}>{inputTitle}</UrduText>
          </View>
          <View style={styles.inputWrapper}>
            {leftIcon && (
              <View style={styles.leftIconContainer}>
                {leftIcon}
              </View>
            )}
            <TextInput
              style={[
                styles.input,
                styles.oneLineInput,
                { textAlign: direction === 'rtl' ? 'right' : 'left' },
                disabled ? styles.disabledInput : null,
                leftIcon ? styles.inputWithLeftIcon : null,
                rightIcon ? styles.inputWithRightIcon : null,
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
            {rightIcon && (
              <View style={styles.iconContainer}>
                {rightIcon}
              </View>
            )}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
          </View>
        </View>
      ) : (
        // Two-line layout: label above, input below
        <>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              {required && <Text style={styles.requiredStar}>*</Text>}
              <UrduText style={styles.inputTitle}>{inputTitle}</UrduText>
            </View>
          </View>
          <View style={[
            styles.inputContainer,
            styles.twoLineContainer,
            error ? styles.inputError : null
          ]}>
            {leftIcon && (
              <View style={styles.leftIconContainer}>
                {leftIcon}
              </View>
            )}
            <TextInput
              style={[
                styles.input,
                styles.twoLineInput,
                { textAlign: direction === 'rtl' ? 'right' : 'left' },
                disabled ? styles.disabledInput : null,
                leftIcon ? styles.inputWithLeftIcon : null,
                rightIcon ? styles.inputWithRightIcon : null,
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
            {rightIcon && (
              <View style={styles.iconContainer}>
                {rightIcon}
              </View>
            )}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
          </View>
        </>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helpText && <UrduText style={styles.helpText}>{helpText}</UrduText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  loadingContainer: {
    position: 'absolute',
    right: SPACING.md,
    height: '100%',
    justifyContent: 'center',
  },

  mainTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
    lineHeight: 40,
    width: '100%',
  },
  inputTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'right',
    fontWeight: '500',
  },
  requiredStar: {
    color: COLORS.error || 'red',
    marginRight: 2,
    marginLeft: 2,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    ...SHADOWS.small,
  },
  // One-line layout styles
  oneLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    ...SHADOWS.small,
  },
  oneLineInput: {
    flex: 1,
    height: 35,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingHorizontal: SPACING.sm,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xs,
  },
  // Two-line layout styles
  twoLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.small,
  },
  twoLineInput: {
    flex: 1,
    height: 45,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingHorizontal: SPACING.sm,
    color: COLORS.black,
  },
  titleContainer: {
    marginBottom: SPACING.xs,
    lineHeight: 40,
    width: '100%',
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  labelContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    minWidth: 80,
    marginRight: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error || 'red',
  },
  input: {
    flex: 1,
    height: 35,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingHorizontal: SPACING.sm,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xs,
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.sm,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.sm,
  },
  disabledInput: {
    opacity: 0.7,
    color: COLORS.textSecondary,
  },
  leftIconContainer: {
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 4,
    textAlign: 'right',
    width: '100%',
  },
  helpText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginRight: 4,
    textAlign: 'right',
    width: '100%',
  },
});

export default FormInput; 