import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import UrduText from '@/app/components/UrduText';

interface StatRowProps {
  label: string;
  value: string;
  colorScheme?: string | null | undefined;
}

const StatRow = memo(({ label, value, colorScheme }: StatRowProps) => {
  const styles = getStyles(colorScheme);
  
  return (
    <View style={styles.statRow}>
      <UrduText style={styles.boxContent}>{label}</UrduText>
      <UrduText style={styles.boxContent}>{value}</UrduText>
    </View>
  );
});

const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    boxContent: {
      color: isDark ? '#575862' : '#000',
      fontSize: 14,
    },
  });
};

export default StatRow;