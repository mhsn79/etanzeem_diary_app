import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import UrduText from '@/app/components/UrduText';
import LeftUpArrowBlue from '@/assets/images/left-up-arrow-blue.svg';
import StatRow from './StatRow';
import { Stat } from './types';

interface DashboardBoxProps {
  title: string;
  stats: Stat[];
  onPress: () => void;
  isRtl: boolean;
  colorScheme?: string | null | undefined;
}

const DashboardBox = memo(({ title, stats, onPress, isRtl, colorScheme }: DashboardBoxProps) => {
  const styles = getStyles(colorScheme);
  
  return (
    <View style={styles.box}>
      <View style={styles.boxHeader}>
        <TouchableOpacity onPress={onPress}>
          <UrduText kasheedaStyle={true} style={styles.boxTitle}>{title}</UrduText>
        </TouchableOpacity>
        <LeftUpArrowBlue style={{ transform: [{ rotateY: isRtl ? '0deg' : '180deg' }] }} />
      </View>
      {stats.map((stat, index) => (
        <StatRow key={index} label={stat.label} value={stat.value} colorScheme={colorScheme} />
      ))}
    </View>
  );
});

const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    box: {
      backgroundColor: isDark ? '#23242D' : '#FFFFFF',
      width: '48%',
      borderRadius: 10,
      padding: 15,
    },
    boxHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    boxTitle: {
      color: isDark ? '#fff' : '#1E90FF',
      fontWeight: 'regular',
      fontSize: 16,
      marginBottom: 5,
    },
  });
};

export default DashboardBox;