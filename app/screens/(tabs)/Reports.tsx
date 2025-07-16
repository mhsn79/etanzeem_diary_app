import React from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import ReportsView from '../(stack)/components/ReportsView';
import { 
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
  selectUserUnitDetails
} from '@/app/features/tanzeem/tanzeemSlice';
import { useTokenRefresh } from '@/app/utils/tokenRefresh';

const Reports: React.FC = () => {
  // Initialize automatic token refresh
  const { getTokenInfo } = useTokenRefresh();
  
  // Get selected unit for dashboard
  const selectedUnit = useSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const userUnit = useSelector(selectUserUnitDetails);
  
  // Use selected unit if available, otherwise fall back to user unit
  const displayUnit = selectedUnit || userUnit;
  const displayUnitId = selectedUnitId || userUnit?.id;

  return (
    <ReportsView 
      showHeader={false}
      selectedUnit={displayUnit}
      selectedUnitId={displayUnitId}
    />
  );
};

export default Reports;