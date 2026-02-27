import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ErrorBoundary from '../../components/ErrorBoundary';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  TextInput,
  Pressable,
  RefreshControl,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
  InteractionManager,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActivityCard from '../../components/ActivityCard';
import { TabGroup } from '@/app/components/Tab';
import Header from '../../components/Header';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import UrduText from '../../components/UrduText';
import { useAppDispatch } from '@/src/hooks/useAppDispatch';
import { useAppSelector } from '@/src/hooks/useAppSelector';
import {
  fetchActivities,
  selectAllActivities,
  selectActivitiesStatus,
  selectActivitiesError,
  deleteActivity,
  editActivity,
} from '@/app/features/activities/activitySlice';
import { selectUser as selectCurrentUser } from '@/app/features/auth/authSlice';
import { selectUserUnitDetails, selectAllTanzeemiUnits, selectLevelsById, selectDashboardSelectedUnitId } from '@/app/features/tanzeem/tanzeemSlice';
import { formatUnitName } from '@/app/utils/formatUnitName';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Reusable component to wrap content with consistent status bar and background
interface ScreenWrapperProps {
  children: React.ReactNode;
  headerTitle: string;
  onBack: () => void;
  showBack?: boolean;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, headerTitle, onBack, showBack = true }) => (
  <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <StatusBar
      barStyle="light-content"
      backgroundColor={COLORS.primary}
      translucent={true}
    />
    <View style={styles.headerArea}>
      <Header
        title={headerTitle}
        onBack={onBack}
        showBack={showBack}
      />
    </View>
    <View style={styles.contentWrapper}>{children}</View>
  </SafeAreaView>
);

