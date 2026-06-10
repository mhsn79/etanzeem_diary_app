import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/src/constants/navigation';
import ReportsView from './components/ReportsView';
import { OpenReportParams } from './components/ReportsView';

const ReportsManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push(ROUTES.DASHBOARD);
    }
  };

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
  return (
    <ReportsView 
      showHeader={true}
      title="رپورٹ مینجمنٹ"
      onBack={handleBack}
      extraScrollContentStyle={{ paddingTop: insets.top }}
      onOpenReport={handleOpenReport}
    />
  );
};

export default ReportsManagementScreen;