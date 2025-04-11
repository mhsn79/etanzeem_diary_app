import React, { useState } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../../i18n';
import UrduText from '../../components/UrduText';
import { useLanguage } from '../../context/LanguageContext';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import ReportActionButton from './components/ReportActionButton';
import { TabGroup } from '../../components/Tab';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SIZES, SHADOWS } from '../../constants/theme';
import ReportCard from './components/ReportCard';
import { useRouter } from 'expo-router';

const ReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const router = useRouter();
  const isRTL = currentLanguage === 'ur';
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { label: 'سابقہ / جمع شدہ رپورٹس', value: 0 },
    { label: 'ڈیو/اوور ڈیو رپورٹ', value: 1 },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleViewAllReports = () => {
    router.push('/screens/(stack)/AllReportsScreen');
  };

  const handleEdit = () => {
    // Handle edit action
  };

  const handleOpen = () => {
    // Handle open action
  };

  const handleSubmit = () => {
    // Handle submit action
  };

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
            <View style={styles.reportSummaryContainer}>
              <View style={styles.reportSummaryItem}>
                <UrduText style={styles.reportSummaryItemTitle}>ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء</UrduText>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>مقام</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>وارڈ نمبر 3</UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>متوقع  تکمیل</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}> 15 مارچ 2024</UrduText>
                  </View>
                </View>
                <View style={styles.reportSummaryItemValueContainer}>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={styles.reportSummaryItemValue}>اسٹیٹس  </UrduText>
                    <UrduText style={styles.reportSummaryItemValue}>:</UrduText>
                    <UrduText style={styles.reportSummaryItemValue}> % 50 مکمل </UrduText>
                  </View>
                  <View style={styles.reportSummaryItemValueContainerItem}>
                    <UrduText style={[styles.reportSummaryItemValue, { color: '#E63946' }]}>3 دن باقی ہیں</UrduText>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '70%' }]} />
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <ReportActionButton
                    text="ایڈٹ کریں"
                    onPress={handleEdit}
                    icon={<FontAwesome name="edit" size={20} color="black" />}
                  />
                  <ReportActionButton
                    text="اوپن کریں"
                    onPress={handleOpen}
                    icon={<MaterialCommunityIcons name="arrow-top-left-thin-circle-outline" size={20} color="black" />}
                  />
                  <ReportActionButton
                    text="جمع کروائیں"
                    onPress={handleSubmit}
                  />
                </View>
              </View>
            </View>
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
          <ReportCard
            title="ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء"
            sumbitDateText="جمع کروانے کی تاریخ – جنوری 2024"
            location="یوسی 12 - گلزار ٹاؤن"
            status="جمع شدہ"
            statusColor={COLORS.success}
            onEdit={handleEdit}
          />
          <ReportCard
            title="ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء"
            sumbitDateText="جمع کروانے کی تاریخ – جنوری 2024"
            location="یوسی 12 - گلزار ٹاؤن"
            status="جمع شدہ"
            statusColor={COLORS.error}
          />
          <ReportCard
            title="ماہانہ کارکردگی رپورٹ ۔  ماہ مارچ 2025ء"
            sumbitDateText="جمع کروانے کی تاریخ – جنوری 2024"
            location="یوسی 12 - گلزار ٹاؤن"
            status="جمع شدہ"
            statusColor={COLORS.success}
            onEdit={handleEdit}
          />
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
    flex: 1,
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
});

export default ReportsScreen;