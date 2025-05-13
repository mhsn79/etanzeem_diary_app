import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/navigation';
import ReportsView from './components/ReportsView';

const ReportsManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Custom back handler for this screen
  const handleBack = () => {
    router.canGoBack() ? router.back() : router.push(ROUTES.DASHBOARD);
  };

  return (
    <ReportsView 
      showHeader={true}
      title="رپورٹ مینجمنٹ"
      onBack={handleBack}
      extraScrollContentStyle={{ paddingTop: insets.top }}
    />
  );
};

export default ReportsManagementScreen;