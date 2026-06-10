import React from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import ReportsView from '../(stack)/components/ReportsView';
import { OpenReportParams } from '../(stack)/components/ReportsView';
import {
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
  selectUserUnitDetails
} from '@/src/features/tanzeem/tanzeemSlice';
import { COLORS } from '@/src/constants/theme';
import NoUnitMessage from '@/src/components/NoUnitMessage';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/src/constants/navigation';

const Reports: React.FC = () => {
  const router = useRouter();

  const handleOpenReport = (params: OpenReportParams) => {
    router.push({
      pathname: ROUTES.CREATE_REPORT,
      params: {
        submissionId: params.submissionId.toString(),
        templateId: params.templateId.toString(),
        managementId: params.managementId.toString(),
        unitId: params.unitId.toString(),
        mode: params.mode,
        status: params.status,
      },
    });
  };

  // Get selected unit for dashboard
  const selectedUnit = useSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const userUnit = useSelector(selectUserUnitDetails);
  
  // Use selected unit if available, otherwise fall back to user unit
  const displayUnit = selectedUnit || userUnit;
  const displayUnitId = selectedUnitId || userUnit?.id;

  if (!displayUnitId) {
    return <NoUnitMessage />;
  }

  return (
    <ReportsView 
      showHeader={false}
      selectedUnit={displayUnit}
      selectedUnitId={displayUnitId}
      onOpenReport={handleOpenReport}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  fallbackText: {
    marginTop: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});

export default Reports;