import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import UrduText from '@/app/components/UrduText';
import { COLORS, SPACING } from '@/app/constants/theme';
import { ScheduleItem } from './types';

interface ScheduleCardProps {
  schedule: ScheduleItem[];
  formattedDate: string;
  onPress: () => void;
  colorScheme?: string | null | undefined;
}

const ScheduleCard = memo(({ schedule, formattedDate, onPress, colorScheme }: ScheduleCardProps) => {
  const styles = getStyles(colorScheme);
  
  return (
    <View style={styles.scheduleContainer}>
    <View style={styles.scheduleCard}>
      <TouchableOpacity onPress={onPress} style={styles.scheduleItemContainer}>
        <UrduText style={styles.scheduleText}>
          {schedule.length > 0 ? 'آج آپ کے شیڈول میں تین سرگرمیاں ہیں۔' : 'آج آپ کے شیڈول میں کوئی سرگرمی نہیں ہے۔'}
        </UrduText>
        <UrduText style={styles.scheduleText}>{formattedDate}</UrduText>
      </TouchableOpacity>
    </View>
  </View>
  );
});

const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    scheduleContainer: {
      position: 'absolute',
      marginTop: 140,
    },
    scheduleCard: {
      backgroundColor: isDark ? '#008cff' : '#FFFFFF',
      borderRadius: 15,
      marginHorizontal: SPACING.sm,
      width: '100%',
      padding: 5,
    },
    scheduleItemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
    },
    scheduleText: {
      color: COLORS.warning,
    },
  });
};

export default ScheduleCard;