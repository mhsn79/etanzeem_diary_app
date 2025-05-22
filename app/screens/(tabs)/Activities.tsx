import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
  StatusBar,
  Platform,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActivityCard from '../../components/ActivityCard';
import { TabGroup } from '@/app/components/Tab';
import Dialog from '@/app/components/Dialog';
import Header from '../../components/Header';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import { useAppDispatch } from '@/src/hooks/useAppDispatch';
import { useAppSelector } from '@/src/hooks/useAppSelector';
import {
  fetchActivities,
  selectAllActivities,
  selectActivitiesStatus,
  selectActivitiesError,
} from '@/app/features/activities/activitySlice';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Reusable component to wrap content with consistent status bar and background
interface ScreenWrapperProps {
  children: React.ReactNode;
  headerTitle: string;
  onBack: () => void;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, headerTitle, onBack }) => {


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={true}
      />
      {/* Create a transparent view for the header area */}
      <View style={styles.headerArea}>
        <Header 
          title={headerTitle} 
          onBack={onBack}
        />
      </View>
      <View style={styles.contentWrapper}>{children}</View>
    </SafeAreaView>
  );
};

export default function Activities() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const activities = useAppSelector(selectAllActivities);
  const status = useAppSelector(selectActivitiesStatus);
  const error = useAppSelector(selectActivitiesError);

  const onRefresh = useCallback(() => {
    console.log('Pull-to-refresh triggered');
    setRefreshing(true);
    dispatch(fetchActivities()).finally(() => {
      console.log('Fetch completed, resetting refreshing');
      setRefreshing(false);
    });
  }, [dispatch]);

  useLayoutEffect(() => {    
      dispatch(fetchActivities());

  }, [dispatch]);

  const tabs = useMemo(
    () => [
      { label: 'شیڈول', value: 0 },
      { label: 'رپورٹ', value: 1 },
    ],
    []
  );

  const formatActivityData = (activity:any) => ({
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

  const handleAdd = useCallback(() => setShowDialog(true), []);
  const handleReportActivity = useCallback(() => {
    setShowDialog(false);
    router.push({
      pathname: '/screens/ActivityScreen',
      params: { mode: 'report' },
    });
  }, [router]);
  const handleScheduleActivity = useCallback(() => {
    setShowDialog(false);
    router.push({
      pathname: '/screens/ActivityScreen',
      params: { mode: 'schedule' },
    });
  }, [router]);

  // Loading state
  if (status === 'loading' && !refreshing) {
    return (
      <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => router.back()}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // Error state
  if (status === 'failed') {
    return (
      <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => router.back()}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'سرگرمیاں لوڈ کرنے میں ناکامی'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Main content
  return (
    <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => router.back()}>
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

      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>

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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary, // Status
      },
  headerArea: {
    backgroundColor: COLORS.white,

  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.white, // White content area
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white, // Ensure container is white
    paddingTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    zIndex: 0,
  },
  listContent: {
    paddingBottom: hp('12%'),
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
    bottom: SPACING.xl + hp('10%'),
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    zIndex: 1000,
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