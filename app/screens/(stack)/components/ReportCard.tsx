import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import UrduText from '../../../components/UrduText';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';

interface ReportCardProps {
  title: string;
  location: string;
  status: string;
  statusColor?: string;
  onEdit?: () => void;
  onView?: () => void;
  showEdit?: boolean; // Deprecated, kept for backward compatibility but unused visually
  sumbitDateText: string;
  progress?: number; // Progress for the submission (0–100)
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  location,
  status,
  sumbitDateText,
  statusColor = COLORS.primary,
  onEdit,
  onView,
  showEdit = true,
  progress,
}) => {
  // Determine an appropriate background color for the status badge based on text color
  let badgeBackgroundColor = '#E0F2FE'; // light blue default
  let badgeTextColor = statusColor;
  
  if (statusColor === COLORS.success || statusColor === '#10B981') {
    badgeBackgroundColor = '#D1FAE5'; // light green
    badgeTextColor = '#065F46'; // dark green
  } else if (statusColor === '#F59E0B' || statusColor === COLORS.tertiary) {
    badgeBackgroundColor = '#FEF3C7'; // light yellow
    badgeTextColor = '#92400E'; // dark yellow/orange
  } else if (statusColor === '#DC2626' || statusColor === COLORS.error) {
    badgeBackgroundColor = '#FEE2E2'; // light red
    badgeTextColor = '#991B1B'; // dark red
  } else if (statusColor === COLORS.primary) {
    badgeBackgroundColor = '#E0F2FE'; // light primary
    badgeTextColor = COLORS.primary; 
  }

  // Use onEdit or onView as the tap action since they do the same thing usually
  const handlePress = onView || onEdit;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.container}>
        {/* Top Row: Title */}
        <View style={styles.header}>
          <UrduText style={styles.title}>{title}</UrduText>
        </View>
        
        {/* Second Row: Location/Unit (subdued) */}
        <View style={styles.locationContainer}>
          <UrduText style={styles.location}>{location}</UrduText>
        </View>

        {/* Third Row: Date and Status Badge */}
        <View style={styles.metaRow}>
          <UrduText style={styles.sumbitDateText}>{sumbitDateText}</UrduText>
          <View style={[styles.statusBadge, { backgroundColor: badgeBackgroundColor }]}>
            <UrduText style={[styles.statusBadgeText, { color: badgeTextColor }]}>{status}</UrduText>
          </View>
        </View>

        {/* Progress bar */}
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <UrduText style={styles.progressText}>{progress}%</UrduText>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    ...SHADOWS.small,
  },
  header: {
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  locationContainer: {
    marginBottom: SPACING.sm,
  },
  location: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  sumbitDateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    writingDirection: 'rtl',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.xl,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  progressContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default ReportCard; 