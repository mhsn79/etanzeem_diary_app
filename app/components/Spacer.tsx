import React from 'react';
import { View } from 'react-native';

type SpacerProps = {
  width?: any;
  height?: number;  // Custom height for the spacer
  backgroundColor?: string;
};

const Spacer: React.FC<SpacerProps> = ({ height = 20, backgroundColor = "transparent", width = "100%" }) => {
  return <View style={{ height, width, backgroundColor }} />;
};

export default Spacer;
