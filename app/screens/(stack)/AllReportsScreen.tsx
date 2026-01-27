import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TabGroup } from '../../components/Tab';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import ReportCard from './components/ReportCard';
import FilterModal from '../../components/FilterModal';
import UrduText from '@/app/components/UrduText';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReportsByUnitId,
  fetchReportSubmissions,
  selectManagementReportsList,
  selectReportSubmissions,
  selectReportsError,
  selectReportsLoading,
} from '@/app/features/reports/reportsSlice_new';
import { selectUserUnitDetails, selectAllTanzeemiUnits } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import { useTokenRefresh } from '@/app/utils/tokenRefresh';
import ScreenLayout from '@/app/components/ScreenLayout';
import { COMMON_IMAGES } from '@/app/constants/images';
import {
  initializeReportData,
  selectOverallProgress,
  selectQAState,
} from '@/app/features/qa/qaSlice';

const AllReportsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [searchText, setSearchText] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    timeRange: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    selectedUnitId: null as number | null,
  });

  // Track the latest submission ID to highlight it
  const [latestSubmissionId, setLatestSubmissionId] = useState<number | null>(null);

  // Animation value for highlighting new submissions
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // Ref to track which submissions we've already highlighted
  const highlightedSubmissionsRef = useRef<Set<number>>(new Set());

  // Ref to track if we need to reset the highlighted submissions
  const shouldResetHighlightedRef = useRef(false);

  // Ref to track if we've already initialized QA data in this session
  const qaInitializedRef = useRef<boolean>(false);

  // Ref to track the last template ID we initialized QA data for
  const lastTemplateIdRef = useRef<number | null>(null);

  // Ref to track the last management ID we initialized QA data for
  const lastMgmtIdRef = useRef<number | null>(null);

  // Use our token refresh hook
  const { refreshTokenIfNeeded, ensureFreshTokenBeforeOperation } = useTokenRefresh();

  const userUnitDetails = useSelector(selectUserUnitDetails);
  const tanzeemiUnits = useSelector(selectAllTanzeemiUnits) ?? [];
  const reportSubmissions = useSelector(selectReportSubmissions) ?? [];
  const reportDetails = useSelector(selectManagementReportsList) ?? [];
  const loading = useSelector(selectReportsLoading);
  const error = useSelector(selectReportsError);

  // QA module state
  const qaState = useSelector(selectQAState);
  const overallProgress = useSelector(selectOverallProgress);

  // Tabs configuration
  const tabs = [
    { label: 'سابقہ / جمع شدہ رپورٹس', value: 0 },
    { label: 'ڈیو/اوور ڈیو رپورٹ', value: 1 },
  ];

  const filteredReports = useMemo(() => {
    let reports = reportSubmissions.filter((submission) =>
      selectedTab === 0
        ? submission.status === 'published'
        : submission.status === 'draft' || submission.status === 'pending'
    );

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      reports = reports.filter((report) => {
        const management = reportDetails
          .flatMap((r) => r.managements)
          .find((m) => m.id === report.mgmt_id);
        const unit = tanzeemiUnits.find((u) => u.id === report.unit_id);

        const monthInUrdu = management ? getUrduMonth(management.month).toLowerCase() : '';
        const yearStr = management ? management.year.toString() : '';
        const unitName = unit?.Name?.toLowerCase() || '';

        return (
          monthInUrdu.includes(searchLower) ||
          yearStr.includes(searchLower) ||
          unitName.includes(searchLower)
        );
      });
    }

    if (filterCriteria.startDate && filterCriteria.endDate) {
      reports = reports.filter((report) => {
        const reportDate = new Date(report.date_created || report.date_updated || Date.now());
        return reportDate >= filterCriteria.startDate! && reportDate <= filterCriteria.endDate!;
      });
    }

    if (filterCriteria.selectedUnitId !== null) {
      reports = reports.filter((report) => report?.unitDetails?.id === filterCriteria.selectedUnitId);
    }

    return reports.sort((a, b) => {
      const dateA = new Date(a.date_created || a.date_updated || 0);
      const dateB = new Date(b.date_created || b.date_updated || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [reportSubmissions, reportDetails, tanzeemiUnits, searchText, filterCriteria, selectedTab]);

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.push(ROUTES.DASHBOARD);
  }, [router]);

  const handleFilterPress = useCallback(() => {
    setIsFilterModalVisible(true);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setIsFilterModalVisible(false);
  }, []);

  const handleApplyFilter = useCallback((selectedTime: string, startDate: Date, endDate: Date, selectedUnitId: number | null) => {
    setFilterCriteria({ timeRange: selectedTime, startDate, endDate, selectedUnitId });
    setIsFilterModalVisible(false);
  }, []);

  const handleResetFilter = useCallback(() => {
    setFilterCriteria({
      timeRange: '',
      startDate: null,
      endDate: null,
      selectedUnitId: null,
    });
    setIsFilterModalVisible(false);
  }, []);

  // Combined function to fetch all necessary data with token refresh
  const fetchAllData = useCallback(async (forceQARefresh = false) => {
    try {
      if (!userUnitDetails) {
        console.error('User unit details not available');
        return;
      }

      // First ensure we have a fresh token
      await ensureFreshTokenBeforeOperation();

      // Step 1: Fetch reports data
      console.log('Fetching reports data...');
      await dispatch(fetchReportsByUnitId(userUnitDetails.id));
      await dispatch(fetchReportSubmissions());
      console.log('Reports data fetched successfully');

      // Step 2: Check if we need to initialize QA data
      const latestReportMgmt = reportDetails?.[0] || null;

      if (!latestReportMgmt || !latestReportMgmt.template?.id || !latestReportMgmt.managements?.[0]) {
        console.log('No report management details available for QA initialization');
        return;
      }

      const templateId = latestReportMgmt.template.id;
      const latestManagement = latestReportMgmt.managements[0];

      // Only initialize QA data if:
      // 1. We're forcing a refresh, OR
      // 2. We haven't initialized it yet, OR
      // 3. The template or management ID has changed
      if (
        forceQARefresh ||
        !qaInitializedRef.current ||
        lastTemplateIdRef.current !== templateId ||
        lastMgmtIdRef.current !== latestManagement.id
      ) {
        console.log('Initializing QA data for template:', templateId);

        try {
          await dispatch(
            initializeReportData({
              template_id: templateId,
              unit_id: userUnitDetails.id,
              mgmt_id: latestManagement.id,
            })
          );

          // Update our refs to track that we've initialized QA data
          qaInitializedRef.current = true;
          lastTemplateIdRef.current = templateId;
          lastMgmtIdRef.current = latestManagement.id;

          console.log('QA data initialized successfully');
        } catch (qaError) {
          console.error('Error initializing QA data:', qaError);
        }
      } else {
        console.log('Skipping QA data initialization - already initialized for this template/management');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [userUnitDetails?.id, dispatch, ensureFreshTokenBeforeOperation]);

  // Ensure we have a fresh token when the component mounts
  useEffect(() => {
    refreshTokenIfNeeded();
  }, []);

  // Fetch all data on initial mount and clean up on unmount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (userUnitDetails?.id && isMounted) {
        // On initial mount, force QA refresh
        await fetchAllData(true);
      }
    };

    initializeData();

    // Clean up function to reset state when component unmounts
    return () => {
      isMounted = false;
      highlightedSubmissionsRef.current.clear();
      setLatestSubmissionId(null);
      qaInitializedRef.current = false;
      lastTemplateIdRef.current = null;
      lastMgmtIdRef.current = null;
    };
  }, [userUnitDetails?.id, fetchAllData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      console.log('AllReportsScreen is focused, refreshing data...');

      // When screen comes into focus, mark that we should reset highlighted submissions
      shouldResetHighlightedRef.current = true;

      // When coming back from creating/editing a report, force QA refresh
      const shouldForceQARefresh = true;

      const refreshData = async () => {
        try {
          await refreshTokenIfNeeded();
          if (userUnitDetails?.id && isMounted) {
            await fetchAllData(shouldForceQARefresh);
          }
        } catch (error) {
          console.error('Error refreshing token on focus:', error);
        }
      };

      refreshData();

      return () => {
        isMounted = false;
        console.log('AllReportsScreen lost focus');
      };
    }, [userUnitDetails?.id, fetchAllData, refreshTokenIfNeeded])
  );

  // Effect to highlight the latest submission when reportSubmissions changes
  useEffect(() => {
    if (reportSubmissions.length > 0) {
      if (shouldResetHighlightedRef.current) {
        highlightedSubmissionsRef.current.clear();
        shouldResetHighlightedRef.current = false;
      }

      const sortedSubmissions = [...reportSubmissions].sort((a, b) => {
        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
        return dateB - dateA;
      });

      const latest = sortedSubmissions[0];
      if (latest && latest.id && !highlightedSubmissionsRef.current.has(latest.id)) {
        highlightedSubmissionsRef.current.add(latest.id);
        setLatestSubmissionId(latest.id);

        highlightAnim.setValue(0);
        Animated.sequence([
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(highlightAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(highlightAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => setLatestSubmissionId(null), 2000);
        });
      }
    }
  }, [reportSubmissions, highlightAnim]);

  const renderReportCard = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const formattedDate = item.date_created
        ? new Date(item.date_created).toLocaleDateString('ur-PK')
        : 'تاریخ دستیاب نہیں';
      const management = reportDetails
        .flatMap((r) => r.managements)
        .find((m) => m.id === item.mgmt_id);

      // Check if this is the latest submission to highlight
      const isLatestSubmission = item.id === latestSubmissionId;

      // Create animated style for highlighting
      const animatedStyle = isLatestSubmission
        ? {
            transform: [
              {
                scale: highlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.03],
                }),
              },
            ],
          }
        : {};

      // Create a title that includes the index for easier identification
      const cardTitle = management
        ? `[${index}] ماہانہ کارکردگی رپورٹ ۔ ماہ ${management.month}/20/${management.year}ء`
        : `[${index}] رپورٹ ${item.id}`;

      return (
        <Animated.View
          key={`submission-container-${item.id}`}
          style={[isLatestSubmission && styles.highlightedCard, animatedStyle]}
        >
          <ReportCard
            key={`submission-${item.id}`}
            title={cardTitle}
            sumbitDateText={`جمع کروانے کی تاریخ – ${formattedDate}`}
            location={item.unitDetails?.Name ?? 'نامعلوم'}
            status={item.status === 'published' ? 'جمع شدہ' : 'ڈرافٹ'}
            statusColor={item.status === 'published' ? COLORS.success : COLORS.error}
            onEdit={() => {
              router.push({
                pathname: ROUTES.CREATE_REPORT,
                params: {
                  submissionId: item.id,
                  templateId: item.template_id,
                  managementId: item.mgmt_id,
                  unitId: item.unit_id,
                  status: item.status,
                  mode: 'edit',
                  submissionData: item.submission_data ? JSON.stringify(item.submission_data) : undefined,
                },
              });
            }}
            onView={() => {
              router.push({
                pathname: ROUTES.CREATE_REPORT,
                params: {
                  submissionId: item.id,
                  templateId: item.template_id,
                  managementId: item.mgmt_id,
                  unitId: item.unit_id,
                  status: item.status,
                  mode: 'view',
                  submissionData: item.submission_data ? JSON.stringify(item.submission_data) : undefined,
                },
              });
            }}
          />
        </Animated.View>
      );
    },
    [reportDetails, latestSubmissionId, highlightAnim, router]
  );

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  if (loading || qaState.status === 'loading') {
    return (
      <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
        </View>
      </ScreenLayout>
    );
  }

  if (error || qaState.error) {
    const errorMessage = error || qaState.error;
    return (
      <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>خرابی: {errorMessage}</UrduText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              // Reset QA initialization flags to force a fresh fetch
              qaInitializedRef.current = false;
              lastTemplateIdRef.current = null;
              lastMgmtIdRef.current = null;

              // Ensure we have a fresh token before retrying
              refreshTokenIfNeeded()
                .then(() => {
                  if (userUnitDetails) {
                    // Force QA refresh on retry
                    return fetchAllData(true);
                  }
                })
                .catch((error) => {
                  console.error('Error refreshing token before retry:', error);
                });
            }}
          >
            <UrduText style={styles.retryButtonText}>دوبارہ کوشش کریں</UrduText>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TouchableOpacity style={styles.searchIcon}>
              <Ionicons name="search" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="ماہ یا یوسی نمبر سے تلاش کریں"
              placeholderTextColor={COLORS.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              textAlign="right"
            />
            <TouchableOpacity style={styles.filterIcon} onPress={handleFilterPress}>
              <MaterialCommunityIcons name="tune-vertical-variant" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TabGroup tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
        </View>

        {filteredReports.length > 0 ? (
          <FlatList
            data={filteredReports}
            renderItem={renderReportCard}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noReportsContainer}>
            <Image source={COMMON_IMAGES.noReport} style={styles.noReportImage} resizeMode="contain" />
            <UrduText style={styles.noReportText}>اس وقت کوئی رپورٹ موجود نہیں ہے۔</UrduText>
          </View>
        )}

        <FilterModal
          visible={isFilterModalVisible}
          onClose={handleCloseFilter}
          onApplyFilter={handleApplyFilter}
          onResetFilter={handleResetFilter}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.sm,
    height: 48,
    ...SHADOWS.small,
  },
  searchIcon: {
    padding: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.black,
    paddingHorizontal: SPACING.sm,
    textAlign: 'right',
  },
  filterIcon: {
    padding: SPACING.xs,
  },
  tabContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  listContainer: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
  noReportsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
  },
  noReportImage: {
    width: 120,
    height: 120,
    marginBottom: SPACING.md,
  },
  noReportText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  highlightedCard: {
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
});

export default AllReportsScreen;