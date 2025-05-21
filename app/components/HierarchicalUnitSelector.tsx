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
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedUC, setSelectedUC] = useState<string | null>(null);

  // Filter units by level
  const districts = hierarchyUnits.filter(unit => unit.level === 1);
  const zones = hierarchyUnits.filter(unit => unit.level === 2 && (!selectedDistrict || unit.parent_id?.toString() === selectedDistrict));
  const ucs = hierarchyUnits.filter(unit => (unit.level === 3 || unit.level === 4) && (!selectedZone || unit.parent_id?.toString() === selectedZone));

  // Auto-select single options
  useEffect(() => {
    if (districts.length === 1 && !selectedDistrict) {
      setSelectedDistrict(districts[0].id.toString());
    }
    if (zones.length === 1 && !selectedZone && selectedDistrict) {
      setSelectedZone(zones[0].id.toString());
    }
    if (ucs.length === 1 && !selectedUC && selectedZone) {
      setSelectedUC(ucs[0].id.toString());
    }
  }, [districts, zones, ucs, selectedDistrict, selectedZone, selectedUC]);

  const handleSelection = (unit: Unit, level: number) => {
    const value = unit.id.toString();
    if (level === 1) {
      setSelectedDistrict(value);
      setSelectedZone(null);
      setSelectedUC(null);
    } else if (level === 2) {
      setSelectedZone(value);
      setSelectedUC(null);
    } else {
      setSelectedUC(value);
      onSelect(unit);
    }
  };

  const renderUnitCard = (unit: Unit, level: number) => {
    const isSelected = unit.id.toString() === (level === 1 ? selectedDistrict : level === 2 ? selectedZone : selectedUC);
    return (
      <TouchableOpacity
        key={unit.id}
        onPress={() => handleSelection(unit, level)}
        style={[styles.card, isSelected && styles.selectedCard, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
      >
        <LocationIcon style={styles.cardIcon} />
        <UrduText style={[styles.cardLabel, { color: theme.text }]}>
          {unit.Name || unit.name || `Level ${unit.level} Unit`}
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
                {unit.Name || unit.name} ({i18n.t('level')} {unit.level})
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
          districts.map(unit => renderUnitCard(unit, 1))
        )}
      </View>

      {/* Zone Selection */}
      {selectedDistrict && (
        <View style={styles.section}>
          <UrduText style={[styles.sectionTitle, { color: theme.primary }]}>{i18n.t('select_zone')}</UrduText>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : (
            zones.map(unit => renderUnitCard(unit, 2))
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
            ucs.map(unit => renderUnitCard(unit, 3))
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