export default function Activities() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { preSelectedTab, preSelectedMonth, preSelectedYear } = useLocalSearchParams<{
    preSelectedTab?: string;
    preSelectedMonth?: string;
    preSelectedYear?: string;
  }>();
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Month selector state
  const now = useMemo(() => new Date(), []);
  const realMonth = now.getMonth() + 1;
  const realYear = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(realMonth);
  const [selectedYear, setSelectedYear] = useState(realYear);

  const activities = useAppSelector(selectAllActivities);
  const status = useAppSelector(selectActivitiesStatus);
  const error = useAppSelector(selectActivitiesError);
  const [showDeleteSuccessToast, setShowDeleteSuccessToast] = useState(false);
  const [showCompletionSuccessToast, setShowCompletionSuccessToast] = useState(false);

  // Refs for cleanup of toast timers
  const deleteToastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const completionToastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Current user for creator check (single selector for all cards)
  const currentUser = useAppSelector(selectCurrentUser);

  // Dialog state — inline overlays (no Modal)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [completionTarget, setCompletionTarget] = useState<{ id: string; rawDateTime: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [attendanceValue, setAttendanceValue] = useState('');

  // Reset attendance when completion target changes
  useEffect(() => {
    if (completionTarget) setAttendanceValue('');
  }, [completionTarget]);

  // Tanzeem selectors for location conversion and filtering
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const selectedUnitId = useAppSelector(selectDashboardSelectedUnitId);
  const displayUnitId = selectedUnitId || userUnitDetails?.id;
  const allTanzeemiUnits = useAppSelector(selectAllTanzeemiUnits);
  const levelsById = useAppSelector(selectLevelsById);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchActivities()).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch]);

  // Refetch on focus. Abort on blur to avoid state updates during transitions.
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      const task = InteractionManager.runAfterInteractions(() => {
        dispatch(fetchActivities({ signal: controller.signal }));
      });
      return () => {
        controller.abort();
        task.cancel();
        clearTimeout(deleteToastTimerRef.current);
        clearTimeout(completionToastTimerRef.current);
      };
    }, [dispatch])
  );

  // Handle navigation params (from auto-question navigation)
  useEffect(() => {
    if (preSelectedTab) {
      const tab = parseInt(preSelectedTab, 10);
      if (!isNaN(tab) && (tab === 0 || tab === 1)) {
        setSelectedTab(tab);
      }
    }
    if (preSelectedMonth && preSelectedYear) {
      const m = parseInt(preSelectedMonth, 10);
      const y = parseInt(preSelectedYear, 10);
      if (!isNaN(m) && !isNaN(y)) {
        setSelectedMonth(m);
        setSelectedYear(y);
      }
    }
  }, [preSelectedTab, preSelectedMonth, preSelectedYear]);

  // Month navigation — rules differ by tab
  const viewingPeriod = selectedYear * 12 + selectedMonth;
  const currentPeriod = realYear * 12 + realMonth;
  const prevPeriod = currentPeriod - 1;

  const canGoNext = useMemo(() => {
    if (selectedTab === 0) return true;
    return viewingPeriod < currentPeriod;
  }, [selectedTab, viewingPeriod, currentPeriod]);

  const canGoPrev = useMemo(() => {
    if (selectedTab === 1) return true;
    return viewingPeriod > prevPeriod;
  }, [selectedTab, viewingPeriod, prevPeriod]);

  const isEditable = useMemo(() => {
    if (selectedTab === 0) return viewingPeriod >= currentPeriod;
    return viewingPeriod >= prevPeriod && viewingPeriod <= currentPeriod;
  }, [selectedTab, viewingPeriod, currentPeriod, prevPeriod]);

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (!canGoNext) return;
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    } else {
      if (!canGoPrev) return;
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    }
  }, [selectedMonth, selectedYear, canGoNext, canGoPrev]);

  const tabs = useMemo(
    () => [
      { label: 'شیڈول', value: 0 },
      { label: 'رپورٹ', value: 1 },
    ],
    []
  );

  // Helper: convert location ID to unit name
  const getLocationName = useCallback((locationId: string | number) => {
    if (!locationId || locationId === 'custom' || locationId === 'غير متعين') {
      return 'غير متعين';
    }
    const id = String(locationId);

    if (userUnitDetails && String(userUnitDetails.id) === id) {
      const levelId = userUnitDetails.level_id || userUnitDetails.Level_id;
      const levelName = levelId && levelsById[levelId] ? levelsById[levelId].Name || '' : '';
      const unitName = formatUnitName(userUnitDetails);
      return levelName ? `${levelName}: ${unitName}` : unitName;
    }

    const unit = allTanzeemiUnits.find(u => String(u.id) === id);
    if (unit) {
      const levelId = unit.level_id || unit.Level_id;
      const levelName = levelId && levelsById[levelId] ? levelsById[levelId].Name || '' : '';
      const unitName = formatUnitName(unit);
      return levelName ? `${levelName}: ${unitName}` : unitName;
    }

    return String(locationId);
  }, [userUnitDetails, allTanzeemiUnits, levelsById]);

  const currentDate = useMemo(() => new Date(), []);
  const threeDaysFromNow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  }, []);

  // Allowed unit IDs — only the selected unit (not its children)
  const allowedUnitIds = useMemo(() => {
    const ids = new Set<number>();
    if (displayUnitId) ids.add(displayUnitId);
    return ids;
  }, [displayUnitId]);

  // Filter activities by unit
  const filteredByUnit = useMemo(() => {
    return activities.filter(activity => {
      const activityTanzeemiUnit = activity.tanzeemi_unit;
      if (!activityTanzeemiUnit) return false;
      const unitId = parseInt(String(activityTanzeemiUnit));
      return allowedUnitIds.has(unitId);
    });
  }, [activities, allowedUnitIds]);

  // Formatted + sorted activity list
  const formattedActivities = useMemo(() => {
    const monthFiltered = filteredByUnit.filter((raw) => {
      if (raw.report_month !== selectedMonth || raw.report_year !== selectedYear) return false;
      if (selectedTab === 0 && raw.status === 'published') return false;
      return true;
    });

    const formatted = monthFiltered.map((activity) => {
      const activityDate = activity.activity_date_and_time ? new Date(activity.activity_date_and_time) : null;
      const isPast = Boolean(activityDate && activityDate < currentDate);
      const isDraft = activity.status === 'draft';
      return {
        id: activity.id.toString(),
        title: activity.activity_details || 'غير متعين',
        location: getLocationName(activity.location ?? '') || getLocationName(activity.location_coordinates ?? '') || 'غير متعين',
        dateTime: activityDate
          ? activityDate.toLocaleString('ur-PK', { dateStyle: 'medium', timeStyle: 'short' })
          : 'غير متعين',
        rawDateTime: activity.activity_date_and_time,
        user_created: activity.user_created,
        shouldBeGreyedOut: Boolean(isPast && isDraft),
        isPast,
        isDraft,
      };
    });

    const sorted = formatted.sort((a, b) => {
      if (!a.rawDateTime && !b.rawDateTime) return 0;
      if (!a.rawDateTime) return 1;
      if (!b.rawDateTime) return -1;
      const dateA = new Date(a.rawDateTime).getTime();
      const dateB = new Date(b.rawDateTime).getTime();
      return selectedTab === 0 ? dateA - dateB : dateB - dateA;
    });

    // Schedule tab on current month: group into "next 3 days" / "upcoming"
    if (selectedTab === 0 && selectedMonth === realMonth && selectedYear === realYear) {
      const result: { type: 'separator' | 'activity'; data: any }[] = [];
      const next3: any[] = [];
      const rest: any[] = [];

      sorted.forEach(a => {
        if (a.rawDateTime) {
          const d = new Date(a.rawDateTime);
          if (d >= currentDate && d <= threeDaysFromNow) { next3.push(a); return; }
        }
        rest.push(a);
      });

      if (next3.length > 0) {
        result.push({ type: 'separator', data: { title: 'اگلے تین دن میں', id: 'next-three-days' } });
        next3.forEach(a => result.push({ type: 'activity', data: a }));
      }
      if (rest.length > 0) {
        result.push({ type: 'separator', data: { title: 'آنے والی سرگرمیاں', id: 'future-activities' } });
        rest.forEach(a => result.push({ type: 'activity', data: a }));
      }
      return result;
    }

    return sorted.map(a => ({ type: 'activity' as const, data: a }));
  }, [filteredByUnit, selectedTab, selectedMonth, selectedYear, realMonth, realYear, currentDate, threeDaysFromNow, getLocationName]);

  // Ref for looking up activity data in handlers
  const activityDataRef = useRef(formattedActivities);
  useEffect(() => { activityDataRef.current = formattedActivities; }, [formattedActivities]);

  // --- Action handlers ---

  const handleAdd = useCallback(() => {
    const mode = selectedTab === 0 ? 'schedule' : 'report';
    router.push({
      pathname: '/screens/ActivityScreen',
      params: { mode, reportMonth: String(selectedMonth), reportYear: String(selectedYear) },
    });
  }, [router, selectedTab, selectedMonth, selectedYear]);

  const handleDeleteSuccess = useCallback(() => {
    setShowDeleteSuccessToast(true);
    clearTimeout(deleteToastTimerRef.current);
    deleteToastTimerRef.current = setTimeout(() => setShowDeleteSuccessToast(false), 3000);
    dispatch(fetchActivities());
  }, [dispatch]);

  const handleCompletionSuccess = useCallback(() => {
    setShowCompletionSuccessToast(true);
    clearTimeout(completionToastTimerRef.current);
    completionToastTimerRef.current = setTimeout(() => setShowCompletionSuccessToast(false), 3000);
    dispatch(fetchActivities());
  }, [dispatch]);

  const showMarkAsReported = selectedTab === 1;
  const reportMonthStr = String(selectedMonth);
  const reportYearStr = String(selectedYear);

  const handleCardPress = useCallback((id: string) => {
    // Only callable for drafts on report tab → open completion dialog
    const item = activityDataRef.current.find(d => d.type === 'activity' && d.data.id === id);
    if (!item) return;
    setCompletionTarget({ id, rawDateTime: item.data.rawDateTime });
  }, []);

  const handleEditPress = useCallback((id: string) => {
    router.push({ pathname: '/screens/ActivityScreen', params: { activityId: id, mode: 'edit' } });
  }, [router]);

  const handleDeletePress = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteActivity(parseInt(deleteTargetId))).unwrap();
      setDeleteTargetId(null);
      handleDeleteSuccess();
    } catch (e: any) {
      Alert.alert('خرابی', e || 'سرگرمی حذف نہیں ہو سکی');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTargetId, dispatch, handleDeleteSuccess]);

  const handleCompletionSubmit = useCallback(async () => {
    if (!completionTarget) return;
    if (!attendanceValue.trim()) {
      Alert.alert('غلطی', 'براہ کرم حاضری کی تعداد درج کریں');
      return;
    }
    setIsCompleting(true);
    try {
      await dispatch(editActivity({
        id: parseInt(completionTarget.id),
        activityData: {
          attendance: parseInt(attendanceValue),
          report_month: parseInt(reportMonthStr),
          report_year: parseInt(reportYearStr),
          status: 'published',
        },
      })).unwrap();
      setCompletionTarget(null);
      handleCompletionSuccess();
    } catch (e: any) {
      Alert.alert('خرابی', e || 'سرگرمی محفوظ نہیں ہو سکی');
    } finally {
      setIsCompleting(false);
    }
  }, [completionTarget, attendanceValue, reportMonthStr, reportYearStr, dispatch, handleCompletionSuccess]);

  // Loading state
  if (status === 'loading' && !refreshing) {
    return (
      <ErrorBoundary>
        <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => {}} showBack={false}>
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
        <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => {}} showBack={false}>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error || 'سرگرمیاں لوڈ کرنے میں ناکامی'}</Text>
          </View>
        </ScreenWrapper>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ScreenWrapper headerTitle="سرگرمیاں" onBack={() => {}} showBack={false}>
      <View style={styles.container} collapsable={false}>
        <TabGroup tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
        <View style={styles.monthSelector}>
          <Pressable
            onPress={() => handleMonthChange('prev')}
            style={[styles.monthArrow, !canGoPrev && styles.monthArrowDisabled]}
            disabled={!canGoPrev}
          >
            <Text style={[styles.monthArrowText, !canGoPrev && { color: COLORS.textSecondary }]}>{'>'}</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <UrduText style={styles.monthText}>
              {getUrduMonth(selectedMonth)} {selectedYear}
            </UrduText>
            {!isEditable && (
              <UrduText style={styles.readOnlyBadge}>صرف مشاہدہ</UrduText>
            )}
          </View>
          <Pressable
            onPress={() => handleMonthChange('next')}
            style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
            disabled={!canGoNext}
          >
            <Text style={[styles.monthArrowText, !canGoNext && { color: COLORS.textSecondary }]}>{'<'}</Text>
          </Pressable>
        </View>

        {/* ScrollView + map — no FlatList recycling, no stale viewState tags */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={formattedActivities.length === 0 ? styles.center : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {formattedActivities.length === 0 ? (
            <Text style={styles.emptyText}>
              {selectedTab === 0 ? 'کوئی شیڈول شدہ سرگرمیاں نہیں ملیں' : 'کوئی رپورٹ شدہ سرگرمیاں نہیں ملیں'}
            </Text>
          ) : (
            formattedActivities.map((item) => {
              if (item.type === 'separator') {
                return (
                  <View key={`sep-${item.data.id}`} style={styles.separatorContainer}>
                    <Text style={styles.separatorText}>{item.data.title}</Text>
                  </View>
                );
              }

              const isCreator = currentUser?.id === item.data.user_created;
              // Only report-tab drafts are interactive (opens completion dialog)
              const isInteractive = showMarkAsReported && item.data.isDraft;
              const showReportHint = isInteractive;

              return (
                <ActivityCard
                  key={`act-${item.data.id}`}
                  id={item.data.id}
                  title={item.data.title}
                  location={item.data.location}
                  dateTime={item.data.dateTime}
                  isCreator={isCreator}
                  shouldBeGreyedOut={item.data.shouldBeGreyedOut}
                  isInteractive={isInteractive}
                  showReportHint={showReportHint}
                  onPress={handleCardPress}
                  onEdit={handleEditPress}
                  onDelete={handleDeletePress}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      {isEditable && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Delete confirmation — inline overlay, NO Modal */}
      {deleteTargetId !== null && (
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Pressable style={styles.overlayBackdrop} onPress={() => !isDeleting && setDeleteTargetId(null)} />
          <View style={styles.overlayCenter}>
            <View style={styles.dialogBox}>
              <View style={styles.dialogIconWrap}>
                <MaterialIcons name="warning" size={30} color={COLORS.white} />
              </View>
              <UrduText style={styles.dialogTitle}>سرگرمی آرکائیو</UrduText>
              <UrduText style={styles.dialogDesc}>کیا آپ واقعی اس سرگرمی کو آرکائیو کرنا چاہتے ہیں؟</UrduText>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, isDeleting && styles.dialogBtnDisabled]}
                onPress={confirmDelete}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <UrduText style={styles.dialogConfirmText}>آرکائیو کریں</UrduText>
                )}
              </TouchableOpacity>
              {!isDeleting && (
                <TouchableOpacity onPress={() => setDeleteTargetId(null)} activeOpacity={0.7}>
                  <UrduText style={styles.dialogCancelText}>منسوخ کریں</UrduText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Activity completion — inline overlay, NO Modal */}
      {completionTarget !== null && (
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Pressable style={styles.overlayBackdrop} onPress={() => !isCompleting && setCompletionTarget(null)} />
          <View style={styles.overlayCenter}>
            <View style={styles.dialogBox}>
              <UrduText style={styles.dialogTitle}>سرگرمی کی رپورٹ</UrduText>
              <UrduText style={styles.dialogDesc}>براہ کرم حاضری درج کریں</UrduText>
              {/* Period info bar */}
              <View style={styles.periodInfoBar}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <UrduText style={styles.periodInfoText}>
                  رپورٹنگ مدت: {getUrduMonth(parseInt(reportMonthStr))} {reportYearStr}
                </UrduText>
              </View>
              {/* Attendance input */}
              <UrduText style={styles.inputLabel}>حاضری کی تعداد</UrduText>
              <TextInput
                style={styles.textInput}
                value={attendanceValue}
                onChangeText={setAttendanceValue}
                placeholder="حاضری کی تعداد درج کریں"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, isCompleting && styles.dialogBtnDisabled]}
                onPress={handleCompletionSubmit}
                disabled={isCompleting}
                activeOpacity={0.7}
              >
                {isCompleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <UrduText style={styles.dialogConfirmText}>محفوظ کریں</UrduText>
                )}
              </TouchableOpacity>
              {!isCompleting && (
                <TouchableOpacity onPress={() => setCompletionTarget(null)} activeOpacity={0.7}>
                  <UrduText style={styles.dialogCancelText}>منسوخ کریں</UrduText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

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
    backgroundColor: COLORS.primary,
  },
  headerArea: {
    backgroundColor: COLORS.white,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    ...(Platform.OS !== 'android' ? { zIndex: 0 } : {}),
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
    fontFamily: 'JameelNooriNastaleeq',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontFamily: 'JameelNooriNastaleeq',
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
    ...(Platform.OS === 'ios' ? { ...SHADOWS.medium, zIndex: 1000 } : { borderWidth: 1, borderColor: COLORS.primary }),
  },
  toastContainer: {
    position: 'absolute',
    bottom: SPACING.xl + hp('20%'),
    left: 0,
    right: 0,
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? { zIndex: 1001 } : {}),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...(Platform.OS === 'ios' ? SHADOWS.medium : { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' }),
    maxWidth: '80%',
  },
  toastText: {
    marginLeft: SPACING.sm,
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'JameelNooriNastaleeq',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: BORDER_RADIUS.md,
  },
  monthArrow: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  monthArrowText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  monthText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
  },
  monthArrowDisabled: {
    opacity: 0.3,
  },
  readOnlyBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: 'JameelNooriNastaleeq',
    marginTop: 2,
  },
  separatorContainer: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.lightGray,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
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
  // --- Inline overlay styles (replaces Modal-based Dialog) ---
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  dialogBox: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? SHADOWS.medium : { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' }),
  },
  dialogIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dialogTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  dialogDesc: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  dialogConfirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    width: '80%',
    alignItems: 'center',
  },
  dialogBtnDisabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.7,
  },
  dialogConfirmText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
  },
  dialogCancelText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    paddingVertical: SPACING.sm,
  },
  periodInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
    width: '100%',
  },
  periodInfoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontFamily: 'JameelNooriNastaleeq',
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.black,
    alignSelf: 'flex-end',
    marginBottom: SPACING.xs,
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.black,
    textAlign: 'right',
    marginBottom: SPACING.lg,
    fontFamily: 'JameelNooriNastaleeq',
  },
});
