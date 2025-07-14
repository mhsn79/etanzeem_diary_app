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
  selectUserUnitDetails,
  selectUserUnitStatus,
  selectUserUnitError,
  selectUserTanzeemiLevelStatus,
  fetchUserTanzeemiUnit,
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
  setDashboardSelectedUnit,
} from '@/app/features/tanzeem/tanzeemSlice';
import {
  selectAllHierarchyUnits,
  selectParentUnitWithLevel
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectUserDetails } from '@/app/features/persons/personSlice';
import { AppDispatch } from '@/app/store';
import HeaderInfoItem from './components/HeaderInfoItem';
import ScheduleCard from './components/ScheduleCard';
import UnitSelectionModal from './components/UnitSelectionModal';
import DashboardBox from './components/DashboardBox';
import { debugLog } from '@/app/utils/debug';

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
  const userUnit = useSelector(selectUserUnitDetails);
  const selectedUnit = useSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  // const userUnitStatus = useSelector(selectUserUnitStatus);
  // const userUnitError = useSelector(selectUserUnitError);

  // Use selected unit if available, otherwise fall back to user unit
  const displayUnit = selectedUnit || userUnit;
  const displayUnitId = selectedUnitId || userUnit?.id;

  const parentUnitWithLevel = useSelector(selectParentUnitWithLevel(displayUnitId || -1));
  // const nazimDetails = useSelector(selectNazimDetails);
  const userDetails = useSelector(selectUserDetails);
  
  // Get display unit with level name
  const displayUnitWithLevel = useSelector((state: any) => {
    if (!displayUnit) return '';
    
    // Get the level information for the display unit
    const levelId = displayUnit.Level_id;
    let levelName = '';
    
    if (levelId && typeof levelId === 'number') {
      // Try to get level name from the levelsById storage
      const tanzeemState = state.tanzeem;
      if (tanzeemState && tanzeemState.levelsById) {
        const levelDetails = tanzeemState.levelsById[levelId];
        if (levelDetails) {
          levelName = levelDetails.Name || '';
        }
      }
    }
    
    // Format: "Level Name: Unit Name" or just "Unit Name" if no level
    return levelName ? `${levelName}: ${displayUnit.Name}` : displayUnit.Name || '';
  });
  const dispatch = useDispatch<AppDispatch>();
  const [showDialog, setShowDialog] = useState(false);
  const [showUnitSelectionModal, setShowUnitSelectionModal] = useState(false);

  // Fetch user's tanzeemi unit when component mounts
  useEffect(() => {
    if (userDetails && (userDetails.Tanzeemi_Unit || userDetails.unit)) {
      const unitId = userDetails.Tanzeemi_Unit || userDetails.unit;
      if (typeof unitId === 'number') {
        console.log('Dashboard: Fetching user tanzeemi unit with ID:', unitId);
        dispatch(fetchUserTanzeemiUnit(unitId));
      }
    }
  }, [userDetails?.id, userDetails?.Tanzeemi_Unit, userDetails?.unit, dispatch]);



  // Initialize dashboard selected unit to user unit when user unit is loaded
  useEffect(() => {
    if (userUnit && !selectedUnitId) {
      console.log('Dashboard: Initializing selected unit to user unit:', userUnit.id);
      dispatch(setDashboardSelectedUnit(userUnit.id));
    }
  }, [userUnit, selectedUnitId, dispatch]);

  // Get parent unit for display unit
  const parentUnit = useSelector((state: any) => {
    if (!displayUnit || !displayUnit.Parent_id) return null;
    return state.tanzeem.entities[displayUnit.Parent_id];
  });

  // Get grandparent unit for parent unit
  const grandparentUnit = useSelector((state: any) => {
    if (!parentUnit || !parentUnit.Parent_id) return null;
    return state.tanzeem.entities[parentUnit.Parent_id];
  });

  // Fetch parent unit if not available when display unit changes
  useEffect(() => {
    if (displayUnit && displayUnit.Parent_id && !parentUnit) {
      const parentId = displayUnit.Parent_id;
      console.log('Dashboard: Fetching parent unit:', parentId);
      dispatch(fetchUserTanzeemiUnit(parentId));
    }
  }, [displayUnit, parentUnit, dispatch]);

  // Fetch grandparent unit if not available when parent unit changes
  useEffect(() => {
    if (parentUnit && parentUnit.Parent_id && !grandparentUnit) {
      const grandparentId = parentUnit.Parent_id;
      console.log('Dashboard: Fetching grandparent unit:', grandparentId);
      dispatch(fetchUserTanzeemiUnit(grandparentId));
    }
  }, [parentUnit, grandparentUnit, dispatch]);



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

  debugLog('Dashboard User Details:', userDetails);
  // debugLog('Dashboard User Unit Status:', userUnitStatus);
  // debugLog('Dashboard User Unit Error:', userUnitError);
  // debugLog('Dashboard Nazim Details:', nazimDetails);
  debugLog('Dashboard Parent Unit With Level:', parentUnitWithLevel);
  debugLog('Dashboard Parent Unit:', parentUnit);
  debugLog('Dashboard Grandparent Unit:', grandparentUnit);

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
                  text={displayUnitWithLevel}
                  icon={LeftUpArrowWhite}
                  iconProps={{ style: styles.headerIcon }}
                  textStyle={styles.headerTitle}
                  onPress={() => setShowUnitSelectionModal(true)}
                  colorScheme={colorScheme}
                  isLeftUpArrowWhite
                />
                <HeaderInfoItem
                  text={typeof parentUnitWithLevel === 'string' ? parentUnitWithLevel : i18n.t('zone')}
                  icon={LocationIcon}
                  iconProps={{ style: styles.locationIcon }}
                  colorScheme={colorScheme}
                />
                <HeaderInfoItem
                  text={"ناظم کا نام: " + userDetails?.Name || ''}
                  icon={UserIcon}
                  iconProps={{ style: styles.userIcon }}
                  onPress={() => router.push('/screens/ProfileView')}
                  colorScheme={colorScheme}
                />
              </View>
            </View>
            <ScheduleCard
              scheduleLength={4}
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
                  dropdownContainerStyle={styles.dropdownContainerStyle}
                  listWrapperStyle={styles.dropdownListWrapper}
                  isRtl={isRtl}
                />
              </View>
              <TouchableOpacity style={styles.reportButton} onPress={() => router.push('/screens/ReportsManagementScreen')}>
                <ReportIcon1 style={styles.reportIcon} />
                <UrduText style={styles.reportButtonText}>{i18n.t('generate_report')}</UrduText>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              nestedScrollEnabled={true}
              bounces={Platform.OS === 'ios'}
              showsVerticalScrollIndicator={true}
            >
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

