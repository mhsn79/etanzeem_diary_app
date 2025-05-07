import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
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
  selectReportsList,
  selectReportSubmissions,
  selectReportsError,
  selectReportsLoading,
} from '@/app/features/reports/reportsSlice_new';
import { selectUserUnitDetails, selectAllTanzeemiUnits } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import ScreenLayout from '@/app/components/ScreenLayout';

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

  const userUnitDetails = useSelector(selectUserUnitDetails);
  const tanzeemiUnits = useSelector(selectAllTanzeemiUnits) ?? [];
  const reportSubmissions = useSelector(selectReportSubmissions) ?? [];
  const reportDetails = useSelector(selectReportsList) ?? [];
  const loading = useSelector(selectReportsLoading);
  const error = useSelector(selectReportsError);

  // Tabs configuration
  const tabs = [
    { label: 'سابقہ / جمع شدہ رپورٹس', value: 0 },
    { label: 'ڈیو/اوور ڈیو رپورٹ', value: 1 },
  ];

  const filteredReports = useMemo(() => {
    console.log('filterCriteria', filterCriteria);
  
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
console.log('filterCriteria.selectedUnitIdfilterCriteria.selectedUnitId',filterCriteria.selectedUnitId,JSON.stringify(reports,null,2));

    if (filterCriteria.selectedUnitId !== null) {
      console.log('after applying filters',reports);
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

  useEffect(() => {
    if (userUnitDetails?.id) {
      dispatch(fetchReportsByUnitId(userUnitDetails.id));
      dispatch(fetchReportSubmissions());
    }
  }, [dispatch, userUnitDetails?.id]);

  const renderReportCard = useCallback(
    ({ item }: { item: any }) => {
      const submissionDate = item.date_created ? new Date(item.date_created) : new Date();
      const submissionMonth = getUrduMonth(submissionDate.getMonth() + 1);
      const submissionYear = submissionDate.getFullYear();
      const sumbitDateText = `جمع کروانے کی تاریخ – ${submissionMonth} ${submissionYear}`;
      const location = item?.unitDetails?.Name || "نامعلوم";

      let status = 'جمع شدہ';
      let statusColor = COLORS.success;

      if (item.status === 'draft') {
        status = 'ڈرافٹ';
        statusColor = COLORS.warning;
      } else if (item.status === 'pending') {
        status = 'زیر التواء';
        statusColor = COLORS.orange;
      } else if (item.status === 'rejected') {
        status = 'مسترد';
        statusColor = COLORS.error;
      }

      return (
        <ReportCard
          title={reportDetails[0]?.template?.report_name || ''}
          sumbitDateText={sumbitDateText}
          location={location}
          status={status}
          statusColor={statusColor}
        />
      );
    },
    [reportDetails]
  );

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  if (loading) {
    return (
      <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
        </View>
      </ScreenLayout>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Header title="جمع شدہ رپورٹس" onBack={handleBack} />
        <UrduText style={styles.errorText}>خرابی: {error}</UrduText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => userUnitDetails?.id && dispatch(fetchReportsByUnitId(userUnitDetails.id))}
        >
          <UrduText style={styles.retryButtonText}>دوبارہ کوشش کریں</UrduText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
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
      <View style={styles.tabSection}>
        <TabGroup tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
      </View>

      {filteredReports?.length === 0 ? (
        <View style={styles.noReportsContainer}>
          <UrduText style={styles.noReportsText}>کوئی رپورٹس نہیں ملیں۔</UrduText>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportCard}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
        />
      )}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={handleCloseFilter}
        onApplyFilter={handleApplyFilter}
        onResetFilter={handleResetFilter}
      />
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
  },
  filterIcon: {
    padding: SPACING.xs,
  },
  tabSection: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
  },
  listContent: {
    padding: SPACING.md,
  },
  separator: {
    height: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  noReportsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noReportsText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AllReportsScreen;
