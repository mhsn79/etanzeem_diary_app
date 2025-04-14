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
import SuccessIcon from "../../assets/images/checkmark-badge.svg";
interface DialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  showWarningIcon?: boolean;
  showSuccessIcon?: boolean;
}

const Dialog: React.FC<DialogProps> = ({
  visible,
  onConfirm,
  onCancel,
  title = 'رپورٹ جمع کروانے کی تصدیق',
  description = 'کیا آپ واقعی رپورٹ جمع کروانا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔',
  confirmText = 'ہاں، جمع کریں',
  cancelText = 'نہیں، واپس جائیں',
  showWarningIcon = false,
  showSuccessIcon = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Warning Icon */}
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
          <UrduText style={styles.title}>{title}</UrduText>

          {/* Description */}
          <UrduText style={styles.description}>{description}</UrduText>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
            >
              <UrduText style={styles.confirmButtonText}>{confirmText}</UrduText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <UrduText style={styles.cancelButtonText}>{cancelText}</UrduText>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
          >
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
    width: 60 ,
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
    width: 50 ,
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
});

export default Dialog; 