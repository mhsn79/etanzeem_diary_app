import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Pressable,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  SIZES,
} from '@/app/constants/theme';
import UrduText from './UrduText';

/**
 * DateTimePicker Props Interface
 */
interface DateTimePickerProps {
  /** Initial date value */
  initialDate?: Date;
  /** Callback function when date changes */
  onDateChange: (date: Date) => void;
  /** Label for the date picker */
  label?: string;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Mode for the picker (date, time, datetime) */
  mode?: 'date' | 'time' | 'datetime';
  /** Minimum selectable date */
  minimumDate?: Date;
  /** Maximum selectable date */
  maximumDate?: Date;
  /** Custom style for the container */
  containerStyle?: object;
  /** Custom style for the button */
  buttonStyle?: object;
  /** Custom style for the text */
  textStyle?: object;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
  /** Error message to display */
  error?: string;
  /** Use Urdu text for labels and buttons */
  useUrduText?: boolean;
  /** Right icon component */
  rightIcon?: React.ReactNode;
}

/**
 * A reusable DateTimePicker component with a modern design
 * 
 * @example
 * ```tsx
 * <DateTimePicker
 *   label="Select Date and Time"
 *   placeholder="Tap to select"
 *   mode="datetime"
 *   onDateChange={(date) => console.log(date)}
 * />
 * ```
 */
const DateTimePicker: React.FC<DateTimePickerProps> = ({
  initialDate,
  onDateChange,
  label,
  placeholder = 'Select date and time',
  mode = 'datetime',
  minimumDate,
  maximumDate,
  containerStyle,
  buttonStyle,
  textStyle,
  disabled = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  error,
  useUrduText = false,
  rightIcon,
}) => {
  // State for selected date and modal visibility
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  
  // Handle showing the date picker
  const showDatePicker = () => {
    if (!disabled) {
      setDatePickerVisible(true);
    }
  };

  // Handle hiding the date picker
  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  // Handle date confirmation
  const handleConfirm = (date: Date) => {
    setSelectedDate(date);
    onDateChange(date);
    hideDatePicker();
  };

  // Format the date for display
  const formatDate = (date?: Date): string => {
    if (!date) return placeholder;
    
    if (useUrduText) {
      if (mode === 'date') {
        return date.toLocaleDateString('ur-PK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else if (mode === 'time') {
        return date.toLocaleTimeString('ur-PK', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else {
        return date.toLocaleString('ur-PK', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
    } else {
      if (mode === 'date') {
        return date.toLocaleDateString();
      } else if (mode === 'time') {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else {
        return date.toLocaleString([], {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    }
  };

  // Get the appropriate icon based on the mode
  const getIcon = () => {
    switch (mode) {
      case 'date':
        return 'calendar-outline';
      case 'time':
        return 'time-outline';
      default:
        return 'calendar-outline';
    }
  };

  const TextComponent = useUrduText ? UrduText : Text;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <TextComponent style={styles.label}>{label}</TextComponent>}
      
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={showDatePicker}
        style={[
          styles.button,
          buttonStyle,
          disabled && styles.disabledButton,
        ]}
        disabled={disabled}
        accessibilityLabel={label || placeholder}
        accessibilityHint="Tap to open date and time picker"
        accessibilityRole="button"
      >
        {rightIcon || (
          <Ionicons
            name={getIcon()}
            size={20}
            color={disabled ? COLORS.disabled : COLORS.error}
          />
        )}
        <TextComponent
          style={[
            styles.buttonText,
            !selectedDate && styles.placeholderText,
            textStyle,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {formatDate(selectedDate)}
        </TextComponent>
      </TouchableOpacity>

      {error && <TextComponent style={styles.errorText}>{error}</TextComponent>}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={mode === 'datetime' ? 'datetime' : (mode as 'date' | 'time')}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={selectedDate || new Date()}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        confirmTextIOS={useUrduText ? 'تصدیق کریں' : confirmText}
        cancelTextIOS={useUrduText ? 'منسوخ کریں' : cancelText}
        customConfirmButtonIOS={
          useUrduText
            ? ({ onPress }) => (
                <Pressable style={styles.confirmButton} onPress={onPress}>
                  <UrduText style={styles.confirmButtonText}>تصدیق کریں</UrduText>
                </Pressable>
              )
            : undefined
        }
        customCancelButtonIOS={
          useUrduText
            ? ({ onPress }) => (
                <Pressable style={styles.cancelButton} onPress={onPress}>
                  <UrduText style={styles.cancelButtonText}>منسوخ کریں</UrduText>
                </Pressable>
              )
            : undefined
        }
        // Android specific props
        timePickerModeAndroid="spinner"
        isDarkModeEnabled={false}
        locale={useUrduText ? 'ur-PK' : undefined}
        is24Hour={true}
        // Android button styling
        positiveButton={{ label: useUrduText ? 'منتخب کریں' : confirmText, textColor: COLORS.white }}
        negativeButton={{ label: useUrduText ? 'منسوخ کریں' : cancelText, textColor: COLORS.white }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.xs,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'left',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    height: SIZES.input.height,
    ...SHADOWS.small,
  },
  buttonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'left',
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  disabledButton: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.disabled,
  },
  disabledText: {
    color: COLORS.disabled,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
  },
});

export default DateTimePicker;