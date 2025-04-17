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
  rightIcon?: React.ReactNode;
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
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {mainTitle && <UrduText style={styles.mainTitle}>{mainTitle}</UrduText>}
        <UrduText style={styles.inputTitle}>{inputTitle}</UrduText>
      </View>
      <View style={styles.inputContainer}>
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
        />
    
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
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
});

export default FormInput; 