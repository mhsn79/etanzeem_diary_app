import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SIZES, SHADOWS } from '../../constants/theme';
import { useNavigation } from 'expo-router';
import ReportCard from './components/ReportCard';
import FilterModal from '../../components/FilterModal';
import ScreenLayout from '@/app/components/ScreenLayout';
import UrduText from '@/app/components/UrduText';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAllReportData,
  selectReportManagements,
  selectReportTemplates,
  selectReportSections,
  selectReportQuestions,
  selectReportsStatus,
  selectReportsError,
  selectReportSubmissions,
  selectLatestReportMgmt
} from '@/app/features/reports/reportsSlice';
import {
  selectUserTanzeemiLevelDetails,
  selectAllTanzeemiUnits,
  selectTanzeemiUnitIds
} from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';
import { getUrduMonth } from '@/app/constants/urduLocalization';




const AllReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const isRTL = currentLanguage === 'ur';
  const [searchText, setSearchText] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [filterCriteria, setFilterCriteria] = useState({
    timeRange: '',
    startDate: null as Date | null,
    endDate: null as Date | null
  });

  /* ------------ Redux state (immune to 'undefined') ------------- */
  const tanzeemiUnits = useSelector(selectAllTanzeemiUnits) ?? [];
  const tanzeemiUnitIds = useSelector(selectTanzeemiUnitIds) ?? [];
  const reportManagements = useSelector(selectReportManagements) ?? [];
  const reportTemplates = useSelector(selectReportTemplates) ?? [];
  const reportSubmissions = useSelector(selectReportSubmissions) ?? [];
  const status = useSelector(selectReportsStatus) ?? 'idle';
  const error = useSelector(selectReportsError) ?? null;
