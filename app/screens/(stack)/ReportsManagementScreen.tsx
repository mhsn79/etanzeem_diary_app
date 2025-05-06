import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../../i18n';
import UrduText from '../../components/UrduText';
import { useLanguage } from '../../context/LanguageContext';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import ReportActionButton from './components/ReportActionButton';
import { TabGroup } from '../../components/Tab';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SIZES, SHADOWS } from '../../constants/theme';
import { COMMON_IMAGES } from '../../constants/images';
import ReportCard from './components/ReportCard';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/navigation';
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
} from '@/app/features/tazeem/tazeemSlice';
import { AppDispatch } from '@/app/store';

const ReportsManagementScreen = () => {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isRTL = currentLanguage === 'ur';
  const [selectedTab, setSelectedTab] = useState(0);

  /* ------------ Redux state (immune to 'undefined') ------------- */
  const userTanzeemiLevel = useSelector(selectUserTanzeemiLevelDetails) ?? null;
  const tanzeemiUnits = useSelector(selectAllTanzeemiUnits) ?? [];
  const reportManagements = useSelector(selectReportManagements) ?? [];
  const reportTemplates = useSelector(selectReportTemplates) ?? [];
  const reportSections = useSelector(selectReportSections) ?? [];
  const reportQuestions = useSelector(selectReportQuestions) ?? [];
  const reportSubmissions = useSelector(selectReportSubmissions) ?? [];
  const latestReportMgmt = useSelector(selectLatestReportMgmt);
  const status = useSelector(selectReportsStatus) ?? 'idle';
  const error = useSelector(selectReportsError) ?? null;

  /* -------------------------------------------------------------- */
  /*  Data bootstrapping                                            */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    // Fetch all report data when component mounts
    console.log('ReportsManagementScreen: Dispatching fetchAllReportData');
    dispatch(fetchAllReportData())
      .unwrap()
      .then((result) => {
        console.log('ReportsManagementScreen: fetchAllReportData succeeded with data:', {
          reportManagementsCount: result.reportManagements.length,
          reportTemplatesCount: result.reportTemplates.length,
          reportSectionsCount: result.reportSections.length,
          reportQuestionsCount: result.reportQuestions.length
        });
      })
      .catch((error) => {
        console.error('ReportsManagementScreen: fetchAllReportData failed:', error);
        Alert.alert('Error', 'Failed to load report data. Please try again.');
      });
  }, []);

  const tabs = [
    { label: 'سابقہ / جمع شدہ رپورٹس', value: 0 },
    { label: 'ڈیو/اوور ڈیو رپورٹ', value: 1 },
  ];

  const handleBack = () => {
    // Check if we can go back, otherwise go to Dashboard
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push(ROUTES.DASHBOARD);
    }
  };

  const handleViewAllReports = () => {
    router.push(ROUTES.ALL_REPORTS);
  };

  const handleEdit = () => {
    router.push(ROUTES.SUBMITTED_REPORT);
  };

  const handleOpen = () => {
    // Handle open action
  };

  const handleSubmit = () => {
    // Handle submit action
  };

  const handleCreateReport = () => {
    // Pass the latest report management as a parameter if available
    const mgmtParam = latestReportMgmt || (reportManagements.length > 0 ? reportManagements[0] : null);
    
    // Use the correct approach for passing parameters in expo-router
    // Parameters should be passed as query parameters in the URL
    if (mgmtParam) {
      router.push({
        pathname: ROUTES.CREATE_REPORT,
        params: { mgmtId: mgmtParam.id.toString() }
      });
    } else {
      router.push(ROUTES.CREATE_REPORT);
    }
  };

  // Render loading state
  if (status === 'loading') {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <UrduText style={styles.loadingText}>لوڈ ہو رہا ہے...</UrduText>
      </View>
    );
  }

  // Render error state
  if (status === 'failed' && error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <UrduText style={styles.errorText}>خرابی: {error}</UrduText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => dispatch(fetchAllReportData())}
        >
          <UrduText style={styles.retryButtonText}>دوبارہ کوشش کریں</UrduText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, backgroundColor: COLORS.primary }]}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="رپورٹ مینجمنٹ"
          onBack={handleBack}
        />

        <View style={styles.content}>
          <View>
            <UrduText style={styles.subTitle}>موجودہ رپورٹ</UrduText>
            <TouchableOpacity 
              style={styles.reportSummaryContainer}
              onPress={handleCreateReport}
              activeOpacity={0.8}
            >
              <View style={styles.reportSummaryItem}>
                {latestReportMgmt&&latestReportMgmt.status!=='published' ? (
                  <>
                    {/* Use the latest report management entry as the current report */}
                    {(() => {

                      console.log('ReportsManagementScreen: Rendering current report:', latestReportMgmt.status);
                      
                      const currentReport = latestReportMgmt;
                      console.log('ReportsManagementScreen: Current report:', currentReport.status);
                      
                      const template = reportTemplates.find(t => t.id === currentReport.report_template_id);
                      
                      // Calculate days remaining
                      const endDate = new Date(currentReport.reporting_end_date);
                      const today = new Date();
                      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Calculate completion percentage (mock data - would come from API in real app)
                      const completionPercentage = 50;
                      
                      return (
                        <>
                          <UrduText style={styles.reportSummaryItemTitle}>
                            {`ماہانہ کارکردگی رپورٹ ۔ ماہ ${currentReport.month}/20${currentReport.year}ء`}
                          </UrduText>
                          <View style={styles.reportSummaryItemValueContainer}>
                            <View style={styles.reportSummaryItemValueContainerItem}>
                              <UrduText style={styles.reportSummaryItemValue}>مقام</UrduText>
                              <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                              <UrduText style={styles.reportSummaryItemValue}>{userTanzeemiLevel ? userTanzeemiLevel.Name : "نامعلوم"}</UrduText>
                            </View>
                            <View style={styles.reportSummaryItemValueContainerItem}>
                              <UrduText style={styles.reportSummaryItemValue}>متوقع تکمیل</UrduText>
                              <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                              <UrduText style={styles.reportSummaryItemValue}>{currentReport.reporting_end_date}</UrduText>
                            </View>
                          </View>
                          <View style={styles.reportSummaryItemValueContainer}>
                            <View style={styles.reportSummaryItemValueContainerItem}>
                              <UrduText style={styles.reportSummaryItemValue}>اسٹیٹس</UrduText>
                              <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                              <UrduText style={styles.reportSummaryItemValue}>{`% ${completionPercentage} مکمل`}</UrduText>
                            </View>
                            <View style={styles.reportSummaryItemValueContainerItem}>
                              <UrduText 
                                style={[
                                  styles.reportSummaryItemValue, 
                                  { color: daysRemaining < 5 ? '#E63946' : COLORS.success }
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
                      );
                    })()}
                 </>
                ) : (
                  <View style={styles.noCurrentReportContainer}>
                    <Image 
                      source={COMMON_IMAGES.noReport}
                      style={styles.noCurrentReportImage}
                      resizeMode="contain"
                    />
                    <UrduText style={styles.noCurrentReportText}>
                      اس وقت کوئی فعال رپورٹ موجود نہیں ہے۔
                    </UrduText>
                
                  </View>
                )}
                {/* Only show progress bar for fallback data if no reports exist */}
                {!latestReportMgmt && reportManagements.length === 0 && !reportSubmissions.length && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: '0%' }]} />
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.reportSection}>
          <TabGroup
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
          <TouchableOpacity 
            onPress={handleViewAllReports}
            style={styles.viewAllButton}
          >
            <UrduText style={styles.sectionTitle}>تمام رپورٹس دیکھیں</UrduText>
          </TouchableOpacity>
        </View>

        <View style={styles.reportContainer}>
          {reportSubmissions.length > 0 ? (
            (() => {
              // Filter submissions based on selected tab
              const filteredSubmissions = reportSubmissions.filter(submission => {
                if (selectedTab === 0) {
                  return submission.status === 'published';
                } else {
                  return submission.status === 'draft' || submission.status === 'pending';
                }
              });
              
              // If there are no submissions for the selected tab, show the "no reports" message
              if (filteredSubmissions.length === 0) {
                return (
                  <View style={styles.noReportsContainer}>
                    <Image 
                      source={COMMON_IMAGES.noReport} 
                      style={styles.noReportImage}
                      resizeMode="contain"
                    />
                    <UrduText style={styles.noReportText}>
                      اس وقت کوئی فعال رپورٹ موجود نہیں ہے۔
                    </UrduText>
                  </View>
                );
              }
              
              // Otherwise, show the filtered submissions
              return filteredSubmissions.slice(0, 3).map((submission, index) => {
                // Find the template for this submission
                const template = reportTemplates.find(t => t.id === submission.template_id);
                // Find the level for this template
                // Find the unit for this submission
                const unit = tanzeemiUnits.find(u => u.id === submission.unit_id);
                // Find the management report for this submission
                const management = submission.mgmt_id ? reportManagements.find(m => m.id === submission.mgmt_id) : null;
                
                // Format date
                const formattedDate = submission.date_created 
                  ? new Date(submission.date_created).toLocaleDateString('ur-PK')
                  : '';
                
                return (
                  <ReportCard
                    key={`submission-${submission.id}`}
                    title={management 
                      ? `ماہانہ کارکردگی رپورٹ ۔ ماہ ${management.month}/20/${management.year}/ء`
                      : `رپورٹ ${submission.id}`
                    }
                    sumbitDateText={`جمع کروانے کی تاریخ – ${formattedDate}`}
                    location='Hello'
                    // location={unit ? unit.Name : (userTanzeemiLevel ? userTanzeemiLevel.Name : "")}
                    status={submission.status === 'published' ? "جمع شدہ" : "ڈرافٹ"}
                    statusColor={submission.status === 'published' ? COLORS.success : COLORS.error}
                    onEdit={handleEdit}
                  />
                );
              });
            })()
          ) : (
            // Show "no reports" message if no data is available at all
            <View style={styles.noReportsContainer}>
              <Image 
                source={COMMON_IMAGES.noReport} 
                style={styles.noReportImage}
                resizeMode="contain"
              />
              <UrduText style={styles.noReportText}>
                اس وقت کوئی فعال رپورٹ موجود نہیں ہے۔
              </UrduText>
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
  },
  content: {
    flex: 0.1,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  titleContainerIcon: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    position: 'absolute',
    left: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '600',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    color: COLORS.background,
    writingDirection: 'rtl',
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
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    ...SHADOWS.small,
  },
  reportSummaryItem: {
    flex: 1,
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
    flex: 1,
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
    marginBottom: SPACING.sm,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    padding: SPACING.sm,
    marginHorizontal: SPACING.xs,
    ...SHADOWS.small,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonIcon: {
    marginLeft: SPACING.xs,
  },
  reportContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },

  // Loading and error styles
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
  // No reports styles
  noReportsContainer: {
    height: 300, // Fixed height for the container
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,

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
  // No current report styles
  noCurrentReportContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  noCurrentReportImage: {
    width: 100,
    height: 100,
    marginBottom: SPACING.sm,
  },
  noCurrentReportText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
});

export default ReportsManagementScreen;