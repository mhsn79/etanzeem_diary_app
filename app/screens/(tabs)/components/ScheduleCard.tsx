import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import UrduText from '@/app/components/UrduText';
import { COLORS, SPACING } from '@/app/constants/theme';
import { ScheduleItem } from './types';

interface ScheduleCardProps {
  scheduleLength: number;
  formattedDate: string;
  onPress: () => void;
  colorScheme?: string | null | undefined;
}

const ScheduleCard = memo(({ scheduleLength=0, formattedDate, onPress, colorScheme }: ScheduleCardProps) => {
  const styles = getStyles(colorScheme);
  
  return (
    <View style={styles.scheduleContainer}>
    <View style={styles.scheduleCard}>
      <TouchableOpacity onPress={onPress} style={styles.scheduleItemContainer}>
        <UrduText style={styles.scheduleText}>
          {scheduleLength > 0 
            ? `اگلے 3 دنوں میں ${scheduleLength} ${scheduleLength === 1 ? 'سرگرمی' : 'سرگرمیاں'} شیڈولڈ ${scheduleLength === 1 ? 'ہے' : 'ہیں'}۔` 
            : 'اگلے 3 دنوں میں کوئی سرگرمی شیڈولڈ نہیں ہے۔'
          }
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
      marginTop: SPACING.lg*6,
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
      paddingHorizontal: 10,
    },
    scheduleText: {
      color: COLORS.warning,
    },
  });
};

export default ScheduleCard;