import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ErrorBoundary from '../../components/ErrorBoundary';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
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
import BaitulmalCard from '../../components/BaitulmalCard';
import { TabGroup } from '@/app/components/Tab';
import Header from '../../components/Header';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import UrduText from '../../components/UrduText';
import { useAppDispatch } from '@/src/hooks/useAppDispatch';
import { useAppSelector } from '@/src/hooks/useAppSelector';
import {
  fetchBaitulmalRecords,
  fetchBaitulmalTypes,
  selectAllBaitulmalRecords,
  selectBaitulmalStatus,
  selectBaitulmalError,
  selectBaitulmalTypes,
  deleteBaitulmalRecord,
} from '@/app/features/baitulmal/baitulmalSlice';
import { selectUser as selectCurrentUser } from '@/app/features/auth/authSlice';
import { selectDashboardSelectedUnitId, selectUserUnitDetails, selectAllTanzeemiUnits } from '@/app/features/tanzeem/tanzeemSlice';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface ScreenWrapperProps {
  children: React.ReactNode;
  headerTitle: string;
  onBack: () => void;
  showBack?: boolean;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, headerTitle, onBack, showBack = true }) => (
  <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={true} />
    <View style={styles.headerArea}>
      <Header title={headerTitle} onBack={onBack} showBack={showBack} />
    </View>
    <View style={styles.contentWrapper}>{children}</View>
  </SafeAreaView>
);

/** Format number with commas */
const formatAmount = (amount: number): string => amount.toLocaleString('en-US');

