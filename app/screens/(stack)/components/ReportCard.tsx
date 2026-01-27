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
  onView?: () => void;
  showEdit?: boolean;
  sumbitDateText: string;
  submissionId?: number; // Add submission ID for debug mode
  managementId?: number; // Add management ID for debug mode
  templateId?: number; // Add template ID for debug mode
  progress?: number; // Add progress for the submission
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
  submissionId,
  managementId,
  templateId,
  progress,
}) => {
  return (
    <TouchableOpacity onPress={onView} activeOpacity={0.7}>
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
        {/* Progress bar */}
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <UrduText style={styles.progressText}>{progress}% مکمل</UrduText>
          </View>
        )}
        {/* Debug mode: Show submission ID */}
        <View style={styles.debugContainer}>
          {submissionId && <UrduText style={styles.debugText}>ID: {submissionId}</UrduText>}
          {managementId && <UrduText style={styles.debugText}>Mgmt: {managementId}</UrduText>}
          {templateId && <UrduText style={styles.debugText}>Template: {templateId}</UrduText>}
          {progress !== undefined && <UrduText style={styles.debugText}>Progress: {progress}% {progress === 0 ? '(No answers)' : ''}</UrduText>}
        </View>
      </View>
    </TouchableOpacity>
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
  debugContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.textSecondary,
  },
  debugText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    writingDirection: 'rtl',
  },
  progressContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: SPACING.xs,
  },
});

export default ReportCard; 