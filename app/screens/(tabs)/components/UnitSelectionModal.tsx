import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import UrduText from '@/app/components/UrduText';
import Spacer from '@/app/components/Spacer';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, TYPOGRAPHY } from '@/app/constants/theme';
import DropdownSection from './DropdownSection';
import { Option } from './types';
import {
  selectUserUnitDetails,
  selectAllTanzeemiUnits,
  selectTanzeemiUnitById,
  selectLevelsById,
  setDashboardSelectedUnit,
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectUserDetails } from '@/app/features/persons/personSlice';
import { AppDispatch } from '@/app/store';
import { logout } from '@/app/features/auth/authSlice';

interface UnitSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  isRtl: boolean;
  colorScheme?: string | null | undefined;
}

const UnitSelectionModal = memo(({ visible, onClose, isRtl, colorScheme }: UnitSelectionModalProps) => {
  const styles = getStyles(colorScheme);
  const dispatch = useDispatch<AppDispatch>();
  
  // Get current user unit and all units
  const userUnit = useSelector(selectUserUnitDetails);
  const allUnits = useSelector(selectAllTanzeemiUnits);
  const levelsById = useSelector(selectLevelsById);
  const userDetails = useSelector(selectUserDetails);

  // State for selected unit
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectableOptions, setSelectableOptions] = useState<Option[]>([]);

  // Get parent unit of current user unit
  const parentUnit = useMemo(() => {
    if (!userUnit?.Parent_id) return null;
    return allUnits.find(unit => unit.id === userUnit.Parent_id);
  }, [userUnit, allUnits]);

  // Get grandparent unit of current user unit
  const grandparentUnit = useMemo(() => {
    if (!parentUnit?.Parent_id) return null;
    return allUnits.find(unit => unit.id === parentUnit.Parent_id);
  }, [parentUnit, allUnits]);

  // Get children units of current user unit
  const childrenUnits = useMemo(() => {
    if (!userUnit) return [];
    return allUnits.filter(unit => unit.Parent_id === userUnit.id);
  }, [userUnit, allUnits]);

  // Check if user unit is a leaf (has no children)
  const isUserUnitLeaf = useMemo(() => {
    return childrenUnits.length === 0;
  }, [childrenUnits]);

  // Format unit display with level name
  const formatUnitDisplay = useCallback((unit: any) => {
    if (!unit) return '';
    
    const levelId = unit.Level_id;
    let levelName = '';
    
    if (levelId && typeof levelId === 'number' && levelsById[levelId]) {
      levelName = levelsById[levelId].Name || '';
    }
    
    return levelName ? `${levelName}: ${unit.Name}` : unit.Name || '';
  }, [levelsById]);

  // Set up selectable options when user unit changes
  useEffect(() => {
    if (userUnit) {
      const options = [];
      
      // Add user unit as first option (user can select their own unit)
      options.push({
        id: `user-${userUnit.id}`,
        label: formatUnitDisplay(userUnit),
        value: userUnit.id.toString(),
      });
      
      // Add children units (user can select any of their children)
      if (childrenUnits.length > 0) {
        childrenUnits.forEach(unit => {
          options.push({
            id: `child-${unit.id}`,
            label: formatUnitDisplay(unit),
            value: unit.id.toString(),
          });
        });
      }
      
      setSelectableOptions(options);
      
      // Set user unit as default selection if no current selection
      if (!selectedUnit && options.length > 0) {
        setSelectedUnit(options[0].value);
      }
    } else {
      setSelectableOptions([]);
      setSelectedUnit(null);
    }
  }, [userUnit, childrenUnits, formatUnitDisplay, selectedUnit]);

  // Handle unit selection
  const handleUnitSelection = useCallback((option: Option) => {
    setSelectedUnit(option.value);
  }, []);

  // Handle confirmation
  const handleConfirm = useCallback(() => {
    if (selectedUnit) {
      // Update the dashboard selected unit
      dispatch(setDashboardSelectedUnit(parseInt(selectedUnit)));
      console.log('Selected unit:', selectedUnit);
    } else {
      // If no unit selected, reset to user unit
      dispatch(setDashboardSelectedUnit(userUnit?.id || null));
    }
    onClose();
  }, [selectedUnit, userUnit?.id, dispatch, onClose]);

  // Render fixed unit display (for parent, current, or grandparent)
  const renderFixedUnit = useCallback((unit: any, label: string) => {
    if (!unit) return null;
    
    return (
      <View style={styles.fixedUnitContainer}>
        <Text style={styles.fixedUnitLabel}>{label}</Text>
        <Text style={styles.fixedUnitText}>{formatUnitDisplay(unit)}</Text>
      </View>
    );
  }, [formatUnitDisplay, styles]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <UrduText style={styles.modalTitle}>یونٹ منتخب کریں</UrduText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color={colorScheme === 'dark' ? COLORS.white : COLORS.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {isUserUnitLeaf ? (
              // Scenario 2: User unit is leaf - show grandparent, parent, current (all fixed)
              <>
                {renderFixedUnit(grandparentUnit, "اوپر کی یونٹ")}
                {renderFixedUnit(parentUnit, "درمیانی یونٹ")}
                {renderFixedUnit(userUnit, "موجودہ یونٹ")}
                
                <View style={styles.infoContainer}>
                  <UrduText style={styles.infoText}>
                    آپ کی یونٹ لیف ہے، کوئی تبدیلی نہیں کی جا سکتی
                  </UrduText>
                </View>
              </>
            ) : (
              // Scenario 1: User unit has children - show parent (fixed), current (selectable), children (selectable)
              <>
                {renderFixedUnit(parentUnit, "اوپر کی یونٹ")}
                
                <DropdownSection
                  options={selectableOptions}
                  selectedValue={selectedUnit}
                  onSelect={handleUnitSelection}
                  placeholder="یونٹ منتخب کریں"
                  disabled={selectableOptions.length === 0}
                  colorScheme={colorScheme}
                />
                
                <View style={styles.infoContainer}>
                  <UrduText style={styles.infoText}>
                    آپ اپنی یونٹ یا اس کی نیچے کی یونٹس میں سے کوئی ایک منتخب کر سکتے ہیں
                  </UrduText>
                </View>
              </>
            )}

            <Spacer height={20} />

            <TouchableOpacity
              style={[styles.confirmButtonStyle, (isUserUnitLeaf || selectableOptions.length === 0) && styles.disabledButton]}
              disabled={isUserUnitLeaf || selectableOptions.length === 0}
              onPress={handleConfirm}
            >
              <UrduText style={styles.confirmTextStyle}>تصدیق کریں</UrduText>
            </TouchableOpacity>

            <Spacer height={10} />

            <TouchableOpacity style={styles.cancelButtonStyle} onPress={onClose}>
              <UrduText style={styles.cancelTextStyle}>منسوخ کریں</UrduText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    modalContent: {
      backgroundColor: isDark ? '#23242D' : COLORS.white,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      width: '90%',
      maxHeight: '80%',
      ...SHADOWS.medium,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#373842' : '#EBEBEB',
      paddingBottom: SPACING.sm,
    },
    modalTitle: {
      color: isDark ? COLORS.white : COLORS.primary,
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    closeButton: {
      padding: 5,
    },
    modalBody: {
      paddingVertical: SPACING.sm,
    },
    fixedUnitContainer: {
      backgroundColor: isDark ? '#373842' : '#F5F5F5',
      borderRadius: 8,
      padding: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDark ? '#4A4A4A' : '#E0E0E0',
    },
    fixedUnitLabel: {
      color: isDark ? '#FFB30F' : '#666666',
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 5,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    fixedUnitText: {
      color: isDark ? COLORS.white : COLORS.black,
      fontSize: 16,
      fontWeight: '500',
      fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    infoContainer: {
      backgroundColor: isDark ? '#2A2A2A' : '#F0F8FF',
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: isDark ? '#FFB30F' : '#0BA241',
    },
    infoText: {
      color: isDark ? '#FFB30F' : '#0BA241',
      fontSize: 14,
      textAlign: 'center',
      fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    confirmButtonStyle: {
      backgroundColor: COLORS.primary,
      width: '100%',
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    cancelButtonStyle: {
      width: '100%',
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: isDark ? COLORS.white : COLORS.black,
      alignItems: 'center',
    },
    confirmTextStyle: {
      color: COLORS.white,
      fontSize: 16,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    cancelTextStyle: {
      color: isDark ? COLORS.white : COLORS.black,
      fontSize: 16,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
  });
};

export default UnitSelectionModal;