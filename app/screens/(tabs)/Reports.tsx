import React from 'react';
import { StyleSheet } from 'react-native';
import ReportsView from '../(stack)/components/ReportsView';

const Reports: React.FC = () => {
  return (
    <ReportsView 
      showHeader={false}
    />
  );
};

export default Reports;