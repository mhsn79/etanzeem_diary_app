import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
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
 * A reusable DateTimePicker component with standard date picker functionality
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
const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
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

  // Sync selectedDate with initialDate prop
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const showDatePicker = () => {
    if (!disabled) {
      setDatePickerVisible(true);
    }
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date: Date) => {
    setSelectedDate(date);
    onDateChange(date);
    hideDatePicker();
  };

  const handleCancel = () => {
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
      >
        <View style={styles.buttonContent}>
          <Ionicons 
            name={getIcon() as any} 
            size={20} 
            color={disabled ? COLORS.textSecondary : COLORS.primary} 
            style={styles.leftIcon}
          />
          <TextComponent style={[
            styles.buttonText,
            textStyle,
            disabled && styles.disabledText,
          ]}>
            {formatDate(selectedDate)}
          </TextComponent>
        </View>
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <TextComponent style={styles.errorText}>{error}</TextComponent>
      )}

      {/* Date Time Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={mode}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        date={selectedDate || new Date()}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        confirmTextIOS={confirmText}
        cancelTextIOS={cancelText}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'left',
    width: '100%',
  },
  button: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  disabledButton: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.lightGray,
  },
  buttonContent: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  rightIconContainer: {
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  leftIcon: {
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
});

export default DateTimePickerComponent;