// Styles
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
      flex: 1,
      backgroundColor: isDark ? '#23242D' : '#EBEBEB',
    },
    headerContainer: {
      paddingTop: 0,
      height: SPACING.lg*6.5,
      alignItems: 'center',
      borderBottomStartRadius: 20,
      borderBottomEndRadius: 20,
      backgroundColor: isDark ? '#23242D' : COLORS.primary,
    },
    headerContent: {
      paddingHorizontal: 10,
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
      marginHorizontal: 6,
    },
    userIcon: {
      width: 14,
      height: 15,
      marginHorizontal: 6,
    },
    logo: {
      width: 85,
      height: 85,
      resizeMode: 'contain',
    },
    dashboardContent: {
      flex: 1,
      marginHorizontal: SPACING.sm,
      borderRadius: 10,
      backgroundColor: isDark ? '#333842' : 'transparent',
      padding: 10,
    },
    reportSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginTop: SPACING.lg,
      marginBottom: SPACING.md,
    },
    dropdownContainer: {
      width: 150,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownStyle: {
      height: 36,
    },
    dropdown: {
      height: 36,
    },
    dropdownText: {
      color: isDark ? '#FFB30F' : '#333333',
      lineHeight: 28,
      padding: 0,
    },
    dropdownContainerStyle: {
      width: '100%',
      height: 55,
      borderRadius: 10,
      marginBottom: SPACING.md,
      backgroundColor: COLORS.lightGray,
    },
    dropdownListWrapper: {
      backgroundColor: COLORS.white,
      borderRadius: BORDER_RADIUS.lg,
      left:20,
      borderWidth: 1,
      borderColor: COLORS.lightGray,
      ...SHADOWS.small,
    },
    reportButton: {
      backgroundColor: COLORS.primary,
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
      marginRight: 10,
    },
    reportButtonText: {
      color: '#fff',
      fontSize: 16,
      lineHeight: 20,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
      minHeight: '100%',
      paddingBottom: SPACING.xl,
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
      borderStyle: 'solid',
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