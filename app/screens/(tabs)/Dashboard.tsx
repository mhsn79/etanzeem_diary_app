import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
  Pressable,

} from 'react-native';
import i18n from '@/app/i18n';
import CustomDropdown from '@/app/components/CustomDropdown';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import LocationIcon from '@/assets/images/location-icon-yellow.svg';
import UserIcon from '@/assets/images/user-icon.svg';
import ReportIcon1 from '@/assets/images/report-icon-1.svg';
import LeftUpArrowWhite from '@/assets/images/left-up-arrow-white.svg';
import UrduText from '@/app/components/UrduText';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, TYPOGRAPHY } from '@/app/constants/theme';
import { AntDesign } from '@expo/vector-icons';
import Dialog from '@/app/components/Dialog';
import {
  selectAllHierarchyUnits,
  selectUserUnitDetails,
  selectUserUnitStatus,
  selectUserUnitError,
  selectUserTanzeemiLevelStatus,
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectNazimDetails } from '@/app/features/persons/personSlice';
import { AppDispatch } from '@/app/store';
import HeaderInfoItem from './components/HeaderInfoItem';
import ScheduleCard from './components/ScheduleCard';
import UnitSelectionModal from './components/UnitSelectionModal';
import DashboardBox from './components/DashboardBox';

// TypeScript Interfaces
interface Option {
  id: string;
  label: string;
  value: string;
}



interface ScheduleItem {
  eventName: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  type: string;
}

interface Stat {
  label: string;
  value: string;
}





interface DashboardBoxProps {
  title: string;
  stats: Stat[];
  onPress: () => void;
  isRtl: boolean;
  styles: ReturnType<typeof getStyles>;
}

// Helper Functions
const isLoading = (status: 'idle' | 'loading' | 'succeeded' | 'failed'): boolean => {
  return status === 'loading';
};



