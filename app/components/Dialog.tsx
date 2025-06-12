import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import UrduText from './UrduText';
import { SuccessIcon, WarningIcon, CloseIcon } from '../constants/images';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';

// Dialog types for different alert scenarios
export type DialogType = 'success' | 'warning' | 'error' | 'info' | 'confirm' | 'loading' | 'custom';

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
  type?: DialogType;
  icon?: React.ReactNode;
  showWarningIcon?: boolean;
  showSuccessIcon?: boolean; 
  upperRightIcon?: boolean;
  lowerRightIcon?: boolean;
  confirmButtonStyle?: any;
  cancelButtonStyle?: any;
  confirmTextStyle?: any;
  cancelTextStyle?: any;
  descriptionStyle?: any;
  disableButtons?: boolean;
  showCloseButton?: boolean;
  autoClose?: boolean;
  autoCloseTime?: number;
  customContent?: React.ReactNode;
  loading?: boolean; // Add loading prop
}

const Dialog: React.FC<DialogProps> = ({
  visible,
  onConfirm,
  onCancel,
  onClose,
  title = '',
  titleStyle = {},
  description = '',
  confirmText = 'ٹھیک ہے',
  cancelText = 'منسوخ کریں',
  type = 'custom',
  icon,
  showWarningIcon = false,
  showSuccessIcon = false,
  upperRightIcon = false,
  lowerRightIcon = false,
  confirmButtonStyle,
  cancelButtonStyle,
  confirmTextStyle,
  cancelTextStyle,
  descriptionStyle = {},
  disableButtons = false,
  showCloseButton = true,
  autoClose = false,
  autoCloseTime = 3000,
  customContent,
  loading = false,
}) => {
  // Auto close dialog after specified time if autoClose is true
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible && autoClose) {
      timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, autoClose, autoCloseTime, onClose]);

  // Determine icon based on dialog type
  const renderIcon = () => {
    if (icon) return icon;
    
    if (showSuccessIcon || type === 'success') {
      return (
        <View style={[styles.iconContainer, styles.successIconContainer]}>
          <SuccessIcon width={30} height={30} />
        </View>
      );
    }
    
    if (showWarningIcon || type === 'warning') {
      return (
        <View style={[styles.iconContainer, styles.warningIconContainer]}>
          <MaterialIcons name="warning" size={30} color={COLORS.white} />
        </View>
      );
    }

    switch (type) {
      case 'error':
        return (
          <View style={[styles.iconContainer, styles.errorIconContainer]}>
            <Ionicons name="close-circle" size={30} color={COLORS.white} />
          </View>
        );
      case 'info':
        return (
          <View style={[styles.iconContainer, styles.infoIconContainer]}>
            <Ionicons name="information-circle" size={30} color={COLORS.white} />
          </View>
        );
      case 'loading':
        return (
          <View style={[styles.iconContainer, styles.loadingIconContainer]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );
      default:
        return null;
    }
  };

  // Get button styles based on dialog type
  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: COLORS.success };
      case 'warning':
        return { backgroundColor: COLORS.warning };
      case 'error':
        return { backgroundColor: COLORS.error };
      case 'info':
        return { backgroundColor: COLORS.info };
      default:
        return { backgroundColor: COLORS.primary };
    }
  };

  // Determine if we should show cancel button
  const shouldShowCancelButton = () => {
    return type === 'confirm' || cancelText !== '';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel || onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          {renderIcon()}

          {/* Title */}
          {title && (
            <UrduText style={[styles.title, titleStyle]}>{title}</UrduText>
          )}

          {/* Description */}
          {description && (
            <UrduText style={[styles.description, descriptionStyle]}>{description}</UrduText>
          )}

          {/* Custom Content */}
          {customContent}

          {/* Buttons */}
          {type !== 'loading' && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton, 
                  getConfirmButtonStyle(),
                  confirmButtonStyle,
                  (disableButtons || loading) && styles.disabledButton
                ]}
                onPress={(disableButtons || loading) ? undefined : onConfirm}
                disabled={disableButtons || loading}
              >
                <View style={styles.confirmButtonContent}>
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      {upperRightIcon && (
                        <AntDesign style={{ marginRight: SPACING.sm }} name="calendar" size={24} color={COLORS.white} />
                      )}
                      <UrduText style={[styles.confirmButtonText, confirmTextStyle]}>{confirmText}</UrduText>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {shouldShowCancelButton() && (
                <TouchableOpacity
                  style={[
                    styles.cancelButton, 
                    cancelButtonStyle,
                    (disableButtons || loading) && styles.disabledCancelButton
                  ]}
                  onPress={(disableButtons || loading) ? undefined : () => {
                    onCancel && onCancel();
                    onClose && onClose();
                  }}
                  disabled={disableButtons || loading}
                >
                  <View style={styles.cancelButtonContent}>
                    {lowerRightIcon && (
                      <AntDesign style={{ marginRight: SPACING.sm }} name="calendar" size={24} color="black" />
                    )}
                    <UrduText style={[styles.cancelButtonText, cancelTextStyle]}>{cancelText}</UrduText>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Close Button */}
          {showCloseButton && type !== 'loading' && !loading && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={(disableButtons || loading) ? undefined : onClose}
              disabled={disableButtons || loading}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
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
  iconContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  warningIconContainer: {
    backgroundColor: COLORS.warning,
  },
  successIconContainer: {
    backgroundColor: COLORS.success,
  },
  errorIconContainer: {
    backgroundColor: COLORS.error,
  },
  infoIconContainer: {
    backgroundColor: COLORS.info,
  },
  loadingIconContainer: {
    backgroundColor: 'transparent',
  },
  warningIcon: {
    fontSize: 30,
    color: COLORS.white,
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
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    opacity: 0.7,
  },
  disabledCancelButton: {
    opacity: 0.5,
  }
});

export default Dialog;