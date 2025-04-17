import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import UrduText from './UrduText';
import { SuccessIcon, WarningIcon } from '../constants/images'; // Import multiple SVGs
import { AntDesign } from '@expo/vector-icons';

// Map of icon types to components
const ICON_MAP = {
  success: SuccessIcon,
  warning: WarningIcon,
  // Add other icons as needed
};

interface DialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
  title?: string;
  titleStyle?: any;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showWarningIcon?: boolean;
  showSuccessIcon?: boolean; 
  upperRightIcon?: boolean;
  lowerRightIcon?: boolean;
  confirmButtonStyle?: any;
  cancelButtonStyle?: any;
  confirmTextStyle?: any;
  cancelTextStyle?: any;
  descriptionStyle?: any;
}

const Dialog: React.FC<DialogProps> = ({
  visible,
  onConfirm,
  onCancel,
  onClose,
  title = '',
  titleStyle = {},
  description = '',
  confirmText = '',
  cancelText = '',
  showWarningIcon = false,
  showSuccessIcon = false,
  upperRightIcon = false,
  lowerRightIcon = false,
  confirmButtonStyle,
  cancelButtonStyle,
  confirmTextStyle,
  cancelTextStyle,
  descriptionStyle = {},
}) => {
  // const IconComponent = iconType ? ICON_MAP[iconType] : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          {showWarningIcon && (
            <View style={styles.warningIconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
          )}

          {showSuccessIcon && (
            <View style={styles.successIconContainer}>
              <SuccessIcon />
            </View>
          )}

          {/* Title */}
          {title && (
            <UrduText style={[styles.title, titleStyle]}>{title}</UrduText>
          )}

          {/* Description */}
          {description && (
            <UrduText style={[styles.description, descriptionStyle]}>{description}</UrduText>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, confirmButtonStyle]}
              onPress={onConfirm}
            >
              <View style={styles.confirmButtonContent}>
                {upperRightIcon && (
                  <AntDesign style={{ marginRight: SPACING.sm }} name="calendar" size={24} color={COLORS.white} />
                )}
                <UrduText style={[styles.confirmButtonText, confirmTextStyle]}>{confirmText}</UrduText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, cancelButtonStyle]}
              onPress={() => {
                onCancel && onCancel();
                onClose && onClose();
              }}
            >
              <View style={styles.cancelButtonContent}>
                {lowerRightIcon && (
                  <AntDesign style={{ marginRight: SPACING.sm }} name="calendar" size={24} color="black" />
                )}
                <UrduText style={[styles.cancelButtonText, cancelTextStyle]}>{cancelText}</UrduText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  warningIconContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  successIconContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.tertiary,
    justifyContent: 'center',
  },
  warningIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    width: '80%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  closeButton: {
    position: 'absolute',
    bottom: -SPACING.xxxxl,
    alignSelf: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.white,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  closeIcon: {
    fontSize: 16,
    color: COLORS.white,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default Dialog;