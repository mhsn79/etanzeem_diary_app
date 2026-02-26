import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Text, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import UrduText from '@/app/components/UrduText';
import Spacer from '@/app/components/Spacer';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, TYPOGRAPHY } from '@/app/constants/theme';
import {
  selectUserUnitDetails,
  selectAllTanzeemiUnits,
  selectLevelsById,
  selectUserAssignedUnits,
  selectDashboardSelectedUnitId,
  setDashboardSelectedUnit,
} from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';
import { useAppSelector } from '@/src/hooks/useAppSelector';

interface UnitSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  isRtl: boolean;
  colorScheme?: string | null | undefined;
}

interface UnitGroup {
  unit: any;
  children: any[];
}

const UnitSelectionModal = memo(({ visible, onClose, isRtl, colorScheme }: UnitSelectionModalProps) => {
  const styles = getStyles(colorScheme);
  const dispatch = useDispatch<AppDispatch>();

  const userUnit = useSelector(selectUserUnitDetails);
  const allUnits = useSelector(selectAllTanzeemiUnits);
  const levelsById = useAppSelector(selectLevelsById);
  const userAssignedUnits = useSelector(selectUserAssignedUnits);
  const currentSelectedUnitId = useSelector(selectDashboardSelectedUnitId);

  // Local selection state (tracks which unit is tapped before confirm)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  // Sync local selection with Redux when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedUnitId(currentSelectedUnitId || userUnit?.id || null);
    }
  }, [visible, currentSelectedUnitId, userUnit?.id]);

  // Helper: format unit name with description
  const formatUnitName = useCallback((unit: any) => {
    const name = unit.Name || unit.name || '';
    const description = unit.Description || unit.description || '';
    if (description && description !== name) {
      return `${name} (${description})`;
    }
    return name;
  }, []);

  // Helper: format unit display with level name
  const formatUnitDisplay = useCallback((unit: any) => {
    if (!unit) return '';
    const levelId = unit.Level_id;
    let levelName = '';
    if (levelId && typeof levelId === 'number' && levelsById[levelId]) {
      levelName = levelsById[levelId].Name || '';
    }
    return levelName ? `${levelName}: ${formatUnitName(unit)}` : formatUnitName(unit) || '';
  }, [levelsById, formatUnitName]);

  // Build grouped list: assigned units with their children
  const groupedUnits = useMemo((): UnitGroup[] => {
    // Use assigned units if available, otherwise fall back to user unit
    const assignedUnits = userAssignedUnits.length > 0
      ? userAssignedUnits
      : (userUnit ? [userUnit] : []);

    if (assignedUnits.length === 0) return [];

    return assignedUnits.map(assignedUnit => ({
      unit: assignedUnit,
      children: allUnits.filter(u => u.Parent_id === assignedUnit.id),
    }));
  }, [userAssignedUnits, userUnit, allUnits]);

  // Total accessible units count
  const totalAccessibleUnits = useMemo(() => {
    return groupedUnits.reduce((sum, g) => sum + 1 + g.children.length, 0);
  }, [groupedUnits]);

  // Check if there's only one unit with no children (leaf-only user)
  const isLeafOnly = totalAccessibleUnits === 1 && groupedUnits.length === 1 && groupedUnits[0].children.length === 0;

  // Get parent unit of primary assigned unit (for context display)
  const parentUnit = useMemo(() => {
    if (groupedUnits.length === 0) return null;
    const primaryUnit = groupedUnits[0].unit;
    if (!primaryUnit?.Parent_id) return null;
    return allUnits.find(unit => unit.id === primaryUnit.Parent_id) || null;
  }, [groupedUnits, allUnits]);

  const handleConfirm = useCallback(() => {
    if (selectedUnitId) {
      dispatch(setDashboardSelectedUnit(selectedUnitId));
    }
    onClose();
  }, [selectedUnitId, dispatch, onClose]);

  // Render a single unit row with radio button
  const renderUnitRow = useCallback((unit: any, isChild: boolean) => {
    const isSelected = selectedUnitId === unit.id;
    const isDark = colorScheme === 'dark';

    return (
      <TouchableOpacity
        key={unit.id}
        style={[
          styles.unitRow,
          isChild && styles.unitRowChild,
          isSelected && styles.unitRowSelected,
        ]}
        onPress={() => setSelectedUnitId(unit.id)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
          size={22}
          color={isSelected ? (isDark ? '#FFB30F' : COLORS.primary) : (isDark ? '#888' : '#999')}
        />
        <View style={styles.unitRowTextContainer}>
          <Text
            style={[
              styles.unitRowText,
              isSelected && styles.unitRowTextSelected,
              isChild && styles.unitRowTextChild,
            ]}
            numberOfLines={2}
          >
            {formatUnitDisplay(unit)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [selectedUnitId, colorScheme, styles, formatUnitDisplay]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <UrduText style={styles.modalTitle}>یونٹ منتخب کریں</UrduText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color={colorScheme === 'dark' ? COLORS.white : COLORS.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Parent context (read-only) */}
            {parentUnit && (
              <View style={styles.fixedUnitContainer}>
                <Text style={styles.fixedUnitLabel}>بالائی یونٹ</Text>
                <Text style={styles.fixedUnitText}>{formatUnitDisplay(parentUnit)}</Text>
              </View>
            )}

            {isLeafOnly ? (
              // Leaf-only: show read-only current unit
              <>
                <View style={styles.fixedUnitContainer}>
                  <Text style={styles.fixedUnitLabel}>موجودہ یونٹ</Text>
                  <Text style={styles.fixedUnitText}>{formatUnitDisplay(groupedUnits[0]?.unit)}</Text>
                </View>
                <View style={styles.infoContainer}>
                  <UrduText style={styles.infoText}>
                    کوئی ذیلی یونٹ رجسٹرڈ نہیں ہے۔
                  </UrduText>
                </View>
              </>
            ) : (
              // Scrollable radio list of all accessible units
              <>
                <ScrollView
                  style={styles.unitListScroll}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {groupedUnits.map((group, groupIndex) => (
                    <View key={group.unit.id}>
                      {/* Divider between groups (not before first) */}
                      {groupIndex > 0 && <View style={styles.groupDivider} />}

                      {/* Assigned unit (parent-level row) */}
                      {renderUnitRow(group.unit, false)}

                      {/* Children (indented rows) */}
                      {group.children.map(child => renderUnitRow(child, true))}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.infoContainer}>
                  <UrduText style={styles.infoText}>
                    آپ کی {groupedUnits.reduce((s, g) => s + 1 + g.children.length, 0)} یونٹس تک رسائی ہے
                  </UrduText>
                </View>
              </>
            )}

            <Spacer height={16} />

            <TouchableOpacity
              style={[styles.confirmButtonStyle, isLeafOnly && styles.disabledButton]}
              disabled={isLeafOnly}
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
    unitListScroll: {
      maxHeight: 280,
      marginBottom: 10,
    },
    unitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 4,
      gap: 10,
    },
    unitRowChild: {
      paddingLeft: 36,
    },
    unitRowSelected: {
      backgroundColor: isDark ? '#2A3040' : '#EBF3FF',
    },
    unitRowTextContainer: {
      flex: 1,
    },
    unitRowText: {
      color: isDark ? COLORS.white : COLORS.black,
      fontSize: 16,
      fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    unitRowTextSelected: {
      color: isDark ? '#FFB30F' : COLORS.primary,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    unitRowTextChild: {
      fontSize: 15,
    },
    groupDivider: {
      height: 1,
      backgroundColor: isDark ? '#373842' : '#EBEBEB',
      marginVertical: 8,
      marginHorizontal: 12,
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