// Main Dashboard Component
const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const isRtl = i18n.locale === 'ur';
  const dispatch = useDispatch<AppDispatch>();
  const userUnit = useSelector(selectUserUnitDetails);
  const userUnitStatus = useSelector(selectUserUnitStatus);
  const userUnitError = useSelector(selectUserUnitError);
  const userTanzeemLevelStatus = useSelector(selectUserTanzeemiLevelStatus);
  const hierarchyUnits = useSelector(selectAllHierarchyUnits);
  const nazimDetails = useSelector(selectNazimDetails);
  const [showDialog, setShowDialog] = useState(false);
  const [showUnitSelectionModal, setShowUnitSelectionModal] = useState(false);

  useEffect(() => {
    console.log('User unit status:', userUnitStatus);
    if (userUnitStatus === 'succeeded') {
      console.log('User unit details:', userUnit);
    } else if (userUnitStatus === 'failed') {
      console.error('Error fetching user unit:', userUnitError);
    }
  }, [userUnitStatus, userUnit, userUnitError]);

  useEffect(() => {
    console.log('User tanzeemi level status:', userTanzeemLevelStatus);
  }, [userTanzeemLevelStatus]);

  useEffect(() => {
    console.log('Hierarchy units:', hierarchyUnits);
  }, [hierarchyUnits]);

  const scheduleForToday: ScheduleItem[] = [
    { eventName: 'Event 1', startTime: '10:00 AM', endTime: '12:00 PM', location: 'Room 101', description: 'Description for Event 1', type: 'type-1' },
    { eventName: 'Event 2', startTime: '2:00 PM', endTime: '4:00 PM', location: 'Room 102', description: 'Description for Event 2', type: 'type-2' },
    { eventName: 'Event 3', startTime: '5:00 PM', endTime: '7:00 PM', location: 'Room 103', description: 'Description for Event 3', type: 'type-3' },
    { eventName: 'Event 4', startTime: '8:00 PM', endTime: '10:00 PM', location: 'Room 104', description: 'Description for Event 4', type: 'type-4' },
    { eventName: 'Event 5', startTime: '11:00 PM', endTime: '1:00 AM', location: 'Room 105', description: 'Description for Event 5', type: 'type-5' },
  ];

  const durationItemNames: Option[] = [
    { id: '1', label: i18n.t('last_2_weeks'), value: 'last_2_weeks' },
    { id: '2', label: i18n.t('last_4_weeks'), value: 'last_4_weeks' },
    { id: '3', label: i18n.t('this_month'), value: 'this_month' },
    { id: '4', label: i18n.t('last_month'), value: 'last_month' },
    { id: '5', label: i18n.t('last_3_months'), value: 'last_3_months' },
    { id: '6', label: i18n.t('last_6_months'), value: 'last_6_months' },
    { id: '7', label: i18n.t('this_year'), value: 'this_year' },
    { id: '8', label: i18n.t('last_year'), value: 'last_year' },
    { id: '9', label: i18n.t('last_2_years'), value: 'last_2_years' },
  ];

  const dashboardBoxes: DashboardBoxProps[] = [
    {
      title: i18n.t('workforce'),
      onPress: () => router.push('/screens/Workforce'),
      stats: [
        { label: i18n.t('arkan'), value: '50' },
        { label: i18n.t('increase'), value: '5' },
        { label: i18n.t('target'), value: '10' },
      ],
      isRtl,
      styles,
    },
    {
      title: i18n.t('sub_units'),
      onPress: () => setShowUnitSelectionModal(true),
      stats: [
        { label: i18n.t('wards'), value: '5' },
        { label: '-', value: '-' },
        { label: '-', value: '-' },
      ],
      isRtl,
      styles,
    },
    {
      title: i18n.t('activities'),
      onPress: () => router.push('/screens/Activities'),
      stats: [
        { label: i18n.t('organizational'), value: '1' },
        { label: i18n.t('invitational'), value: '1' },
        { label: i18n.t('training'), value: '1' },
      ],
      isRtl,
      styles,
    },
    {
      title: i18n.t('upper_management'),
      onPress: () => setShowUnitSelectionModal(true),
      stats: [
        { label: i18n.t('activities'), value: '1' },
        { label: i18n.t('participation'), value: '1' },
        { label: '-', value: '-' },
      ],
      isRtl,
      styles,
    },
    {
      title: i18n.t('visits'),
      onPress: () => router.push('/screens/Meetings'),
      stats: [
        { label: '-', value: i18n.t('meetings') },
        { label: '-', value: '-' },
        { label: '-', value: '-' },
      ],
      isRtl,
      styles,
    },
    {
      title: i18n.t('money'),
      onPress: () => router.push('/screens/Income'),
      stats: [
        { label: '0', value: i18n.t('income') },
        { label: '0', value: i18n.t('expenses') },
        { label: '-', value: '-' },
      ],
      isRtl,
      styles,
    },
  ];

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleAddNew = () => setShowDialog(true);
  const handleMeetingSchedule = () => {
    setShowDialog(false);
    router.push('/screens/MeetingScreen');
  };
  const handleActivitySchedule = () => {
    setShowDialog(false);
    router.push('/screens/ActivityScreen');
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={Platform.OS === 'android'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={[styles.mainContainer, { direction: isRtl ? 'rtl' : 'ltr' }]}>
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
              <View style={styles.headerInfoContainer}>
                <HeaderInfoItem
                  text={userUnit?.Name || ''}
                  icon={LeftUpArrowWhite}
                  iconProps={{ style: styles.headerIcon }}
                  textStyle={styles.headerTitle}
                  onPress={() => setShowUnitSelectionModal(true)}
                  colorScheme={colorScheme}
                />
                <HeaderInfoItem
                  text={
                    hierarchyUnits && hierarchyUnits.length > 1
                      ? hierarchyUnits
                          .slice(1)
                          .map((unit) => unit.Name || unit.name)
                          .filter(Boolean)
                          .join('، ')
                          .substring(0, 27) + (hierarchyUnits.length > 1 && hierarchyUnits.slice(1).join('، ').length > 30 ? '...' : '')
                      : i18n.t('zone')
                  }
                  icon={LocationIcon}
                  iconProps={{ style: styles.locationIcon }}
                  colorScheme={colorScheme}
                />
                <HeaderInfoItem
                  text={nazimDetails?.Name || ''}
                  icon={UserIcon}
                  iconProps={{ style: styles.userIcon }}
                  onPress={() => router.push('/screens/ProfileView')}
                  colorScheme={colorScheme}
                />
              </View>
            </View>
            <ScheduleCard
              schedule={scheduleForToday}
              formattedDate={formattedDate}
              onPress={() => router.push('/screens/Activities')}
              colorScheme={colorScheme}
            />
          </View>
          <View style={styles.dashboardContent}>
            <View style={styles.reportSection}>
              <View style={styles.dropdownContainer}>
                <CustomDropdown
                  viewStyle={styles.dropdown}
                  options={durationItemNames}
                  onSelect={console.log}
                  placeholder={i18n.t('select_duration')}
                  textStyle={styles.dropdownText}
                />
              </View>
              <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/screens/ReportsManagementScreen')}>
                <ReportIcon1 style={styles.reportIcon} />
                <UrduText style={styles.reportButtonText}>{i18n.t('generate_report')}</UrduText>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.boxesContainer}>
              {Array.from({ length: Math.ceil(dashboardBoxes.length / 2) }, (_, rowIndex) => (
                <View key={rowIndex} style={styles.boxRow}>
                  {dashboardBoxes.slice(rowIndex * 2, rowIndex * 2 + 2).map((box, index) => (
                    <DashboardBox key={index} {...box} />
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
        <Pressable style={[styles.overlayButton, { bottom: insets.bottom + SPACING.lg*3, right: SPACING.xxl }]} onPress={handleAddNew}>
          <AntDesign name="plus" size={24} color={COLORS.white} />
        </Pressable>
        <Dialog
          visible={showDialog}
          onConfirm={handleMeetingSchedule}
          onCancel={handleActivitySchedule}
          onClose={() => setShowDialog(false)}
          title="کسی ایک آپشن کا انتخاب کریں."
          titleStyle={styles.titleStyle}
          confirmText="ملاقات شیڈول کریں"
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
        <UnitSelectionModal visible={showUnitSelectionModal} onClose={() => setShowUnitSelectionModal(false)} isRtl={isRtl} colorScheme={colorScheme} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles (unchanged)
const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: isDark ? '#23242D' : '#EBEBEB',
    },
    container: {
      flex: 1,
    },
    mainContainer: {
      backgroundColor: isDark ? '#23242D' : '#EBEBEB',
    },
    headerContainer: {
      paddingTop: 0,
      height: 200,
      alignItems: 'center',
      borderBottomStartRadius: 20,
      borderBottomEndRadius: 20,
      backgroundColor: isDark ? '#23242D' : '#008cff',
    },
    headerContent: {
      padding: 5,
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    headerInfoContainer: {
      flex: 1,
    },
    headerInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      color: 'white',
      fontSize: 24,
      marginHorizontal: 10,
    },
    headerIcon: {
      width: 17,
      height: 17,
    },
    locationIcon: {
      width: 13,
      height: 16,
      marginHorizontal: 10,
    },
    userIcon: {
      width: 14,
      height: 15,
      marginHorizontal: 10,
    },
    logo: {
      width: 85,
      height: 85,
      resizeMode: 'contain',
    },
    dashboardContent: {
      margin: 15,
      marginTop: 40,
      borderRadius: 10,
      backgroundColor: isDark ? '#373842' : 'transparent',
      padding: 10,
    },
    reportSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    dropdownContainer: {
      width: 150,
    },
    dropdown: {
      backgroundColor: 'transparent',
      height: 48,
    },
    dropdownText: {
      color: isDark ? '#FFB30F' : '#0BA241',
      lineHeight: 28,
      includeFontPadding: false,
      textAlignVertical: 'center',
      padding: 0,
    },
    reportButton: {
      backgroundColor: '#1E90FF',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      height: 48,
      paddingHorizontal: 15,
    },
    reportIcon: {
      width: 20,
      height: 20,
      marginStart: 10,
    },
    reportButtonText: {
      color: '#fff',
      fontSize: 16,
      lineHeight: 20,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    boxesContainer: {
      flexGrow: 1,
      paddingTop: 0,
    },
    boxRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    box: {
      backgroundColor: isDark ? '#23242D' : '#FFFFFF',
      width: '48%',
      borderRadius: 10,
      padding: 15,
    },
      overlayButton: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.medium,
    },
      titleStyle: {
      textAlign: 'left',
      color: isDark ? undefined : COLORS.black,
      fontSize: isDark ? undefined : TYPOGRAPHY.fontSize.lg,
      lineHeight: isDark ? undefined : TYPOGRAPHY.lineHeight.xl,
      fontFamily: isDark ? undefined : TYPOGRAPHY.fontFamily.bold,
    },
        confirmButtonStyle: {
      backgroundColor: COLORS.primary,
      width: '100%',
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    cancelButtonStyle: {
      width: '100%',
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    confirmTextStyle: {
      color: COLORS.white,
    },
    cancelTextStyle: {
      color: COLORS.black,
    },
    });
};

export default Dashboard;
