import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import UrduText from './UrduText';
import i18n from '../i18n';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <UrduText style={styles.title}>{i18n.t('select_image_source')}</UrduText>
          
          <TouchableOpacity 
            style={styles.option} 
            onPress={() => {
              onCameraPress();
              onClose();
            }}
          >
            <Ionicons name="camera" size={24} color={COLORS.primary} />
            <UrduText style={styles.optionText}>{i18n.t('take_photo')}</UrduText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.option} 
            onPress={() => {
              onGalleryPress();
              onClose();
            }}
          >
            <Ionicons name="image" size={24} color={COLORS.primary} />
            <UrduText style={styles.optionText}>{i18n.t('choose_from_gallery')}</UrduText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <UrduText style={styles.cancelText}>{i18n.t('cancel')}</UrduText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    marginLeft: SPACING.md,
  },
  cancelButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    width: '100%',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.error || '#ff6b6b',
  },
  cancelText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default ImagePickerModal;