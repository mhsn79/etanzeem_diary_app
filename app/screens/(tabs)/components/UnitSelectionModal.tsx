import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import UrduText from '@/app/components/UrduText';
import Spacer from '@/app/components/Spacer';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, TYPOGRAPHY } from '@/app/constants/theme';
import DropdownSection from './DropdownSection';
import { HierarchyUnit, Option } from './types';
import {
  selectAllHierarchyUnits as selectAllCompleteHierarchyUnits,
  selectHierarchyStatus,
  fetchCompleteTanzeemiHierarchy,
} from '@/app/features/tanzeem/tanzeemHierarchySlice';
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
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedUC, setSelectedUC] = useState<string | null>(null);
  const [districtOptions, setDistrictOptions] = useState<Option[]>([]);
  const [zoneOptions, setZoneOptions] = useState<Option[]>([]);
  const [ucOptions, setUCOptions] = useState<Option[]>([]);

  const completeHierarchyUnits = useSelector(selectAllCompleteHierarchyUnits) as HierarchyUnit[];
  const userDetails = useSelector(selectUserDetails);
  const hierarchyStatus = useSelector(selectHierarchyStatus);

  const removeSelfReferencingUnits = useCallback((units: HierarchyUnit[]) => {
    return units.filter((unit) => unit.id !== unit.parent_id);
  }, []);

  const handleSelection = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string | null>>, resetSetters: Array<React.Dispatch<React.SetStateAction<string | null>>>, currentValue: string | null) =>
      (option: Option) => {
        try {
          if (currentValue !== option.value) {
            setter(option.value);
            resetSetters.forEach((reset) => reset(null));
            const selectedUnit = completeHierarchyUnits.find((unit) => unit.id.toString() === option.value);
            if (selectedUnit) {
              console.log(`Selected unit:`, {
                name: selectedUnit.Name || selectedUnit.name,
                level: selectedUnit.level,
                parent_id: selectedUnit.parent_id,
              });
            }
          }
        } catch (error) {
          console.error(`Error in selection:`, error);
        }
      },
    [completeHierarchyUnits, selectedDistrict, selectedZone, selectedUC]
  );

  const handleDistrictSelection = useMemo(
    () => handleSelection(setSelectedDistrict, [setSelectedZone, setSelectedUC], selectedDistrict),
    [handleSelection, selectedDistrict]
  );
  
  const handleZoneSelection = useMemo(
    () => handleSelection(setSelectedZone, [setSelectedUC], selectedZone),
    [handleSelection, selectedZone]
  );
  
  const handleUCSelection = useMemo(
    () => handleSelection(setSelectedUC, [], selectedUC),
    [handleSelection, selectedUC]
  );

  useEffect(() => {
    if (visible && userDetails?.email) {
      dispatch(fetchCompleteTanzeemiHierarchy(userDetails.email))
        .unwrap()
        .then((result) => {
          console.log('Hierarchy fetch succeeded:', result);
        })
        .catch((error) => {
          console.error('Hierarchy fetch failed:', error);
          if (String(error).includes('Authentication expired')) {
            dispatch(logout()).then(() => router.replace('/screens/LoginScreen'));
          }
        });
    }
  }, [visible, dispatch, userDetails]);

  useEffect(() => {
    if (hierarchyStatus === 'succeeded' && completeHierarchyUnits.length > 0) {
      try {
        const districts = removeSelfReferencingUnits(completeHierarchyUnits.filter((unit) => unit.level === 1));
        const districtOpts = districts.length
          ? districts.map((unit) => ({
              id: `district-${unit.id}`,
              label: unit.Name || unit.name || 'Unknown District',
              value: unit.id.toString(),
            }))
          : completeHierarchyUnits
              .filter((unit) => unit.level === Math.min(...completeHierarchyUnits.map((u) => u.level)))
              .map((unit) => ({
                id: `district-${unit.id}`,
                label: unit.Name || unit.name || 'Unknown Unit',
                value: unit.id.toString(),
              }));

        setDistrictOptions(districtOpts);
        if (districtOpts.length === 1 && !selectedDistrict) {
          setSelectedDistrict(districtOpts[0].value);
        }
      } catch (error) {
        console.error('Error processing hierarchy:', error);
      }
    }
  }, [hierarchyStatus, completeHierarchyUnits, selectedDistrict, removeSelfReferencingUnits]);

  useEffect(() => {
    if (hierarchyStatus === 'succeeded' && completeHierarchyUnits.length > 0) {
      try {
        if (selectedDistrict) {
          const filteredZones = removeSelfReferencingUnits(
            completeHierarchyUnits.filter(
              (unit) =>
                unit.level === 2 &&
                (unit.parent_id?.toString() === selectedDistrict ||
                  (unit.zaili_unit_hierarchy?.some((id) => id.toString() === selectedDistrict) ?? false))
            )
          );
          const zoneOpts = filteredZones.length
            ? filteredZones.map((unit) => ({
                id: `zone-${unit.id}`,
                label: unit.Name || unit.name || 'Unknown Zone',
                value: unit.id.toString(),
              }))
            : removeSelfReferencingUnits(completeHierarchyUnits.filter((unit) => unit.level === 2)).map((unit) => ({
                id: `zone-${unit.id}`,
                label: unit.Name || unit.name || 'Unknown Zone',
                value: unit.id.toString(),
              }));

          setZoneOptions(zoneOpts);
          if (zoneOpts.length === 1 && !selectedZone) {
            setSelectedZone(zoneOpts[0].value);
          } else if (selectedZone && !zoneOpts.some((opt) => opt.value === selectedZone)) {
            setSelectedZone(null);
          }
        } else {
          setZoneOptions(
            removeSelfReferencingUnits(completeHierarchyUnits.filter((unit) => unit.level === 2)).map((unit) => ({
              id: `zone-${unit.id}`,
              label: unit.Name || unit.name || 'Unknown Zone',
              value: unit.id.toString(),
            }))
          );
          setSelectedZone(null);
        }
      } catch (error) {
        console.error('Error processing zones:', error);
      }
    }
  }, [hierarchyStatus, completeHierarchyUnits, selectedDistrict, selectedZone, removeSelfReferencingUnits]);

  useEffect(() => {
    if (hierarchyStatus === 'succeeded' && completeHierarchyUnits.length > 0) {
      try {
        if (selectedZone) {
          const filteredUCs = removeSelfReferencingUnits(
            completeHierarchyUnits.filter(
              (unit) =>
                (unit.level === 3 || unit.level === 4) &&
                (unit.parent_id?.toString() === selectedZone ||
                  (unit.zaili_unit_hierarchy?.some((id) => id.toString() === selectedZone) ?? false))
            )
          );
          const ucOpts = filteredUCs.length
            ? filteredUCs.map((unit) => ({
                id: `uc-${unit.id}`,
                label: unit.Name || unit.name || 'Unknown UC',
                value: unit.id.toString(),
              }))
            : removeSelfReferencingUnits(completeHierarchyUnits.filter((unit) => unit.level === 3 || unit.level === 4)).map(
                (unit) => ({
                  id: `uc-${unit.id}`,
                  label: unit.Name || unit.name || 'Unknown UC',
                  value: unit.id.toString(),
                })
              );

          setUCOptions(ucOpts);
          if (ucOpts.length === 1 && !selectedUC) {
            setSelectedUC(ucOpts[0].value);
          } else if (selectedUC && !ucOpts.some((opt) => opt.value === selectedUC)) {
            setSelectedUC(null);
          }
        } else {
          setUCOptions(
            removeSelfReferencingUnits(completeHierarchyUnits.filter((unit) => unit.level === 3 || unit.level === 4)).map(
              (unit) => ({
                id: `uc-${unit.id}`,
                label: unit.Name || unit.name || 'Unknown UC',
                value: unit.id.toString(),
              })
            )
          );
          setSelectedUC(null);
        }
      } catch (error) {
        console.error('Error processing UCs:', error);
      }
    }
  }, [hierarchyStatus, completeHierarchyUnits, selectedZone, selectedUC, removeSelfReferencingUnits]);

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
            <DropdownSection
              options={districtOptions}
              selectedValue={selectedDistrict}
              onSelect={handleDistrictSelection}
              placeholder="ضلع منتخب کریں"
              loading={hierarchyStatus === 'loading'}
              colorScheme={colorScheme}
            />

            <DropdownSection
              options={zoneOptions}
              selectedValue={selectedZone}
              onSelect={handleZoneSelection}
              placeholder="زون منتخب کریں"
              disabled={!selectedDistrict || zoneOptions.length === 0}
              colorScheme={colorScheme}
            />

            <DropdownSection
              options={ucOptions}
              selectedValue={selectedUC}
              onSelect={handleUCSelection}
              placeholder="یونین کونسل منتخب کریں"
              disabled={!selectedZone || ucOptions.length === 0}
              colorScheme={colorScheme}
            />

            <Spacer height={20} />

            <TouchableOpacity
              style={[styles.confirmButtonStyle, !selectedUC && styles.disabledButton]}
              disabled={!selectedUC}
              onPress={() => {
                // Handle confirmation
                onClose();
              }}
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
    },
    closeButton: {
      padding: 5,
    },
    modalBody: {
      paddingVertical: SPACING.sm,
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
    },
    cancelTextStyle: {
      color: isDark ? COLORS.white : COLORS.black,
      fontSize: 16,
    },
  });
};

export default UnitSelectionModal;