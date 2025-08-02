import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import UrduText from '@/app/components/UrduText';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '@/app/constants/theme';
import { AntDesign } from '@expo/vector-icons';
import i18n from '@/app/i18n';
import LocationIcon from '@/assets/images/location-icon-yellow.svg';

interface Unit {
  id: number;
  Name: string;
  name?: string;
  level: number;
  parent_id?: number;
  zaili_unit_hierarchy?: number[];
  Description?: string;
  description?: string;
}

interface HierarchicalUnitSelectorProps {
  hierarchyUnits: Unit[];
  parentUnits: Unit[];
  onSelect: (unit: Unit) => void;
  isRtl: boolean;
  theme: { primary: string; background: string; text: string };
  loading: boolean;
}

const HierarchicalUnitSelector: React.FC<HierarchicalUnitSelectorProps> = ({
  hierarchyUnits,
  parentUnits,
  onSelect,
  isRtl,
  theme,
  loading,
}) => {
  // Helper function to format unit name with description
  const formatUnitName = (unit: any) => {
    const name = unit.Name || unit.name || '';
    const description = unit.Description || unit.description || '';
    
    // If description exists and is different from name, append it
    if (description && description !== name) {
      return `${name} (${description})`;
    }
    
    return name;
  };

  // State for selected units at each level
  const [selectedDistrict, setSelectedDistrict] = useState<Unit | null>(null);
  const [selectedZone, setSelectedZone] = useState<Unit | null>(null);
  const [selectedUC, setSelectedUC] = useState<Unit | null>(null);

  // Auto-select single options
  useEffect(() => {
    if (hierarchyUnits.length > 0) {
      const district = hierarchyUnits.find(unit => unit.level === 1);
      if (district && !selectedDistrict) {
        setSelectedDistrict(district);
      }
      const zone = hierarchyUnits.find(unit => unit.level === 2 && selectedDistrict?.id === unit.parent_id);
      if (zone && !selectedZone && selectedDistrict) {
        setSelectedZone(zone);
      }
      const uc = hierarchyUnits.find(unit => unit.level === 3 && selectedZone?.id === unit.parent_id);
      if (uc && !selectedUC && selectedZone) {
        setSelectedUC(uc);
      }
    }
  }, [hierarchyUnits, selectedDistrict, selectedZone, selectedUC]);

  // Handle unit selection
  const handleSelection = (unit: Unit, level: number) => {
    switch (level) {
      case 1:
        setSelectedDistrict(unit);
        setSelectedZone(null);
        setSelectedUC(null);
        break;
      case 2:
        setSelectedZone(unit);
        setSelectedUC(null);
        break;
      case 3:
        setSelectedUC(unit);
        onSelect(unit);
        break;
    }
  };

  // Render unit card
  const renderUnitCard = (unit: Unit, level: number) => {
    const isSelected = 
      (level === 1 && selectedDistrict?.id === unit.id) ||
      (level === 2 && selectedZone?.id === unit.id) ||
      (level === 3 && selectedUC?.id === unit.id);

    return (
      <TouchableOpacity
        key={unit.id}
        onPress={() => handleSelection(unit, level)}
        style={[styles.card, isSelected && styles.selectedCard, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
      >
        <LocationIcon style={styles.cardIcon} />
        <UrduText style={[styles.cardLabel, { color: theme.text }]}>
          {formatUnitName(unit) || `Level ${unit.level} Unit`}
        </UrduText>
        {isSelected && <AntDesign name="check" size={20} color={theme.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Parent Units */}
      <View style={styles.section}>
        <UrduText style={[styles.sectionTitle, { color: theme.primary }]}>{i18n.t('parent_units')}</UrduText>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : parentUnits.length > 0 ? (
          parentUnits.map(unit => (
            <View key={`parent-${unit.id}`} style={styles.parentUnit}>
              <UrduText style={[styles.parentUnitText, { color: theme.text }]}>
                {formatUnitName(unit)} ({i18n.t('level')} {unit.level})
              </UrduText>
            </View>
          ))
        ) : (
          <UrduText style={[styles.noDataText, { color: theme.text }]}>{i18n.t('no_parent_units')}</UrduText>
        )}
      </View>

      {/* District Selection */}
      <View style={styles.section}>
        <UrduText style={[styles.sectionTitle, { color: theme.primary }]}>{i18n.t('select_district')}</UrduText>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          hierarchyUnits.filter(unit => unit.level === 1).map(unit => renderUnitCard(unit, 1))
        )}
      </View>

      {/* Zone Selection */}
      {selectedDistrict && (
        <View style={styles.section}>
          <UrduText style={[styles.sectionTitle, { color: theme.primary }]}>{i18n.t('select_zone')}</UrduText>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            hierarchyUnits.filter(unit => unit.level === 2 && unit.parent_id === selectedDistrict.id).map(unit => renderUnitCard(unit, 2))
          )}
        </View>
      )}

      {/* UC Selection */}
      {selectedZone && (
        <View style={styles.section}>
          <UrduText style={[styles.sectionTitle, { color: theme.primary }]}>{i18n.t('select_uc')}</UrduText>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            hierarchyUnits.filter(unit => unit.level === 3 && unit.parent_id === selectedZone.id).map(unit => renderUnitCard(unit, 3))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  parentUnit: {
    backgroundColor: COLORS.lightGray,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  parentUnitText: {
    fontSize: 16,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    ...SHADOWS.small,
  },
  selectedCard: {
    backgroundColor: COLORS.lightPrimary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cardIcon: {
    width: 16,
    height: 16,
    marginRight: SPACING.xs,
  },
  cardLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'JameelNooriNastaleeq',
  },
});

export default HierarchicalUnitSelector;