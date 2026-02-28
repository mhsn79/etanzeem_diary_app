import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import UrduText from './UrduText';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

interface ActivityCardProps {
  id: string;
  title: string;
  location: string;
  dateTime: string;
  isCreator: boolean;
  shouldBeGreyedOut: boolean;
  isInteractive: boolean;
  showReportHint: boolean;
  onPress: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Pure presentational card — no Redux, no router, no state, no dialogs.
 *
 * Fabric crash mitigations (Android):
 * - No elevation/shadows (avoids native RenderNode shadow layers)
 * - No position:absolute (avoids separate native positioning context)
 * - Non-interactive cards use plain View (avoids Animated native nodes from TouchableOpacity)
 */
const ActivityCard: React.FC<ActivityCardProps> = ({
  id,
  title,
  location,
  dateTime,
  isCreator,
  shouldBeGreyedOut,
  isInteractive,
  showReportHint,
  onPress,
  onEdit,
  onDelete,
}) => {
  const containerStyle = [
    styles.cardContainer,
    shouldBeGreyedOut && styles.greyedOutCard,
    showReportHint && styles.draftOnReportCard,
  ];

  const cardContent = (
    <>
      {showReportHint && (
        <View style={styles.markAsReportedHint}>
          <Feather name="check-circle" size={14} color={COLORS.primary} />
          <UrduText style={styles.markAsReportedText}>سرگرمی مکمل ہو گئی تو رپورٹ کریں:</UrduText>
        </View>
      )}
      <View style={styles.titleContainer}>
        <View style={styles.titleDetailsContainer}>
          <UrduText style={[styles.title, shouldBeGreyedOut && styles.greyedOutText]}>
            {title}
          </UrduText>
          <UrduText style={[styles.detail, shouldBeGreyedOut && styles.greyedOutText]}>
            تاریخ وقت: {dateTime}
          </UrduText>
          <UrduText style={[styles.detail, shouldBeGreyedOut && styles.greyedOutText]}>
            مقام: {location}
          </UrduText>
        </View>
        {isCreator && (
          <TouchableOpacity style={styles.editIcon} onPress={() => onEdit(id)} activeOpacity={0.6}>
            <Feather name="edit" size={SIZES.icon.sSmall} color={COLORS.black} />
          </TouchableOpacity>
        )}
      </View>
      {isCreator && (
        <View style={styles.deleteRow}>
          <TouchableOpacity style={styles.deleteIcon} onPress={() => onDelete(id)} activeOpacity={0.6}>
            <Feather name="archive" size={SIZES.icon.sSmall} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // Non-interactive cards use plain View to avoid creating Animated native nodes
  if (isInteractive) {
    return (
      <TouchableOpacity
        style={containerStyle}
        activeOpacity={0.7}
        onPress={() => onPress(id)}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 20,
    marginVertical: 10,
    borderRadius: 12,
    // iOS: standard shadows. Android: hairline border instead of elevation
    // to avoid native RenderNode shadow layers that cause Fabric viewState crashes.
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '#d0d0d0',
        }),
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleDetailsContainer: {
    flex: 1,
    marginRight: SPACING.sm,
    alignItems: 'flex-start',
  },
  editIcon: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  deleteIcon: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.lg / 2,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  detail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  greyedOutCard: {
    opacity: 0.65,
    backgroundColor: '#E5E5E5',
  },
  greyedOutText: {
    color: '#999999',
  },
  draftOnReportCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  markAsReportedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: 4,
  },
  markAsReportedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontFamily: 'JameelNooriNastaleeq',
  },
});

export default React.memo(ActivityCard);
