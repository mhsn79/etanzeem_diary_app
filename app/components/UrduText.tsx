import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface UrduTextProps extends TextProps {
  children: React.ReactNode;
  kasheedaStyle?: boolean;
}

const UrduText: React.FC<UrduTextProps> = ({ style, children, kasheedaStyle = false, ...props }) => {
  const { currentLanguage } = useLanguage();

  return (
    <Text 
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
    fontFamily: 'JameelNooriNastaleeq',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  kasheedaText: {
    fontFamily: 'noori-kasheed',
  }
});

export default UrduText; 