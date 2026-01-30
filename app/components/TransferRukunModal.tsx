import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import UrduText from './UrduText';
import CustomDropdown, { Option } from './CustomDropdown';
import CustomButton from './CustomButton';
import Dialog from './Dialog';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import i18n from '../i18n';
import { AppDispatch, RootState } from '../store/types';
import { 
  createRukunTransfer, 
  checkExistingTransfer,
  resetTransferStatus
} from '../features/persons/personSlice';
import { selectTanzeemiUnitById, fetchTanzeemiUnitById } from '../features/tanzeem/tanzeemSlice';

interface TransferRukunModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rukunId: number;
  rukunName: string;
  currentUnitId?: number;
  currentUnitName?: string;
  tanzeemiUnitOptions: Option[];
}

const TransferRukunModal: React.FC<TransferRukunModalProps> = ({
  visible,
  onClose,
  onSuccess,
  rukunId,
  rukunName,
  currentUnitId,
  currentUnitName,
  tanzeemiUnitOptions,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux selectors
  const createStatus = useSelector((state: RootState) => state.persons.createTransferStatus);
  const createError = useSelector((state: RootState) => state.persons.createTransferError);
  const checkStatus = useSelector((state: RootState) => state.persons.checkTransferStatus);
  const existingTransfers = useSelector((state: RootState) => state.persons.existingTransfers);
  
  // Get unit name from Redux if currentUnitName is not provided or is just an ID
  const unitFromRedux = currentUnitId ? useSelector((state: RootState) => selectTanzeemiUnitById(state, currentUnitId)) : null;
  const levelsById = useSelector((state: RootState) => state.tanzeem?.levelsById || {});
  
  // Determine display unit name - prioritize Redux unit name, then currentUnitName, but exclude if it's just an ID
  let displayUnitName = '';
  if (unitFromRedux) {
    // Get level name if available
    const levelId = unitFromRedux.Level_id || unitFromRedux.level_id;
    const level = levelId && levelsById[levelId] ? levelsById[levelId] : null;
    const levelName = level?.Name || level?.name || '';
    const unitName = unitFromRedux.Name || unitFromRedux.name || '';
    displayUnitName = levelName ? `${levelName}: ${unitName}` : unitName;
  } else if (currentUnitName && currentUnitName !== currentUnitId?.toString() && !/^\d+$/.test(currentUnitName)) {
    // Use currentUnitName if it's not just a number (ID)
    displayUnitName = currentUnitName;
  }
  
  // Fetch unit if not in Redux
  useEffect(() => {
    if (currentUnitId && !unitFromRedux) {
      dispatch(fetchTanzeemiUnitById(currentUnitId));
    }
  }, [currentUnitId, unitFromRedux, dispatch]);
  // Safely find the existing transfer (if any)
  const existingTransfer = Array.isArray(existingTransfers) ? 
    existingTransfers.find(transfer => transfer && transfer.contact_id === rukunId) : undefined;
  
  // Local state
  const [transferType, setTransferType] = useState<'local' | 'outside'>('local');
  const [selectedLocalUnitId, setSelectedLocalUnitId] = useState<number | undefined>(undefined);
  const [cityName, setCityName] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  
  const isLoading = createStatus === 'loading' || checkStatus === 'loading';
  // Only consider a rukun as having an existing transfer if there's a non-empty array
  // with at least one item that has the same contact_id
  const hasExistingTransfer = Array.isArray(existingTransfers) && 
    existingTransfers.length > 0 && 
    existingTransfers.some(transfer => transfer.contact_id === rukunId);

  // Reset state when modal opens/closes or when rukunId changes
  useEffect(() => {
    if (visible) {
      // Reset form first
      setTransferType('local');
      setSelectedLocalUnitId(undefined);
      setCityName('');
      setReason('');
      setError('');
      setShowConfirmDialog(false);
      setShowSuccessDialog(false);
      setShowErrorDialog(false);
      
      // Then check for existing transfer when modal opens
      dispatch(resetTransferStatus()); // Clear any previous state
      setTimeout(() => {
        dispatch(checkExistingTransfer(rukunId));
      }, 300); // Small delay to ensure clean state
    } else {
      // Reset Redux state when modal closes
      dispatch(resetTransferStatus());
    }
  }, [visible, dispatch, rukunId]); // Include rukunId dependency

  // Handle create status changes
  useEffect(() => {
    if (createStatus === 'succeeded') {
      // Show success dialog and clear any error message
      setShowSuccessDialog(true);
      setError('');
      // Also ensure no transfer checks will run 
      dispatch(resetTransferStatus());
    } else if (createStatus === 'failed' && createError) {
      setError(createError || i18n.t('transfer_request_failed'));
    }
  }, [createStatus, createError]);

  // React to rukunId changes even when modal is already open
  useEffect(() => {
    if (visible) {
      // Reset the state whenever the rukunId changes while modal is open
      setError('');
      setShowErrorDialog(false);
      dispatch(resetTransferStatus());
      
      // Check for existing transfer for the new rukun
      setTimeout(() => {
        dispatch(checkExistingTransfer(rukunId));
      }, 300);
    }
  }, [rukunId, visible, dispatch]);

  // Check if a transfer already exists and show appropriate error
  useEffect(() => {
    // Only show the error if:
    // 1. The check succeeded AND
    // 2. There's an existing transfer AND
    // 3. We haven't just created a transfer successfully in this session
    if (checkStatus === 'succeeded' && hasExistingTransfer && createStatus !== 'succeeded') {
      // Store the error message
      const errorMessage = i18n.t('transfer_request_exists');
      setError(errorMessage);
      
      // Show the error dialog instead of inline error for existing transfer
      setShowErrorDialog(true);
    }
  }, [checkStatus, hasExistingTransfer, createStatus]);

  const handleTransferTypeChange = (type: 'local' | 'outside') => {
    setTransferType(type);
    setError('');
    
    // Reset related fields
    if (type === 'local') {
      setCityName('');
    } else {
      setSelectedLocalUnitId(undefined);
    }
  };

  const handleLocalUnitSelect = (option: Option) => {
    setSelectedLocalUnitId(parseInt(option.value));
    setError('');
  };

  const handleCityNameChange = (text: string) => {
    setCityName(text);
    setError('');
  };

  const handleReasonChange = (text: string) => {
    setReason(text);
    setError('');
  };

  const validateForm = (): boolean => {
    // Check for existing transfer
    if (hasExistingTransfer) {
      setError(i18n.t('transfer_request_exists'));
      return false;
    }
    
    // Validate fields based on transfer type
    if (transferType === 'local' && !selectedLocalUnitId) {
      setError(i18n.t('please_select_unit'));
      return false;
    }
    
    if (transferType === 'outside' && !cityName.trim()) {
      setError(i18n.t('please_enter_city'));
      return false;
    }
    
    // Validate reason field
    if (!reason.trim()) {
      setError(i18n.t('please_enter_reason') || 'براہ کرم منتقلی کی وجہ درج کریں');
      return false;
    }
    
    return true;
  };

  const handleSaveTransfer = () => {
    if (!validateForm()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = async () => {
    if (!validateForm()) return;
    setShowConfirmDialog(false);
    setError('');

    try {
      const payload: {
        contact_id: number;
        transfer_type: 'local' | 'outside';
        reason: string;
        status: 'draft' | 'pending' | 'approved' | 'rejected';
        local_unit_id?: number;
        city_name?: string;
      } = {
        contact_id: rukunId,
        transfer_type: transferType,
        reason: reason.trim(),
        status: 'draft',
      };

      // Add type-specific fields
      if (transferType === 'local' && selectedLocalUnitId) {
        Object.assign(payload, { local_unit_id: selectedLocalUnitId });
      } else if (transferType === 'outside' && cityName) {
        Object.assign(payload, { city_name: cityName.trim() });
      }

      await dispatch(createRukunTransfer(payload)).unwrap();
    } catch (error) {
      console.error('Error creating transfer request:', error);
      setError(typeof error === 'string' ? error : i18n.t('transfer_request_failed'));
    }
  };

  const selectedUnitName = selectedLocalUnitId && tanzeemiUnitOptions && tanzeemiUnitOptions.length > 0
    ? tanzeemiUnitOptions.find(unit => unit.value === selectedLocalUnitId.toString())?.label || i18n.t('unknown_unit')
    : i18n.t('unknown_unit');

  return (
    <>
      {/* Only show the transfer modal if we don't have an existing transfer error */}
      <Modal
        visible={visible && !showErrorDialog}
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

              <UrduText style={styles.title}>{i18n.t('initiate_rukun_transfer')}</UrduText>
              
              {/* Status Display */}
              {/* <View style={styles.statusContainer}>
                <UrduText style={styles.statusLabel}>{i18n.t('status')}:</UrduText>
                <UrduText style={styles.statusValue}>{i18n.t('draft')}</UrduText>
              </View> */}
              
              {/* Rukun Info */}
              <View style={styles.rukunInfo}>
                <UrduText style={styles.rukunName}>{rukunName}</UrduText>
                {displayUnitName && (
                  <UrduText style={styles.currentUnit}>
                    {i18n.t('current_unit')}: {displayUnitName}
                  </UrduText>
                )}
              </View>

              {/* Transfer Type */}
              <View style={styles.transferTypeContainer}>
                <UrduText style={styles.sectionLabel}>{i18n.t('transfer_type')}</UrduText>
                <View style={styles.radioButtonsContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.radioButton, 
                      transferType === 'local' && styles.radioButtonSelected
                    ]}
                    onPress={() => handleTransferTypeChange('local')}
                    disabled={isLoading}
                  >
                    <View style={styles.radioCircle}>
                      {transferType === 'local' && <View style={styles.selectedRb} />}
                    </View>
                    <UrduText style={styles.radioText}>{i18n.t('local')}</UrduText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.radioButton, 
                      transferType === 'outside' && styles.radioButtonSelected
                    ]}
                    onPress={() => handleTransferTypeChange('outside')}
                    disabled={isLoading}
                  >
                    <View style={styles.radioCircle}>
                      {transferType === 'outside' && <View style={styles.selectedRb} />}
                    </View>
                    <UrduText style={styles.radioText}>{i18n.t('outside')}</UrduText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Local Unit Dropdown */}
              {transferType === 'local' && (
                <View style={styles.fieldContainer}>
                  <UrduText style={styles.sectionLabel}>{i18n.t('select_new_unit')}</UrduText>
                  <CustomDropdown
                    dropdownTitle=""
                    options={tanzeemiUnitOptions || []}
                    onSelect={handleLocalUnitSelect}
                    selectedValue={selectedLocalUnitId?.toString()}
                    placeholder={i18n.t('choose_destination_unit')}
                    viewStyle={styles.dropdown}
                    disabled={isLoading || hasExistingTransfer || !tanzeemiUnitOptions || tanzeemiUnitOptions.length === 0}
                  />
                  {(!tanzeemiUnitOptions || tanzeemiUnitOptions.length === 0) && (
                    <UrduText style={styles.helperText}>{i18n.t('loading_units')}</UrduText>
                  )}
                </View>
              )}

              {/* City Name Input */}
              {transferType === 'outside' && (
                <View style={styles.fieldContainer}>
                  <UrduText style={styles.sectionLabel}>شہر کا نام</UrduText>
                  <TextInput
                    style={styles.textInput}
                    value={cityName}
                    onChangeText={handleCityNameChange}
                    placeholder="شہر کا نام"
                    placeholderTextColor={COLORS.textSecondary}
                    editable={!isLoading && !hasExistingTransfer}
                  />
                </View>
              )}

              {/* Transfer Reason */}
              <View style={styles.fieldContainer}>
                <UrduText style={styles.sectionLabel}>{i18n.t('transfer_reason') || 'منتقلی کی وجہ'}</UrduText>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={reason}
                  onChangeText={handleReasonChange}
                  placeholder={i18n.t('enter_transfer_reason') || 'منتقلی کی وجہ درج کریں'}
                  placeholderTextColor={COLORS.textSecondary}
                  multiline={true}
                  numberOfLines={4}
                  editable={!isLoading && !hasExistingTransfer}
                />
              </View>
              {/* Error Display - only show inline errors that aren't about existing transfers */}
              {error && error !== i18n.t('transfer_request_exists') && (
                <UrduText style={styles.errorText}>{error}</UrduText>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <CustomButton
                  text={i18n.t('save')}
                  onPress={handleSaveTransfer}
                  viewStyle={[
                    styles.button, 
                    styles.primaryButton,
                    (hasExistingTransfer || isLoading) && styles.disabledButton
                  ]}
                  disabled={isLoading || hasExistingTransfer}
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
        description={
          transferType === 'local'
            ? i18n.t('confirm_transfer_description', { 
                rukunName, 
                currentUnit: currentUnitName || i18n.t('current_unit'), 
                newUnit: selectedUnitName 
              })
            : i18n.t('confirm_outside_transfer_description', {
                rukunName,
                cityName
              })
        }
        confirmText={i18n.t('confirm')}
        cancelText={i18n.t('cancel')}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setShowConfirmDialog(false)}
        onClose={() => setShowConfirmDialog(false)}
        disableButtons={isLoading}
      />
      
      {/* Success Dialog */}
      <Dialog
        visible={showSuccessDialog}
        type="success"
        title={i18n.t('success')}
        description={i18n.t('transfer_request_created', { rukunName })}
        confirmText={i18n.t('ok')}
        onConfirm={() => {
          setShowSuccessDialog(false);
          onSuccess();
          onClose();
        }}
        onClose={() => {
          setShowSuccessDialog(false);
          onSuccess();
          onClose();
        }}
      />
      
      {/* Error Dialog for Existing Transfer */}
      <Dialog
        visible={showErrorDialog}
        type="error"
        title={i18n.t('error')}
        description={i18n.t('transfer_request_exists')}
        confirmText={i18n.t('ok')}
        onConfirm={() => {
          setShowErrorDialog(false);
          onClose(); // Close the modal when user acknowledges the error
        }}
        onClose={() => {
          setShowErrorDialog(false);
          onClose(); // Close the modal when user dismisses the dialog
        }}
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
    maxHeight: '90%',
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
    textAlign: 'left',
  },
  statusValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
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
    textAlign: 'left',
  },
  transferTypeContainer: {
    marginBottom: SPACING.md,
  },
  radioButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    minWidth: 120,
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightPrimary,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'left',
  },
  dropdown: {
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    textAlign: 'right',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
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
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
  },
  loader: {
    marginTop: SPACING.md,
  },
});

export default TransferRukunModal;