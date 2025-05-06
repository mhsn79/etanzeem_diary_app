import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TabGroup } from '../../components/Tab';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SIZES, SHADOWS } from '../../constants/theme';
import { COMMON_IMAGES } from '../../constants/images';
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
import UrduText from '../../components/UrduText';

// Import components from stack screen
import ReportActionButton from '../(stack)/components/ReportActionButton';
import ReportCard from '../(stack)/components/ReportCard';

export default function Reports() {
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
    console.log('Reports Tab: Dispatching fetchAllReportData');
    dispatch(fetchAllReportData())
      .unwrap()
      .then((result) => {
        console.log('Reports Tab: fetchAllReportData succeeded with data:', {
          reportManagementsCount: result.reportManagements.length,
          reportTemplatesCount: result.reportTemplates.length,
          reportSectionsCount: result.reportSections.length,
          reportQuestionsCount: result.reportQuestions.length
        });
      })
      .catch((error) => {
        console.error('Reports Tab: fetchAllReportData failed:', error);
        Alert.alert('Error', 'Failed to load report data. Please try again.');
      });
  }, []);

  const tabs = [
    { label: 'سابقہ / جمع شدہ رپورٹس', value: 0 },
    { label: 'ڈیو/اوور ڈیو رپورٹ', value: 1 },
  ];

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
    router.push(ROUTES.CREATE_REPORT);
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
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
   

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
                      const currentReport = latestReportMgmt;
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
                {reportManagements.length === 0 && !reportSubmissions.length && (
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
          
        </View>
        <TouchableOpacity 
            onPress={handleViewAllReports}
            style={styles.viewAllButton}
          >
            <UrduText style={styles.sectionTitle}>تمام رپورٹس دیکھیں</UrduText>
          </TouchableOpacity>
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
                      ? `ماہانہ کارکردگی رپورٹ ۔ ماہ ${management.month}/20${management.year}/ء`
                      : `رپورٹ ${submission.id}`
                    }
                    sumbitDateText={`جمع کروانے کی تاریخ – ${formattedDate}`}
location=''
                    status={submission.status === 'published' ? "جمع شدہ" : "ڈرافٹ"}
                    statusColor={submission.status === 'published' ? COLORS.success : COLORS.error}
                    onEdit={handleEdit}
                  />
                );
              });
            })()
          ) : (
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding at the bottom for the tab bar
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
   
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  content: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  subTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    color: COLORS.white,
    textAlign: 'left',
  },
  reportSummaryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  reportSummaryItem: {
    padding: SPACING.md,
  },
  reportSummaryItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  reportSummaryItemValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  reportSummaryItemValueContainerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportSummaryItemValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginHorizontal: 2,
    writingDirection: 'rtl',
  },
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.xl,
  },
  reportSection: {
  marginTop: SPACING.md,
 marginHorizontal: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  viewAllButton: {
    marginRight: SPACING.md,
  },
  reportContainer: {
    padding: SPACING.lg,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
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
