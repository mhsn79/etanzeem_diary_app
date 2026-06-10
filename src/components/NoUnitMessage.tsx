import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UrduText from './UrduText';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const NoUnitMessage: React.FC = () => (
  <View style={styles.container}>
    <Ionicons name="business-outline" size={48} color={COLORS.textSecondary} />
    <UrduText style={styles.title}>کوئی تنظیمی یونٹ تفویض نہیں ہوئی</UrduText>
    <UrduText style={styles.subtitle}>
      آپ کے اکاؤنٹ کو ابھی کسی تنظیمی یونٹ سے منسلک نہیں کیا گیا۔ رسائی حاصل کرنے کے لیے ایڈمن سے رابطہ کریں۔
    </UrduText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
});

export default NoUnitMessage;
