import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UrduText from '../../components/UrduText';
import Header from '../../components/Header';
import { TabGroup } from '../../components/Tab';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SIZES, SHADOWS } from '../../constants/theme';
import { COMMON_IMAGES } from '../../constants/images';
import ReportCard from './components/ReportCard';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReportsByUnitId,
  selectManagementReportsList,
  selectReportSubmissions,
  selectReportsError,
  selectReportsLoading,
  fetchReportSubmissions,
} from '@/app/features/reports/reportsSlice_new';
import { selectUserUnitDetails } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';
import { formatExpectedCompletion, getUrduMonth } from '@/app/constants/urduLocalization';

const ReportsManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [selectedTab, setSelectedTab] = useState(0);

  // Redux state
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const reportSubmissions = useSelector(selectReportSubmissions) ?? [];
  const reportMgmtDetails = useSelector(selectManagementReportsList) ?? [];
  const loading = useSelector(selectReportsLoading);
  const error = useSelector(selectReportsError);
  
  // Memoized filtered submissions
  const filteredSubmissions = useMemo(() => {
    return reportSubmissions.filter((submission) =>
      selectedTab === 0
        ? submission.status === 'published'
        : submission.status === 'draft' || submission.status === 'pending'
    );
  }, [reportSubmissions, selectedTab]);

  // Handlers
  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.push(ROUTES.DASHBOARD);
  }, [router]);

  const handleViewAllReports = useCallback(() => {
    router.push(ROUTES.ALL_REPORTS);
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(ROUTES.SUBMITTED_REPORT);
  }, [router]);

  const handleCreateReport = useCallback(() => {
 router.push(ROUTES.CREATE_REPORT,{});
  }, [router]);

  useEffect(() => {
      // Fetch reports by unit ID when the component mounts
      const fetchReports = async () => {
        try {
          if (!userUnitDetails) {
            console.error('User unit details not available');
            return;
          }
        
          await dispatch(fetchReportsByUnitId(userUnitDetails?.id));
          await dispatch(fetchReportSubmissions())
        } catch (error) {
          console.error('Error fetching reports:', error);
        }
      };
  
      if (userUnitDetails) {
        fetchReports();
      }
    }
  , [userUnitDetails, dispatch]);
  // Fetch reports on mount
  useEffect(() => {
    if (userUnitDetails?.unitLevelId) {
      dispatch(fetchReportsByUnitId(userUnitDetails.unitLevelId));
    }
  }, [dispatch, userUnitDetails?.unitLevelId]);

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <UrduText style={styles.errorText}>خرابی: {error}</UrduText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => userUnitDetails?.unitLevelId && dispatch(fetchReportsByUnitId(userUnitDetails.unitLevelId))}
        >
          <UrduText style={styles.retryButtonText}>دوبارہ کوشش کریں</UrduText>
        </TouchableOpacity>
      </View>
    );
  }

  const latestManagement = reportMgmtDetails[0]?.managements[0];
  const completionPercentage = 50; // Mock data
  const daysRemaining = latestManagement
    ? Math.ceil(
        (new Date(latestManagement.reporting_end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Header title="رپورٹ مینجمنٹ" onBack={handleBack} />
        <View style={styles.content}>
          <UrduText style={styles.subTitle}>موجودہ رپورٹ</UrduText>
          <TouchableOpacity
            style={styles.reportSummaryContainer}
            onPress={handleCreateReport}
            activeOpacity={0.8}
          >
            {latestManagement && reportMgmtDetails[0]?.template ? (
              <>
                <UrduText style={styles.reportSummaryItemTitle}>
                  {`${reportMgmtDetails[0].template.report_name}۔ ماہ ${getUrduMonth(
                    latestManagement.month
                  )} ${latestManagement.year}ء`}
                </UrduText>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>مقام</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {userUnitDetails?.Name ?? 'نامعلوم'}
                    </UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>
                      {formatExpectedCompletion(latestManagement.reporting_end_date)}
                    </UrduText>
                  </View>
                </View>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>اسٹیٹس</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>{`${completionPercentage}% مکمل`}</UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText
                      style={[
                        styles.reportSummaryItemValue,
                        { color: daysRemaining < 5 ? '#E63946' : COLORS.success },
                      ]}
                    >
                      {daysRemaining > 0
                        ? `${daysRemaining} دن باقی ہیں`
                        : `${Math.abs(daysRemaining)} دن گزر چکے ہیں`}
                    </UrduText>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noReportsContainer}>
                <Image
                  source={COMMON_IMAGES.noReport}
                  style={styles.noReportImage}
                  resizeMode="contain"
                />
                <UrduText style={styles.noReportText}>اس وقت کوئی فعال رپورٹ موجود نہیں ہے۔</UrduText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.reportSection}>
          <TabGroup
            tabs={[
              { label: 'سابقہ / جمع شدہ رپورٹس', value: 0 },
              { label: 'ڈیو/اوور ڈیو رپورٹ', value: 1 },
            ]}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
          <TouchableOpacity onPress={handleViewAllReports} style={styles.viewAllButton}>
            <UrduText style={styles.sectionTitle}>تمام رپورٹس دیکھیں</UrduText>
          </TouchableOpacity>
        </View>

        <View style={styles.reportContainer}>
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.slice(0, 3).map((submission) => {
              const formattedDate = submission.date_created
                ? new Date(submission.date_created).toLocaleDateString('ur-PK')
                : '';
              const management = reportMgmtDetails
                .flatMap((r) => r.managements)
                .find((m) => m.id === submission.mgmt_id);

              return (
                <ReportCard
                  key={`submission-${submission.id}`}
                  title={
                    management
                      ? `ماہانہ کارکردگی رپورٹ ۔ ماہ ${management.month}/20/${management.year}ء`
                      : `رپورٹ ${submission.id}`
                  }
                  sumbitDateText={`جمع کروانے کی تاریخ – ${formattedDate}`}
                  location={submission.unitDetails?.Name ?? 'نامعلوم'}
                  status={submission.status === 'published' ? 'جمع شدہ' : 'ڈرافٹ'}
                  statusColor={submission.status === 'published' ? COLORS.success : COLORS.error}
                  onEdit={handleEdit}
                />
              );
            })
          ) : (
            <View style={[styles.noReportsContainer, { backgroundColor: COLORS.white }]}>
              <Image
                source={COMMON_IMAGES.noReport}
                style={styles.noReportImage}
                resizeMode="contain"
              />
              <UrduText style={styles.noReportText}>اس وقت کوئی فعال رپورٹ موجود نہیں ہے۔</UrduText>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  subTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: '600',
    marginLeft: SPACING.lg,
    color: COLORS.background,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  reportSummaryContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    ...SHADOWS.small,
  },
  reportSummaryItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 40,
  },
  reportSummaryItemValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  reportSummaryItemValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportSummaryItemValueContainerItem: {
    flexDirection: 'row',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: SIZES.button.height / 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.tertiary,
    borderRadius: BORDER_RADIUS.sm,
  },
  reportSection: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDecorationLine: 'underline',
    color: COLORS.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: SPACING.sm,
  },
  reportContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  loadingContainer: {
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

    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
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
});

export default ReportsManagementScreen;