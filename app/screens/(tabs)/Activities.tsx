import React, { useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ErrorBoundary from '../../components/ErrorBoundary';
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
  selectDeleteActivityStatus,
  selectDeleteActivityError,
} from '@/app/features/activities/activitySlice';
import { selectUserUnitDetails, selectAllTanzeemiUnits, selectLevelsById, selectChildUnits } from '@/app/features/tanzeem/tanzeemSlice';
import { formatUnitName } from '@/app/utils/formatUnitName';
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
  const deleteStatus = useAppSelector(selectDeleteActivityStatus);
  const deleteError = useAppSelector(selectDeleteActivityError);
  const [showDeleteSuccessToast, setShowDeleteSuccessToast] = useState(false);
  const [showCompletionSuccessToast, setShowCompletionSuccessToast] = useState(false);
  
  // Tanzeem selectors for location conversion and filtering
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const allTanzeemiUnits = useAppSelector(selectAllTanzeemiUnits);
  const levelsById = useAppSelector(selectLevelsById);
  
  // Memoize child units to prevent infinite re-renders
  const childUnits = useMemo(() => {
    if (!userUnitDetails?.id) return [];
    return allTanzeemiUnits.filter(unit => {
      const parentId = unit.parent_id || unit.Parent_id;
      return parentId === userUnitDetails.id;
    });
  }, [userUnitDetails?.id, allTanzeemiUnits]);

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

  // Refetch activities when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[Activities] Screen focused, fetching activities');
      dispatch(fetchActivities());
    }, [dispatch])
  );

  const tabs = useMemo(
    () => [
      { label: 'شیڈول', value: 0 },
      { label: 'رپورٹ', value: 1 },
    ],
    []
  );

  // Helper function to convert location ID to unit name
  const getLocationName = (locationId: string | number) => {
    if (!locationId || locationId === 'custom' || locationId === 'غير متعين') {
      return 'غير متعين';
    }
    
    // Convert to string for comparison
    const id = String(locationId);
    
    // First check if it's the user's current unit
    if (userUnitDetails && String(userUnitDetails.id) === id) {
      const levelId = userUnitDetails.level_id || userUnitDetails.Level_id;
      const levelName = levelId && levelsById[levelId] ? levelsById[levelId].Name || '' : '';
      const unitName = formatUnitName(userUnitDetails);
      return levelName ? `${levelName}: ${unitName}` : unitName;
    }
    
    // Check in all tanzeemi units
    const unit = allTanzeemiUnits.find(u => String(u.id) === id);
    if (unit) {
      const levelId = unit.level_id || unit.Level_id;
      const levelName = levelId && levelsById[levelId] ? levelsById[levelId].Name || '' : '';
      const unitName = formatUnitName(unit);
      return levelName ? `${levelName}: ${unitName}` : unitName;
    }
    
    // If not found, return the original ID
    return String(locationId);
  };

  const formatActivityData = (activity:any) => {
    const activityDate = activity.activity_date_and_time ? new Date(activity.activity_date_and_time) : null;
    const isPast = Boolean(activityDate && activityDate < currentDate);
    const isDraft = activity.status === 'draft';
    const shouldBeGreyedOut = Boolean(isPast && isDraft);
    
    return {
      id: activity.id.toString(),
      title: activity.activity_details || 'غير متعين',
      details: activity.title || 'غير متعين',
      location: getLocationName(activity.location) || getLocationName(activity.location_coordinates) || 'غير متعين',
      status: activity.status || 'غير متعين',
      dateTime: activityDate
        ? activityDate.toLocaleString('ur-PK', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'غير متعين',
      attendance: activity.attendance != null ? activity.attendance.toString() : 'غير متعين',
      dateCreated: activity.date_created
        ? new Date(activity.date_created).toLocaleDateString('ur-PK', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : 'غير متعين',
      dateUpdated: activity.date_updated
        ? new Date(activity.date_updated).toLocaleDateString('ur-PK', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : 'غير متعين',
      rawDateTime: activity.activity_date_and_time,
      user_created: activity.user_created,
      shouldBeGreyedOut,
      isPast,
      isDraft,
    };
  };

  const currentDate = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(currentDate.getDate() + 3);
  
  // Memoize allowed unit IDs to prevent recalculation
  const allowedUnitIds = useMemo(() => {
    const ids = new Set<number>();
    
    // Add current user's unit
    if (userUnitDetails?.id) {
      ids.add(userUnitDetails.id);
    }
    
    // Add child units
    if (childUnits) {
      childUnits.forEach(unit => {
        ids.add(unit.id);
      });
    }
    
    return ids;
  }, [userUnitDetails?.id, childUnits]);

  // Memoize filtered activities by unit
  const filteredByUnit = useMemo(() => {
    return activities.filter(activity => {
      const activityTanzeemiUnit = activity.tanzeemi_unit;
      
      // Only include activities that have a tanzeemi_unit assigned
      if (!activityTanzeemiUnit) {
        return false; // Exclude activities without tanzeemi unit
      }
      
      const unitId = parseInt(String(activityTanzeemiUnit));
      return allowedUnitIds.has(unitId);
    });
  }, [activities, allowedUnitIds]);

  // Memoize formatted activities
  const formattedActivities = useMemo(() => {
    const allFormatted = filteredByUnit.map(formatActivityData);
    const filtered = allFormatted.filter((activity) =>
      selectedTab === 0
        ? activity.rawDateTime && new Date(activity.rawDateTime) >= currentDate
        : activity.rawDateTime && new Date(activity.rawDateTime) < currentDate
    );
    
    // Sort activities by datetime
    const sortedActivities = filtered.sort((a, b) => {
      if (!a.rawDateTime && !b.rawDateTime) return 0;
      if (!a.rawDateTime) return 1; // Activities without datetime go to the end
      if (!b.rawDateTime) return -1;
      
      const dateA = new Date(a.rawDateTime);
      const dateB = new Date(b.rawDateTime);
      
      // For scheduled tab (future activities): sort by ascending date (earliest first)
      // For reported tab (past activities): sort by descending date (most recent first)
      return selectedTab === 0 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    });

    // For scheduled tab (future activities), add separators
    if (selectedTab === 0) {
      const result: Array<{ type: 'separator' | 'activity', data: any }> = [];
      
      const nextThreeDaysActivities: any[] = [];
      const futureActivities: any[] = [];
      
      sortedActivities.forEach(activity => {
        if (activity.rawDateTime) {
          const activityDate = new Date(activity.rawDateTime);
          if (activityDate <= threeDaysFromNow) {
            nextThreeDaysActivities.push(activity);
          } else {
            futureActivities.push(activity);
          }
        } else {
          // Activities without datetime go to future
          futureActivities.push(activity);
        }
      });
      
      // Add next 3 days separator if there are activities
      if (nextThreeDaysActivities.length > 0) {
        result.push({
          type: 'separator',
          data: { title: 'اگلے تین دن میں', id: 'next-three-days' }
        });
        nextThreeDaysActivities.forEach(activity => {
          result.push({ type: 'activity', data: activity });
        });
      }
      
      // Add future activities separator if there are activities
      if (futureActivities.length > 0) {
        result.push({
          type: 'separator',
          data: { title: 'آنے والی سرگرمیاں', id: 'future-activities' }
        });
        futureActivities.forEach(activity => {
          result.push({ type: 'activity', data: activity });
        });
      }
      
      return result;
    }
    
    // For reported tab, return activities as is
    return sortedActivities.map(activity => ({ type: 'activity' as const, data: activity }));
  }, [filteredByUnit, selectedTab, currentDate, threeDaysFromNow]);

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
  
  const handleDeleteSuccess = useCallback(() => {
    setShowDeleteSuccessToast(true);
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowDeleteSuccessToast(false);
    }, 3000);
    // Refresh the activities list
    dispatch(fetchActivities());
  }, [dispatch]);

  const handleCompletionSuccess = useCallback(() => {
    setShowCompletionSuccessToast(true);
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowCompletionSuccessToast(false);
    }, 3000);
    // Refresh the activities list
    dispatch(fetchActivities());
  }, [dispatch]);

  // Loading state
  if (status === 'loading' && !refreshing) {
    return (
      <ErrorBoundary>
        <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => router.back()}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </ScreenWrapper>
      </ErrorBoundary>
    );
  }

  // Error state
  if (status === 'failed') {
    return (
      <ErrorBoundary>
        <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => router.back()}>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error || 'سرگرمیاں لوڈ کرنے میں ناکامی'}</Text>
          </View>
        </ScreenWrapper>
      </ErrorBoundary>
    );
  }

  // Main content
  return (
    <ErrorBoundary>
      <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => router.back()}>
      <View style={styles.container}>
        <TabGroup tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <FlatList
          data={formattedActivities}
          keyExtractor={(item) => item.type === 'separator' ? `separator-${item.data.id}` : `activity-${item.data.id}`}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
          renderItem={({ item }) => {
            if (item.type === 'separator') {
              return (
                <View style={styles.separatorContainer}>
                  <Text style={styles.separatorText}>{item.data.title}</Text>
                </View>
              );
            }
            
            return (
              <ActivityCard
                key={item.data.id}
                id={item.data.id}
                title={item.data.title}
                details={item.data.details}
                location={item.data.location}
                status={item.data.status}
                dateTime={item.data.dateTime}
                rawDateTime={item.data.rawDateTime}
                attendance={item.data.attendance}
                dateCreated={item.data.dateCreated}
                dateUpdated={item.data.dateUpdated}
                user_created={item.data.user_created}
                shouldBeGreyedOut={item.data.shouldBeGreyedOut}
                isPast={item.data.isPast}
                isDraft={item.data.isDraft}
                handleLeft={() => {}}
                handleMiddle={() => {}}
                handleRight={() => {}}
                onDeleteSuccess={handleDeleteSuccess}
                onCompletionSuccess={handleCompletionSuccess}
              />
            );
          }}
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
              title="دوبارہ لوڈ ہو رہا ہے..."
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
      
      {/* Success Toast for Archive */}
      {showDeleteSuccessToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.toastText}>سرگرمی آرکائیو کر دی گئی ہے</Text>
          </View>
        </View>
      )}
      
      {/* Success Toast for Completion */}
      {showCompletionSuccessToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.toastText}>سرگرمی محفوظ کر دی گئی ہے</Text>
          </View>
        </View>
      )}
    </ScreenWrapper>
    </ErrorBoundary>
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
  toastContainer: {
    position: 'absolute',
    bottom: SPACING.xl + hp('20%'),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1001,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
    maxWidth: '80%',
  },
  toastText: {
    marginLeft: SPACING.sm,
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '500',
  },
  separatorContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.lightGray,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'flex-start', // Align content to the right
    justifyContent: 'center',
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'center',
    fontFamily: 'JameelNooriNastaleeq',
  },
});