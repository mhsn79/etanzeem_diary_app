import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { TYPOGRAPHY } from '../constants/theme';

interface UrduTextProps extends TextProps {
  children: React.ReactNode;
  kasheedaStyle?: boolean;
  numberOfLines?: number;
}

const UrduText: React.FC<UrduTextProps> = ({ style, children, kasheedaStyle = false, numberOfLines, ...props }) => {
  const { currentLanguage } = useLanguage();

  return (
    <Text 
      numberOfLines={numberOfLines}
      style={[
        styles.baseText,
        currentLanguage === 'ur' && styles.urduText,
        kasheedaStyle && styles.kasheedaText,
        style

      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontSize: 16,
  },
  urduText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    writingDirection: 'rtl',
    // App runs in forced RTL (I18nManager.forceRTL(true) in app/_layout.tsx).
    // With swapLeftAndRight (RN default under RTL), textAlign:'left' renders at the
    // right (start) edge — which is what Urdu needs. Do NOT use 'right' here: it
    // swaps to the physical left.
    textAlign: 'left',
  },
  kasheedaText: {
    fontFamily: TYPOGRAPHY.fontFamily.kasheeda,
  }
});

export default UrduText; 