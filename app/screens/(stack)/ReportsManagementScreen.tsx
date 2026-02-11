import React, { useState, useRef } from 'react';
import { StyleSheet, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/navigation';
import ReportsView from './components/ReportsView';
import CreateReportScreen, { CreateReportInitialParams } from './CreateReportScreen';

const ReportsManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // When set, show CreateReportScreen in-place so opening موجودہ رپورٹ doesn't flicker.
  // Always start null on mount so navigating from bottom bar shows the list, not a stale "open report".
  const [openReportParams, setOpenReportParams] = useState<CreateReportInitialParams | null>(null);

  const handleBack = () => {
    InteractionManager.runAfterInteractions(() => {
      router.canGoBack() ? router.back() : router.push(ROUTES.DASHBOARD);
    });
  };

  const handleOpenReport = (params: CreateReportInitialParams) => {
    console.log('[ReportsManagementScreen] handleOpenReport called, submissionId:', params.submissionId, 'renderCount:', renderCountRef.current);
    // Defer so state update isn't lost: tap runs inside promise callback; ReportsView useFocusEffect
    // can dispatch fetchReportsByUnitId and trigger re-renders before our commit. Next tick wins.
    setTimeout(() => {
      setOpenReportParams(params);
    }, 0);
  };

  const handleBackFromReport = () => {
    console.log('[ReportsManagementScreen] handleBackFromReport (onBackOverride) called');
    // Defer unmount to avoid Fabric "Unable to find viewState for tag" when going back:
    // let current frame/layout finish before tearing down CreateReportScreen.
    InteractionManager.runAfterInteractions(() => {
      setOpenReportParams(null);
    });
  };

  if (openReportParams) {
    console.log('[ReportsManagementScreen] RENDERING CreateReportScreen, submissionId:', openReportParams.submissionId, 'renderCount:', renderCountRef.current);
    return (
      <CreateReportScreen
        initialParams={openReportParams}
        onBackOverride={handleBackFromReport}
      />
    );
  }

  console.log('[ReportsManagementScreen] RENDERING ReportsView, renderCount:', renderCountRef.current);
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