import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ActivityCard from '../../components/ActivityCard';
import ScreenLayout from '../../components/ScreenLayout';
import { TabGroup } from '@/app/components/Tab';
import { COLORS, SHADOWS, SPACING } from '@/app/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/app/store';
import { fetchActivities, selectActivities, selectActivitiesStatus, selectActivitiesError } from '@/app/features/activities/activitySlice';

export default function Activities() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [selectedTab, setSelectedTab] = useState(0);

  // Get activities data from Redux store
  const activities = useSelector(selectActivities);
  const status = useSelector(selectActivitiesStatus);
  const error = useSelector(selectActivitiesError);

  // Fetch activities when component mounts
  useEffect(() => {
    dispatch(fetchActivities());
  }, [dispatch]);

  const tabs = [
    { label: 'شیڈول', value: 0 },
    { label: 'سرگرمی', value: 1 },
  ];

  const handleCreateActivity = () => {
    router.push('/screens/ScheduleActivitiesScreen');
  };

  // Format activity data for display
  const formatActivityData = (activity: any) => ({
    id: activity.id.toString(),
    title: activity.activity_details || 'N/A',
    location: activity.location_coordinates || 'N/A',
    status: activity.status || 'N/A',
    daysRemaining: activity.activity_date_and_time 
      ? new Date(activity.activity_date_and_time).toLocaleDateString()
      : 'N/A',
  });

  if (status === 'loading') {
    return (
      <ScreenLayout title="سرگرمیاں" onBack={() => router.back()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (status === 'failed') {
    return (
      <ScreenLayout title="سرگرمیاں" onBack={() => router.back()}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load activities'}</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="سرگرمیاں" onBack={() => router.back()}>
      <ScrollView style={styles.container}>
        <TabGroup
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
        <View style={styles.content}>
          <FlatList
            data={activities.map(formatActivityData)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ActivityCard
                key={item.id}
                title={item.title}
                location={item.location}
                status={item.status}
                daysRemaining={item.daysRemaining}
                handleLeft={() => {}}
                handleMiddle={() => {}}
                handleRight={() => {}}
              />
            )}
          />
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.overlayButton} onPress={handleCreateActivity}>
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
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
  content: {
    paddingBottom: 20,
  },
  overlayButton: {
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
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: 16,
  },
});
