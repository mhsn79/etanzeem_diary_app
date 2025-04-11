import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import UrduText from '../../../components/UrduText';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';

interface ReportCardProps {
  title: string;
  location: string;
  status: string;
  statusColor?: string;
  onEdit?: () => void;
  showEdit?: boolean;
  sumbitDateText: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  location,
  status,
  sumbitDateText,
  statusColor = COLORS.primary,
  onEdit,
  showEdit = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UrduText style={styles.title}>{title}</UrduText>
        {showEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <FontAwesome name="edit" size={18} color={COLORS.black} />
          </TouchableOpacity>
        )}
      </View>
      <UrduText style={styles.sumbitDateText}>{sumbitDateText}</UrduText>
      <View style={styles.content}>
        <UrduText style={styles.location}>{location}</UrduText>
        
        <View style={styles.statusContainer}>
          <UrduText style={[styles.statusLabel,{ color: statusColor }]}>اسٹیٹس</UrduText>
          <UrduText style={[styles.statusLabel,{ color: statusColor }]}>:</UrduText>
          <UrduText style={[styles.statusValue, { color: statusColor }]}>{status}</UrduText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
  },
  editButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  sumbitDateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  location: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    writingDirection: 'rtl',
  },
  statusValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
});

export default ReportCard; 