console.log('-----------------------------------------------------------------------reportSubmissions',reportSubmissions.length);

  /* -------------------------------------------------------------- */
  /*  Data bootstrapping                                            */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    // Fetch all report data when component mounts if not already loaded
    if (status === 'idle') {
      console.log('AllReportsScreen: Dispatching fetchAllReportData');
      dispatch(fetchAllReportData())
        .unwrap()
        .then((result) => {
          console.log('AllReportsScreen: fetchAllReportData succeeded');
        })
        .catch((error) => {
          console.error('AllReportsScreen: fetchAllReportData failed:', error);
          Alert.alert('Error', 'Failed to load report data. Please try again.');
        });
    }
  }, []);

  // Process and filter reports whenever data changes or search/filter criteria change
  useEffect(() => {
    if (reportSubmissions.length > 0) {
      let reports = [...reportSubmissions];
      
      // Apply search filter if text is entered
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase();
        reports = reports.filter(report => {
          // Get the management report for this submission
          const management = reportManagements.find(m => m.id === report.mgmt_id);
          if (!management) return false;
          
          // Get the template for this submission
          const template = reportTemplates.find(t => t.id === report.template_id);
          if (!template) return false;
          
          // Get the unit for this submission
          const unit = tanzeemiUnits.find(u => u.id === report.unit_id);
          
          // Search in month, year, unit name
          const monthInUrdu = management.month ? getUrduMonth(management.month).toLowerCase() : '';
          const yearStr = management.year ? management.year.toString() : '';
          const unitName = unit?.Name?.toLowerCase() || '';
          
          return monthInUrdu.includes(searchLower) || 
                 yearStr.includes(searchLower) || 
                 unitName.includes(searchLower);
        });
      }
      
      // Apply date filters if set
      if (filterCriteria.startDate && filterCriteria.endDate) {
        reports = reports.filter(report => {
          const reportDate = new Date(report.date_created || report.date_updated || Date.now());
          return reportDate >= filterCriteria.startDate! && 
                 reportDate <= filterCriteria.endDate!;
        });
      }
      
      // Sort reports by date (newest first)
      reports.sort((a, b) => {
        const dateA = new Date(a.date_created || a.date_updated || 0);
        const dateB = new Date(b.date_created || b.date_updated || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setFilteredReports(reports);
    } else {
      setFilteredReports([]);
    }
  }, [reportSubmissions, reportManagements, reportTemplates, tanzeemiUnits, searchText, filterCriteria]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleCloseFilter = () => {
    setIsFilterModalVisible(false);
  };

  const handleApplyFilter = (selectedTime: string, startDate: Date, endDate: Date) => {
    // Update filter criteria
    setFilterCriteria({
      timeRange: selectedTime,
      startDate,
      endDate
    });
    setIsFilterModalVisible(false);
  };

  // Memoized render item function
  const renderReportCard = useCallback(({ item }: { item: any }) => {
    // Get the management report for this submission
    const management = reportManagements.find(m => m.id === item.mgmt_id);
    if (!management) return null;
    
    // Get the template for this submission
    const template = reportTemplates.find(t => t.id === item.template_id);
    if (!template) return null;
    
    // Get the unit for this submission
    const unit = tanzeemiUnits.find(u => u.id === item.unit_id);
    
    // Format the title
    const title = `ماہانہ کارکردگی رپورٹ ۔ ماہ ${getUrduMonth(management.month)} ${management.year}ء`;
    
    // Format the submission date
    const submissionDate = item.date_created 
      ? new Date(item.date_created)
      : new Date();
    const submissionMonth = getUrduMonth(submissionDate.getMonth() + 1);
    const submissionYear = submissionDate.getFullYear();
    const sumbitDateText = `جمع کروانے کی تاریخ – ${submissionMonth} ${submissionYear}`;
    
    // Get location
    const location = unit?.Name || "نامعلوم";
    
    // Get status and color
    let status = "جمع شدہ";
    let statusColor = COLORS.success;
    
    if (item.status === 'draft') {
      status = "ڈرافٹ";
      statusColor = COLORS.warning;
    } else if (item.status === 'pending') {
      status = "زیر التواء";
      statusColor = COLORS.orange;
    } else if (item.status === 'rejected') {
      status = "مسترد";
      statusColor = COLORS.error;
    }
    
    return (
      <ReportCard
        title={title}
        sumbitDateText={sumbitDateText}
        location={location}
        status={status}
        statusColor={statusColor}
      />
    );
  }, [reportManagements, reportTemplates, tanzeemiUnits]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  // Memoized item separator
  const ItemSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  // Render loading state
  if (status === 'loading') {
    return (
      <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
        </View>
      </ScreenLayout>
    );
  }

  // Render error state
  if (status === 'failed' && error) {
    return (
      <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
        <View style={styles.loadingContainer}>
          <UrduText style={styles.errorText}>خرابی: {error}</UrduText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => dispatch(fetchAllReportData())}
          >
            <UrduText style={styles.retryButtonText}>دوبارہ کوشش کریں</UrduText>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
   <ScreenLayout
    title="جمع شدہ رپورٹس"
    onBack={handleBack}
   >
     {/* Search Bar */}
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
              textAlign={isRTL ? 'right' : 'left'}
            />
            <TouchableOpacity style={styles.filterIcon} onPress={handleFilterPress}>
              <MaterialCommunityIcons name="tune-vertical-variant" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      
      {/* No reports message */}
      {filteredReports.length === 0 && status === 'succeeded' && (
        <View style={styles.noReportsContainer}>
          <UrduText style={styles.noReportsText}>
            کوئی رپورٹس نہیں ملیں۔
          </UrduText>
        </View>
      )}
      
      {/* FlatList for Report Cards */}
      {filteredReports.length > 0 && (
        <FlatList
          data={filteredReports}
          renderItem={renderReportCard}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
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
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSection: {
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
    fontFamily: TYPOGRAPHY.fontFamily.kasheeda,
    paddingHorizontal: SPACING.sm,
  },
  filterIcon: {
    padding: SPACING.xs,
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
    color: COLORS.textPrimary,
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