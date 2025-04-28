import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import UrduText from './UrduText';
import i18n from '../i18n';

interface ProgressModalProps {
  visible: boolean;
  progress: number;
  message?: string;
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  visible,
  progress,
  message = i18n.t('uploading_image'),
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          
          <UrduText style={styles.message}>{message}</UrduText>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          
          <Text style={styles.progressText}>{`${progress}%`}</Text>
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
  message: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default ProgressModal;