export default function Baitulmal() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { preSelectedTab, preSelectedMonth, preSelectedYear } = useLocalSearchParams<{
    preSelectedTab?: string;
    preSelectedMonth?: string;
    preSelectedYear?: string;
  }>();

  const [selectedTab, setSelectedTab] = useState(0); // 0=income, 1=expense
  const [refreshing, setRefreshing] = useState(false);

  // Month/year state
  const now = useMemo(() => new Date(), []);
  const realMonth = now.getMonth() + 1;
  const realYear = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(realMonth);
  const [selectedYear, setSelectedYear] = useState(realYear);

  const allRecords = useAppSelector(selectAllBaitulmalRecords);
  const baitulmalTypes = useAppSelector(selectBaitulmalTypes);
  const status = useAppSelector(selectBaitulmalStatus);
  const error = useAppSelector(selectBaitulmalError);
  const currentUser = useAppSelector(selectCurrentUser);

  // Unit filtering: show records for selected unit + its children
  const selectedUnitId = useAppSelector(selectDashboardSelectedUnitId);
  const userUnitDetails = useAppSelector(selectUserUnitDetails);
  const displayUnitId = selectedUnitId || userUnitDetails?.id;
  const allTanzeemiUnits = useAppSelector(selectAllTanzeemiUnits);

  const allowedUnitIds = useMemo(() => {
    const ids = new Set<number>();
    if (displayUnitId) ids.add(displayUnitId);
    allTanzeemiUnits
      .filter(u => u.Parent_id === displayUnitId)
      .forEach(u => ids.add(u.id));
    return ids;
  }, [displayUnitId, allTanzeemiUnits]);

  // Toast state
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const deleteToastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Delete dialog state (inline overlay)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Type lookup map
  const typesById = useMemo(() => {
    const map: Record<number, { Name: string; main_category: string }> = {};
    baitulmalTypes.forEach(t => { map[t.id] = t; });
    return map;
  }, [baitulmalTypes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchBaitulmalRecords()).finally(() => setRefreshing(false));
  }, [dispatch]);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchBaitulmalRecords());
    if (baitulmalTypes.length === 0) {
      dispatch(fetchBaitulmalTypes());
    }
  }, [dispatch]);

  // Refetch on focus, abort on blur
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      const task = InteractionManager.runAfterInteractions(() => {
        dispatch(fetchBaitulmalRecords({ signal: controller.signal }));
      });
      return () => {
        controller.abort();
        task.cancel();
        clearTimeout(deleteToastTimerRef.current);
      };
    }, [dispatch])
  );

  // Handle navigation params
  useEffect(() => {
    if (preSelectedTab) {
      const tab = parseInt(preSelectedTab, 10);
      if (!isNaN(tab) && (tab === 0 || tab === 1)) setSelectedTab(tab);
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

  // Month navigation
  const viewingPeriod = selectedYear * 12 + selectedMonth;
  const currentPeriod = realYear * 12 + realMonth;

  const canGoNext = viewingPeriod < currentPeriod;
  const canGoPrev = true; // can always go back

  const isEditable = useMemo(() => {
    // Editable for current and previous month
    const prevPeriod = currentPeriod - 1;
    return viewingPeriod >= prevPeriod && viewingPeriod <= currentPeriod;
  }, [viewingPeriod, currentPeriod]);

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (!canGoNext) return;
      if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
      else setSelectedMonth(m => m + 1);
    } else {
      if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
      else setSelectedMonth(m => m - 1);
    }
  }, [selectedMonth, canGoNext]);

  const tabs = useMemo(() => [
    { label: 'آمدن', value: 0 },
    { label: 'اخراجات', value: 1 },
  ], []);

  // Filter records by unit, month/year and category
  const filteredRecords = useMemo(() => {
    const categoryFilter = selectedTab === 0 ? 'income' : 'expense';
    return allRecords.filter(r => {
      // Filter by allowed units
      if (allowedUnitIds.size > 0 && !allowedUnitIds.has(r.Tanzeemi_Unit)) return false;
      if (r.report_month !== selectedMonth || r.report_year !== selectedYear) return false;
      if (r.status === 'archived') return false;
      const typeInfo = typesById[r.Type];
      if (!typeInfo) return false;
      return typeInfo.main_category === categoryFilter;
    });
  }, [allRecords, selectedMonth, selectedYear, selectedTab, typesById, allowedUnitIds]);

  // Calculate total for active tab
  const totalAmount = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [filteredRecords]);

  // Handlers
  const handleAdd = useCallback(() => {
    const mode = selectedTab === 0 ? 'income' : 'expense';
    router.push({
      pathname: '/screens/BaitulmalScreen',
      params: { mode, reportMonth: String(selectedMonth), reportYear: String(selectedYear) },
    });
  }, [router, selectedTab, selectedMonth, selectedYear]);

  const handleEdit = useCallback((id: string) => {
    router.push({
      pathname: '/screens/BaitulmalScreen',
      params: { mode: 'edit', recordId: id },
    });
  }, [router]);

  const handleDeletePress = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteBaitulmalRecord(parseInt(deleteTargetId))).unwrap();
      setDeleteTargetId(null);
      setShowDeleteToast(true);
      clearTimeout(deleteToastTimerRef.current);
      deleteToastTimerRef.current = setTimeout(() => setShowDeleteToast(false), 3000);
    } catch (e: any) {
      Alert.alert('خرابی', e || 'ریکارڈ حذف نہیں ہو سکا');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTargetId, dispatch]);

  const handleBack = useCallback(() => {
    InteractionManager.runAfterInteractions(() => router.back());
  }, [router]);

  // Loading state
  if (status === 'loading' && !refreshing && allRecords.length === 0) {
    return (
      <ErrorBoundary>
        <ScreenWrapper headerTitle="بیت المال" onBack={handleBack}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </ScreenWrapper>
      </ErrorBoundary>
    );
  }

  // Error state
  if (status === 'failed' && allRecords.length === 0) {
    return (
      <ErrorBoundary>
        <ScreenWrapper headerTitle="بیت المال" onBack={handleBack}>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error || 'ریکارڈ لوڈ کرنے میں ناکامی'}</Text>
          </View>
        </ScreenWrapper>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ScreenWrapper headerTitle="بیت المال" onBack={handleBack}>
        <View style={styles.container} collapsable={false}>
          <TabGroup tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />

          {/* Month selector */}
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

          {/* Total summary bar */}
          {filteredRecords.length > 0 && (
            <View style={styles.summaryBar}>
              <UrduText style={styles.summaryText}>
                {selectedTab === 0 ? 'کل آمدن' : 'کل اخراجات'}:{' '}
                {formatAmount(totalAmount)} روپے
              </UrduText>
            </View>
          )}

          {/* Records list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={filteredRecords.length === 0 ? styles.center : styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
            }
          >
            {filteredRecords.length === 0 ? (
              <Text style={styles.emptyText}>
                {selectedTab === 0 ? 'اس مہینے آمدن کا کوئی اندراج نہیں ملا' : 'اس مہینے اخراجات کا کوئی اندراج نہیں ملا'}
              </Text>
            ) : (
              filteredRecords.map((record) => {
                const isCreator = currentUser?.id === record.user_created;
                const typeInfo = typesById[record.Type];
                return (
                  <BaitulmalCard
                    key={`bm-${record.id}`}
                    id={record.id.toString()}
                    typeName={typeInfo?.Name || 'نامعلوم'}
                    amount={record.amount}
                    notes={record.notes}
                    isCreator={isCreator}
                    onEdit={handleEdit}
                    onDelete={handleDeletePress}
                  />
                );
              })
            )}
          </ScrollView>
        </View>

        {/* FAB */}
        {isEditable && (
          <TouchableOpacity style={styles.fab} onPress={handleAdd}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Delete confirmation overlay */}
        {deleteTargetId !== null && (
          <View style={StyleSheet.absoluteFill} collapsable={false}>
            <Pressable style={styles.overlayBackdrop} onPress={() => !isDeleting && setDeleteTargetId(null)} />
            <View style={styles.overlayCenter}>
              <View style={styles.dialogBox}>
                <View style={styles.dialogIconWrap}>
                  <MaterialIcons name="warning" size={22} color={COLORS.white} />
                </View>
                <UrduText style={styles.dialogTitle}>ریکارڈ حذف</UrduText>
                <UrduText style={styles.dialogDesc}>کیا آپ واقعی اس ریکارڈ کو حذف کرنا چاہتے ہیں؟</UrduText>
                <TouchableOpacity
                  style={[styles.dialogConfirmBtn, isDeleting && styles.dialogBtnDisabled]}
                  onPress={confirmDelete}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <UrduText style={styles.dialogConfirmText}>حذف کریں</UrduText>
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

        {/* Success Toast */}
        {showDeleteToast && (
          <View style={styles.toastContainer}>
            <View style={styles.toast}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.toastText}>ریکارڈ حذف کر دیا گیا ہے</Text>
            </View>
          </View>
        )}
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  headerArea: { backgroundColor: COLORS.white },
  contentWrapper: { flex: 1, backgroundColor: COLORS.white },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    ...(Platform.OS !== 'android' ? { zIndex: 0 } : {}),
  },
  listContent: { paddingBottom: hp('12%') },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: {
    color: COLORS.error, fontSize: 16, textAlign: 'center',
    padding: SPACING.lg, fontFamily: 'JameelNooriNastaleeq',
  },
  emptyText: {
    fontSize: 16, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: SPACING.xl, fontFamily: 'JameelNooriNastaleeq',
  },
  fab: {
    position: 'absolute', bottom: SPACING.xl + hp('10%'), right: SPACING.xl,
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'ios' ? { ...SHADOWS.medium, zIndex: 1000 } : { borderWidth: 1, borderColor: COLORS.primary }),
  },
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md, marginTop: SPACING.xs,
    backgroundColor: COLORS.lightPrimary, borderRadius: BORDER_RADIUS.md,
  },
  monthArrow: { padding: SPACING.xs, paddingHorizontal: SPACING.sm },
  monthArrowText: { fontSize: TYPOGRAPHY.fontSize.xl, color: COLORS.primary, fontWeight: 'bold' },
  monthText: { textAlign: 'center', fontSize: TYPOGRAPHY.fontSize.lg, fontFamily: 'JameelNooriNastaleeq', color: COLORS.primary },
  monthArrowDisabled: { opacity: 0.3 },
  readOnlyBadge: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontFamily: 'JameelNooriNastaleeq', marginTop: 2 },
  summaryBar: {
    backgroundColor: COLORS.lightPrimary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, marginTop: SPACING.xs,
    alignItems: 'center',
  },
  summaryText: { fontSize: TYPOGRAPHY.fontSize.md, color: COLORS.primary, fontFamily: 'JameelNooriNastaleeq', fontWeight: '600' },
  toastContainer: {
    position: 'absolute', bottom: SPACING.xl + hp('20%'), left: 0, right: 0, alignItems: 'center',
    ...(Platform.OS === 'ios' ? { zIndex: 1001 } : {}),
  },
  toast: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    ...(Platform.OS === 'ios' ? SHADOWS.medium : { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' }),
    maxWidth: '80%',
  },
  toastText: { marginLeft: SPACING.sm, color: COLORS.success, fontSize: 14, fontWeight: '500', fontFamily: 'JameelNooriNastaleeq' },
  overlayBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', pointerEvents: 'box-none' },
  dialogBox: {
    width: '75%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center',
    ...(Platform.OS === 'ios' ? SHADOWS.medium : { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' }),
  },
  dialogIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.warning,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  dialogTitle: { fontSize: TYPOGRAPHY.fontSize.xl, fontFamily: 'JameelNooriNastaleeq', color: COLORS.primary, textAlign: 'center', marginBottom: SPACING.xs },
  dialogDesc: { fontSize: TYPOGRAPHY.fontSize.sm, fontFamily: 'JameelNooriNastaleeq', color: COLORS.black, textAlign: 'center', marginBottom: SPACING.md },
  dialogConfirmBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.xs, width: '70%', alignItems: 'center',
  },
  dialogBtnDisabled: { backgroundColor: COLORS.disabled, opacity: 0.7 },
  dialogConfirmText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.md, fontFamily: 'JameelNooriNastaleeq' },
  dialogCancelText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.sm, fontFamily: 'JameelNooriNastaleeq', paddingVertical: SPACING.xs },
});
