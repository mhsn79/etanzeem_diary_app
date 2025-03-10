import React from 'react';
import { Text, TextProps } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface UrduTextProps extends TextProps {
  children: React.ReactNode;
}

const UrduText: React.FC<UrduTextProps> = ({ style, children, ...props }) => {
  const { getTextStyle } = useLanguage();

  return (
    <Text style={[getTextStyle(), style]} {...props}>
      {children}
    </Text>
  );
};

export default UrduText; 