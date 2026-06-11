import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import UrduText from './UrduText';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

interface BaitulmalCardProps {
  id: string;
  typeName: string;
  amount: number;
  notes?: string | null;
  isCreator: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Format number with commas: 15000 → "15,000" */
const formatAmount = (amount: number): string => {
  return amount.toLocaleString('en-US');
};

const BaitulmalCard: React.FC<BaitulmalCardProps> = ({
  id,
  typeName,
  amount,
  notes,
  isCreator,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.titleContainer}>
        <View style={styles.titleDetailsContainer}>
          <View style={styles.topRow}>
            <UrduText style={styles.typeName} numberOfLines={1}>{typeName}</UrduText>
            <UrduText style={styles.amount}>
              {formatAmount(amount)} روپے
            </UrduText>
          </View>
          {notes ? (
            <UrduText style={styles.notes} numberOfLines={1}>
              {notes}
            </UrduText>
          ) : null}
        </View>
        {isCreator && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editIcon} onPress={() => onEdit(id)} activeOpacity={0.6}>
              <Feather name="edit" size={SIZES.icon.sSmall} color={COLORS.black} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteIcon} onPress={() => onDelete(id)} activeOpacity={0.6}>
              <Feather name="archive" size={SIZES.icon.sSmall} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    marginVertical: 3,
    borderRadius: 10,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        }
      : {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '#d0d0d0',
        }),
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleDetailsContainer: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
  },
  amount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.tertiary,
    fontWeight: '600',
  },
  notes: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});

export default React.memo(BaitulmalCard);
