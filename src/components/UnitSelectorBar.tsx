import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import UrduText from './UrduText';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import {
  selectUserUnitDetails,
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
  selectUserAssignedUnits,
  selectLevelsById,
  selectChildUnits,
} from '@/src/features/tanzeem/tanzeemSlice';
import { formatUnitName } from '@/src/utils/formatUnitName';
import UnitSelectionModal from '@/app/screens/(tabs)/components/UnitSelectionModal';
import i18n from '@/src/i18n';

const UnitSelectorBar: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const isRtl = i18n.locale === 'ur';

  const userUnit = useSelector(selectUserUnitDetails);
  const selectedUnit = useSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const assignedUnits = useSelector(selectUserAssignedUnits);
  const levelsById = useSelector(selectLevelsById);
  const displayUnit = selectedUnit || userUnit;

  // Check if user has multiple accessible units (assigned + children)
  const primaryUnitId = userUnit?.id;
  const childUnits = useSelector(selectChildUnits(primaryUnitId || 0));
  const hasMultipleUnits = assignedUnits.length > 1 || (childUnits && childUnits.length > 0);

  // Build display label with level name
  const displayLabel = React.useMemo(() => {
    if (!displayUnit) return '';
    const levelId = displayUnit.Level_id || displayUnit.level_id;
    let levelName = '';
    if (levelId && levelsById[levelId]) {
      levelName = levelsById[levelId].Name || '';
    }
    const unitName = formatUnitName(displayUnit);
    return levelName ? `${levelName}: ${unitName}` : unitName;
  }, [displayUnit, levelsById]);

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => hasMultipleUnits && setShowModal(true)}
        activeOpacity={hasMultipleUnits ? 0.7 : 1}
        disabled={!hasMultipleUnits}
      >
        <UrduText style={styles.unitText} numberOfLines={1}>
          {(hasMultipleUnits ? '▼ ' : '') + (displayLabel || 'یونٹ')}
        </UrduText>
      </TouchableOpacity>

      <UnitSelectionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        isRtl={isRtl}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.lightPrimary || '#E3F2FD',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  unitText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
    textAlign: 'left',
  },
});

export default UnitSelectorBar;
