import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import UrduText from './UrduText';
import CustomDropdown, { Option } from './CustomDropdown';
import CustomButton from './CustomButton';
import Dialog from './Dialog';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import i18n from '../i18n';
import { AppDispatch } from '../store';
import { transferRukun, selectTransferStatus, selectTransferError, resetTransferStatus } from '../features/persons/personSlice';
import { selectSubordinateUnitsForDropdown } from '../features/tanzeem/tanzeemHierarchySlice';

interface TransferRukunModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rukunId: number;
  rukunName: string;
  currentUnit?: string;
}

const TransferRukunModal: React.FC<TransferRukunModalProps> = ({
  visible,
  onClose,
  onSuccess,
  rukunId,
  rukunName,
  currentUnit,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const tanzeemiUnitOptions = useSelector(selectSubordinateUnitsForDropdown);
  const transferStatus = useSelector(selectTransferStatus);
  const transferError = useSelector(selectTransferError);
  
  const [selectedUnit, setSelectedUnit] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const isLoading = transferStatus === 'loading';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSelectedUnit(undefined);
      setError('');
      setShowConfirmDialog(false);
      dispatch(resetTransferStatus());
    }
  }, [visible, dispatch]);


  // Handle transfer success
  useEffect(() => {
    if (transferStatus === 'succeeded') {
      Alert.alert(
        i18n.t('transfer_successful'),
        i18n.t('transfer_successful_message', { rukunName }),
        [
          {
            text: i18n.t('ok'),
            onPress: () => {
              onSuccess();
              onClose();
            }
          }
        ]
      );
    }
  }, [transferStatus, rukunName, onSuccess, onClose]);

  // Handle transfer error
  useEffect(() => {
    if (transferError) {
      setError(transferError);
    }
  }, [transferError]);

  const handleUnitSelect = (option: Option) => {
    setSelectedUnit(parseInt(option.value));
    setError('');
  };

  const handleTransferClick = () => {
    if (!selectedUnit) {
      setError(i18n.t('please_select_unit'));
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedUnit) return;

    setError('');

    try {
      console.log(selectedUnit);
      
      await dispatch(transferRukun({
        id: rukunId,
        contact_id: selectedUnit
      })).unwrap();
    } catch (error) {
      console.error('Error transferring rukun:', error);
      setError(typeof error === 'string' ? error : i18n.t('transfer_failed_message'));
    }
  };

  const selectedUnitName = tanzeemiUnitOptions.find(
    unit => unit.value === selectedUnit?.toString()
  )?.label || i18n.t('unknown_unit');

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <ScrollView 
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="swap-horiz" size={40} color={COLORS.primary} />
              </View>

              <UrduText style={styles.title}>{i18n.t('transfer_rukun_title')}</UrduText>
              
              <View style={styles.rukunInfo}>
                <UrduText style={styles.rukunName}>{rukunName}</UrduText>
                {currentUnit && (
                  <UrduText style={styles.currentUnit}>
                    {i18n.t('current_unit')}: {currentUnit}
                  </UrduText>
                )}
              </View>

              <View style={styles.dropdownSection}>
                <UrduText style={styles.sectionLabel}>{i18n.t('select_new_unit')}</UrduText>
                <CustomDropdown
                  dropdownTitle=""
                  options={tanzeemiUnitOptions}
                  onSelect={handleUnitSelect}
                  selectedValue={selectedUnit?.toString()}
                  placeholder={i18n.t('choose_destination_unit')}
                  viewStyle={styles.dropdown}
                />
                
                {error && (
                  <UrduText style={styles.errorText}>{error}</UrduText>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <CustomButton
                  text={i18n.t('transfer_rukun')}
                  onPress={handleTransferClick}
                  viewStyle={[styles.button, styles.primaryButton]}
                  disabled={!selectedUnit || isLoading}
                />
                
                <CustomButton
                  text={i18n.t('cancel')}
                  onPress={onClose}
                  viewStyle={[styles.button, styles.secondaryButton]}
                  disabled={isLoading}
                />
              </View>

              {isLoading && (
                <ActivityIndicator 
                  size="large" 
                  color={COLORS.primary} 
                  style={styles.loader} 
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog
        visible={showConfirmDialog}
        type="warning"
        title={i18n.t('confirm_transfer_title')}
        description={i18n.t('confirm_transfer_description', { 
          rukunName, 
          currentUnit: currentUnit || i18n.t('current_unit'), 
          newUnit: selectedUnitName 
        })}
        confirmText={i18n.t('transfer')}
        cancelText={i18n.t('cancel')}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setShowConfirmDialog(false)}
        onClose={() => setShowConfirmDialog(false)}
        disableButtons={isLoading}
      />
    </>
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
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  iconContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightPrimary,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  rukunInfo: {
    backgroundColor: COLORS.lightGray,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  rukunName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  currentUnit: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  dropdownSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  dropdown: {
    marginBottom: SPACING.sm,
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
  button: {
    minWidth: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray2,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  loader: {
    marginTop: SPACING.md,
  },
});

export default TransferRukunModal;