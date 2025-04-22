import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import ActivityCard from '../../components/ActivityCard';
import ScreenLayout from '../../components/ScreenLayout';
import { TabGroup } from '@/app/components/Tab';
import Dialog from '@/app/components/Dialog';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING } from '@/app/constants/theme';

import { useAppDispatch } from '@/src/hooks/useAppDispatch';
import { useAppSelector } from '@/src/hooks/useAppSelector';
import {
  fetchActivities,
  selectAllActivities,
  selectActivitiesStatus,
  selectActivitiesError,
} from '@/app/features/activities/activitySlice';

export default function Activities() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  /**
   * ────────────────────────────────────────────────────────────────────────────────
   * Redux state (always an array thanks to the slice fix)
   * ────────────────────────────────────────────────────────────────────────────────
   */
  const activities = useAppSelector(selectAllActivities);
  const status = useAppSelector(selectActivitiesStatus);
  const error = useAppSelector(selectActivitiesError);

  /**
   * ────────────────────────────────────────────────────────────────────────────────
   * Pull-to-refresh handler
   * ────────────────────────────────────────────────────────────────────────────────
   */
  const onRefresh = useCallback(() => {
    console.log('Pull-to-refresh triggered');
    setRefreshing(true);
    dispatch(fetchActivities()).finally(() => {
      console.log('Fetch completed, resetting refreshing');
      setRefreshing(false);
    });
  }, [dispatch]);

  /**
   * ────────────────────────────────────────────────────────────────────────────────
   * Side effects
   * ────────────────────────────────────────────────────────────────────────────────
   */
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchActivities());
    }
  }, [dispatch, status]);

  /**
   * ────────────────────────────────────────────────────────────────────────────────
   * UI helpers
   * ────────────────────────────────────────────────────────────────────────────────
   */
  const tabs = useMemo(
    () => [
      { label: 'شیڈول', value: 0 },
      { label: 'رپورٹ', value: 1 },
    ],
    []
  );

  const formatActivityData = (activity: any) => ({
    id: activity.id.toString(),
    title: activity.activity_details || activity.title || 'غير متعين',
    location: activity.location || activity.location_coordinates || 'غير متعين',
    status: activity.status || 'غير متعين',
    dateTime: activity.activity_date_and_time
      ? new Date(activity.activity_date_and_time).toLocaleString('ur-PK', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'غير متعين',
    attendance: activity.attendance != null ? activity.attendance.toString() : 'غير متعين',
    dateCreated: activity.date_created
      ? new Date(activity.date_created).toLocaleDateString('ur-PK')
      : 'غير متعين',
    dateUpdated: activity.date_updated
      ? new Date(activity.date_updated).toLocaleDateString('ur-PK')
      : 'غير متعين',
    rawDateTime: activity.activity_date_and_time,
  });

  const currentDate = new Date();
  const formattedActivities = useMemo(() => {
    const allFormatted = activities.map(formatActivityData);
    return allFormatted.filter((activity) =>
      selectedTab === 0
        ? activity.rawDateTime && new Date(activity.rawDateTime) >= currentDate
        : activity.rawDateTime && new Date(activity.rawDateTime) < currentDate
    );
  }, [activities, selectedTab]);

  // Dialog handlers
  const handleAdd = () => setShowDialog(true);
  const handleReportActivity = () => {
    setShowDialog(false);
    router.push({
      pathname: '/screens/ActivityScreen',
      params: { mode: 'report' },
    });
  };
  const handleScheduleActivity = () => {
    setShowDialog(false);
    router.push({
      pathname: '/screens/ActivityScreen',
      params: { mode: 'schedule' },
    });
  };

  if (status === 'loading' && !refreshing) {
    return (
      <ScreenLayout title="سرگرمیاں" onBack={() => router.back()}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (status === 'failed') {
    return (
      <ScreenLayout title="سرگرمیاں" onBack={() => router.back()}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'سرگرمیاں لوڈ کرنے میں ناکامی'}</Text>
        </View>
      </ScreenLayout>
    );
  }

  /**
   * ────────────────────────────────────────────────────────────────────────────────
   * Main render
   * ────────────────────────────────────────────────────────────────────────────────
   */
  return (
    <ScreenLayout title="سرگرمیاں" onBack={() => router.back()}>
      <View style={styles.container}>
        <TabGroup tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <FlatList
          data={formattedActivities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActivityCard
              key={item.id}
              title={item.title}
              location={item.location}
              status={item.status}
              dateTime={item.dateTime}
              attendance={item.attendance}
              dateCreated={item.dateCreated}
              dateUpdated={item.dateUpdated}
              handleLeft={() => {}}
              handleMiddle={() => {}}
              handleRight={() => {}}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={formattedActivities.length === 0 ? styles.center : styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedTab === 0 ? 'کوئی شیڈول شدہ سرگرمیاں نہیں ملیں' : 'کوئی رپورٹ شدہ سرگرمیاں نہیں ملیں'}
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
              title="تازہ کاری ہو رہی ہے..."
              titleColor={COLORS.primary}
            />
          }
          nestedScrollEnabled
        />
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Action Dialog */}
      <Dialog
        visible={showDialog}
        onConfirm={handleReportActivity}
        onCancel={handleScheduleActivity}
        onClose={() => setShowDialog(false)}
        title="کسی ایک آپشن کا انتخاب کریں."
        titleStyle={styles.titleStyle}
        confirmText="سرگرمی رپورٹ کریں"
        cancelText="سرگرمی شیڈول کریں"
        showWarningIcon={false}
        showSuccessIcon={false}
        lowerRightIcon
        upperRightIcon
        confirmButtonStyle={styles.confirmButtonStyle}
        cancelButtonStyle={styles.cancelButtonStyle}
        confirmTextStyle={styles.confirmTextStyle}
        cancelTextStyle={styles.cancelTextStyle}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  listContent: {
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  confirmButtonStyle: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
},
cancelButtonStyle: {
    width: '100%',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
},
confirmTextStyle: {
    color: COLORS.white,
},
cancelTextStyle: {
    color: COLORS.black,
},
titleStyle: {
    textAlign: 'left',
},
});