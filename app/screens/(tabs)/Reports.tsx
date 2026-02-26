import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import ReportsView from '../(stack)/components/ReportsView';
import CreateReportScreen, { CreateReportInitialParams } from '../(stack)/CreateReportScreen';
import {
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
  selectUserUnitDetails
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectIsAuthenticated } from '@/app/features/auth/authSlice';
import { useTokenRefresh } from '@/app/utils/tokenRefresh';

// Persist in-tab report params across remounts (tab/focus can unmount Reports and clear state)
let persistedOpenReportParams: CreateReportInitialParams | null = null;

const Reports: React.FC = () => {
  // Initialize automatic token refresh
  const { getTokenInfo } = useTokenRefresh();
  
  // When set, show CreateReportScreen in-tab (avoids stack navigation / immediate back)
  const [openReportParams, setOpenReportParamsState] = useState<CreateReportInitialParams | null>(
    () => persistedOpenReportParams
  );
  const mountIdRef = useRef(Math.random().toString(36).slice(2, 8));
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // Restore from persisted when component mounts (e.g. after tab remount)
  useEffect(() => {
    if (persistedOpenReportParams && !openReportParams) {
      console.log('[Reports] Restoring openReportParams after mount:', {
        mountId: mountIdRef.current,
        submissionId: persistedOpenReportParams.submissionId
      });
      setOpenReportParamsState(persistedOpenReportParams);
    }
  }, []);

  const setOpenReportParams = (value: CreateReportInitialParams | null) => {
    persistedOpenReportParams = value;
    setOpenReportParamsState(value);
  };

  const handleOpenReport = (params: CreateReportInitialParams) => {
    console.log('[Reports] onOpenReport called, setting params:', {
      submissionId: params.submissionId,
      mountId: mountIdRef.current
    });
    setOpenReportParams(params);
  };

  const handleBackFromReport = () => {
    console.log('[Reports] onBackOverride called, clearing params. mountId:', mountIdRef.current);
    setOpenReportParams(null);
  };

  // Clear persisted report params on logout to prevent stale data for next user
  const isAuthenticated = useSelector(selectIsAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) {
      persistedOpenReportParams = null;
      setOpenReportParamsState(null);
    }
  }, [isAuthenticated]);

  // Get selected unit for dashboard
  const selectedUnit = useSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const userUnit = useSelector(selectUserUnitDetails);
  
  // Use selected unit if available, otherwise fall back to user unit
  const displayUnit = selectedUnit || userUnit;
  const displayUnitId = selectedUnitId || userUnit?.id;

  if (openReportParams) {
    console.log('[Reports] Rendering CreateReportScreen in-tab. mountId:', mountIdRef.current, 'renderCount:', renderCountRef.current);
    return (
      <CreateReportScreen
        initialParams={openReportParams}
        onBackOverride={handleBackFromReport}
      />
    );
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

export default Reports;