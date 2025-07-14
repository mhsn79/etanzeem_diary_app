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
    textAlign: 'right',
  },
  kasheedaText: {
    fontFamily: TYPOGRAPHY.fontFamily.kasheeda,
  }
});

export default UrduText; 