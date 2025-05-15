import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar, useColorScheme, Pressable, ActivityIndicator } from 'react-native';
import i18n from '@/app/i18n';
import CustomDropdown from "@/app/components/CustomDropdown";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import Spacer from '@/app/components/Spacer';
import SmallTarazu from "@/assets/images/small-tarazu.svg";
import LocationIcon from "@/assets/images/location-icon-yellow.svg";
import UserIcon from "@/assets/images/user-icon.svg";
import ReportIcon1 from "@/assets/images/report-icon-1.svg";
import LeftUpArrowWhite from "@/assets/images/left-up-arrow-white.svg";
import LeftUpArrowBlue from "@/assets/images/left-up-arrow-blue.svg";
import UrduText from '@/app/components/UrduText';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS, TYPOGRAPHY } from '@/app/constants/theme';
import { AntDesign } from '@expo/vector-icons';
import Dialog from '@/app/components/Dialog';
import { 
    selectAllHierarchyUnits,
  selectUserUnitDetails, 
  selectUserUnitStatus, 
  selectUserUnitError,
  selectUserTanzeemiLevelDetails,
  selectUserTanzeemiLevelStatus
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectNazimDetails } from '@/app/features/persons/personSlice';

// Reusable components
const HeaderInfoItem = ({ 
  icon: Icon, 
  text, 
  onPress, 
  iconProps = {}, 
  textStyle = {}, 
  styles 
}: { 
  icon: React.FC<any>; 
  text: string; 
  onPress?: () => void; 
  iconProps?: any; 
  textStyle?: any;
  styles: any;
}) => {
  const isClickable = !!onPress;
  const Container = isClickable ? TouchableOpacity : View;
  const isLeftUpArrowWhite = Icon === LeftUpArrowWhite;
  
  return (
    <Container onPress={isClickable ? onPress : undefined}>
      <View style={styles.headerInfoItem}>
        {!isLeftUpArrowWhite && Icon && (
          <>
            <Icon {...iconProps} />
            <Spacer width={8} />
          </>
        )}
        <UrduText style={[styles.headerInfoText, textStyle]}>{text}</UrduText>
        {isLeftUpArrowWhite && (
          <>
            <Spacer width={8} />
            <Icon {...iconProps} />
          </>
        )}
        <Spacer height={10} width={isClickable ? "100%" : undefined} />
      </View>
    </Container>
  );
};

interface ScheduleItemProps {
  item: {
    eventName: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    type: string;
  };
  index: number;
  colorScheme: string | null | undefined;
  styles: any;
}

const ScheduleItem = ({ item, index, colorScheme, styles }: ScheduleItemProps) => {
  const textColor = { color: colorScheme === "dark" ? "white" : "black" };
  
  return (
    <TouchableOpacity key={index} onPress={() => console.log(item)}>
      <View style={styles.scheduleItemContainer}>
        <Text style={textColor}>{index + 1}</Text>
        <Text style={textColor}>{item.eventName}</Text>
        <Text style={textColor}>{item.startTime}</Text>
        <Text style={textColor}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface StatRowProps {
  label: string;
  value: string;
  styles: any;
}

const StatRow = ({ label, value, styles }: StatRowProps) => (
  <View style={styles.statRow}>
    <UrduText style={styles.boxContent}>{label}</UrduText>
    <UrduText style={styles.boxContent}>{value}</UrduText>
  </View>
);

interface DashboardBoxProps {
  title: string;
  stats: Array<{ label: string; value: string }>;
  onPress: () => void;
  isRtl: boolean;
  styles: any;
}

const DashboardBox = ({ title, stats, onPress, isRtl, styles }: DashboardBoxProps) => {
  return (
    <View style={styles.box}>
      <View style={styles.boxHeader}>
        <TouchableOpacity onPress={onPress}>
          <UrduText kasheedaStyle={true} style={styles.boxTitle}>{title}</UrduText>
        </TouchableOpacity>
        <LeftUpArrowBlue style={{ transform: [{ rotateY: isRtl ? "0deg" : "180deg" }] }} />
      </View>
      {stats.map((stat: { label: string; value: string }, index: number) => (
        <StatRow key={index} label={stat.label} value={stat.value} styles={styles} />
      ))}
    </View>
  );
};

const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const isRtl = i18n.locale === 'ur';
  const dispatch = useDispatch();
  
  // Redux state selectors
  const userUnit = useSelector(selectUserUnitDetails);
  const userUnitStatus = useSelector(selectUserUnitStatus);
  const userUnitError = useSelector(selectUserUnitError);
  const userTanzeemLevel = useSelector(selectUserTanzeemiLevelDetails);
  const userTanzeemLevelStatus = useSelector(selectUserTanzeemiLevelStatus);
  const hierarchyUnits = useSelector(selectAllHierarchyUnits);
  const nazimDetaiils=useSelector(selectNazimDetails);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);
  const [direction, setDirection] = useState(isRtl ? 'rtl' : 'ltr');
  const [showDialog, setShowDialog] = useState(false);

 console.log('Dashboard component loaded hierarchyUnits',hierarchyUnits);
 
  // Log when user unit data changes
  useEffect(() => {
    console.log('Dashboard: User unit status:', userUnitStatus);
    if (userUnitStatus === 'succeeded') {
      console.log('Dashboard: User unit details:', userUnit);
    } else if (userUnitStatus === 'failed') {
      console.error('Dashboard: Error fetching user unit:', userUnitError);
    }
  }, [userUnitStatus, userUnit, userUnitError]);
  
  // Log when tanzeemi level data changes
  useEffect(() => {
    console.log('Dashboard: User tanzeemi level status:', userTanzeemLevelStatus);
    if (userTanzeemLevelStatus === 'succeeded') {
      console.log('Dashboard: User tanzeemi level details:', userTanzeemLevel);
    }
  }, [userTanzeemLevelStatus, userTanzeemLevel]);
  
  // Log when hierarchy units data changes
  useEffect(() => {
    console.log('Dashboard component loaded hierarchyUnits', hierarchyUnits);
  }, [hierarchyUnits]);

  // Mock data
  const scheduleForToday = [
    { "eventName": "Event 1", "startTime": "10:00 AM", "endTime": "12:00 PM", "location": "Room 101", "description": "Description for Event 1", "type": "type-1" },
    { "eventName": "Event 2", "startTime": "2:00 PM", "endTime": "4:00 PM", "location": "Room 102", "description": "Description for Event 2", "type": "type-2" },
    { "eventName": "Event 3", "startTime": "5:00 PM", "endTime": "7:00 PM", "location": "Room 103", "description": "Description for Event 3", "type": "type-3" },
    { "eventName": "Event 4", "startTime": "8:00 PM", "endTime": "10:00 PM", "location": "Room 104", "description": "Description for Event 4", "type": "type-4" },
    { "eventName": "Event 5", "startTime": "11:00 PM", "endTime": "1:00 AM", "location": "Room 105", "description": "Description for Event 5", "type": "type-5" }
  ];

  const durationItemNames = [
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

  // Dashboard boxes data
  const dashboardBoxes = [
    {
      title: i18n.t('workforce'),
      onPress: () => router.push("/screens/Workforce"),
      stats: [
        { label: i18n.t('arkan'), value: '50' },
        { label: i18n.t('increase'), value: '5' },
        { label: i18n.t('target'), value: '10' }
      ]
    },
    {
      title: i18n.t('sub_units'),
      onPress: () => router.push("/screens/UnitSelection"),
      stats: [
        { label: i18n.t('wards'), value: '5' },
        { label: '-', value: '-' },
        { label: '-', value: '-' }
      ]
    },
    {
      title: i18n.t('activities'),
      onPress: () => router.push("/screens/Activities"),
      stats: [
        { label: i18n.t('organizational'), value: '1' },
        { label: i18n.t('invitational'), value: '1' },
        { label: i18n.t('training'), value: '1' }
      ]
    },
    {
      title: i18n.t('upper_management'),
      onPress: () => router.push("/screens/UnitSelection"),
      stats: [
        { label: i18n.t('activities'), value: '1' },
        { label: i18n.t('participation'), value: '1' },
        { label: '-', value: '-' }
      ]
    },
    {
      title: i18n.t('visits'),
      onPress: () => router.push("/screens/Meetings"),
      stats: [
        { label: '-', value: i18n.t('meetings') },
        { label: '-', value: '-' },
        { label: '-', value: '-' }
      ]
    },
    {
      title: i18n.t('money'),
      onPress: () => router.push("/screens/Income"),
      stats: [
        { label: '0', value: i18n.t('income') },
        { label: '0', value: i18n.t('expenses') },
        { label: '-', value: '-' }
      ]
    }
  ];

  // Format the date as "February 23, 2025"
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar hidden />
      
      <View style={[styles.mainContainer, { direction: isRtl ? 'rtl' : 'ltr' }]}>
        {/* Header section */}
        <View style={styles.headerContainer}>
          {/* Logo and info section */}
          <View style={styles.headerContent}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
            <View style={styles.headerInfoContainer}>
              <HeaderInfoItem 
                text={userUnit?.Name||''} 
                icon={LeftUpArrowWhite} 
                iconProps={{ style: styles.headerIcon }} 
                textStyle={styles.headerTitle}
                onPress={() => router.push("/screens/UnitSelection")}
                styles={styles}
              />
              <HeaderInfoItem 
                text={(() => {
                  // Skip the first unit and get all remaining unit names in Urdu format
                  const unitNames = hierarchyUnits && hierarchyUnits.length > 1 
                    ? hierarchyUnits.slice(1).map(unit => unit.Name || unit.name).filter(Boolean)
                    : [];
                  
                  // Join with Urdu comma separator
                  const joinedNames = unitNames.join('، ');
                  
                  // If the text is too long, truncate it
                  return joinedNames.length > 0 
                    ? (joinedNames.length > 30 
                        ? joinedNames.substring(0, 27) + '...' 
                        : joinedNames)
                    : i18n.t('zone');
                })()} 
                icon={LocationIcon} 
                iconProps={{ style: styles.locationIcon }} 
                styles={styles}
              />
              <HeaderInfoItem 
                text={nazimDetaiils?.Name||''} 
                icon={UserIcon} 
                iconProps={{ style: styles.userIcon }} 
                onPress={() => router.push("/screens/ProfileView")}
                styles={styles}
              />
            </View>
          </View>
          
          {/* Schedule section */}
          <View style={styles.scheduleContainer}>
            <View style={styles.scheduleCard}>
              {/* Schedule Header */}
              <View style={styles.scheduleHeader}>
                <UrduText style={styles.scheduleText}>{i18n.t("schedule_for_today")}</UrduText>
                <TouchableOpacity onPress={() => router.push("/screens/Activities")}>
                  <UrduText style={styles.scheduleText}>{i18n.t('view-all')}</UrduText>
                </TouchableOpacity>
                <UrduText style={styles.scheduleText}>{formattedDate}</UrduText>
              </View>
              
              {/* Schedule List */}
              <ScrollView>
                {scheduleForToday.map((item, index) => (
                  <ScheduleItem 
                    key={index} 
                    item={item} 
                    index={index} 
                    colorScheme={colorScheme} 
                    styles={styles}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Dashboard content */}
        <View style={styles.dashboardContent}>
          {/* Duration dropdown and report button */}
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
            <TouchableOpacity 
              style={styles.reportButton} 
              onPress={() => router.push("/screens/ReportsManagementScreen")}
            >
              <ReportIcon1 style={styles.reportIcon} />
              <UrduText style={styles.reportButtonText}>{i18n.t('generate_report')}</UrduText>
            </TouchableOpacity>
          </View>

          {/* Dashboard boxes */}
          <ScrollView contentContainerStyle={styles.boxesContainer}>  
                {/* First row */}
                <View style={styles.boxRow}>
                  <DashboardBox {...dashboardBoxes[0]} isRtl={isRtl} styles={styles} />
                  <DashboardBox {...dashboardBoxes[1]} isRtl={isRtl} styles={styles} />
                </View>
                
                {/* Second row */}
                <View style={styles.boxRow}>
                  <DashboardBox {...dashboardBoxes[2]} isRtl={isRtl} styles={styles} />
                  <DashboardBox {...dashboardBoxes[3]} isRtl={isRtl} styles={styles} />
                </View>
                
                {/* Third row */}
                <View style={styles.boxRow}>
                  <DashboardBox {...dashboardBoxes[4]} isRtl={isRtl} styles={styles} />
                  <DashboardBox {...dashboardBoxes[5]} isRtl={isRtl} styles={styles} />
                </View>
          </ScrollView>
        </View>
      </View>

      {/* Floating Action Button */}
      <Pressable
        style={[styles.overlayButton, { bottom: insets.bottom + SPACING.xl, right: SPACING.xl }]}
        onPress={handleAddNew}
      >
        <AntDesign name="plus" size={24} color={COLORS.white} />
      </Pressable>

      {/* Schedule Dialog */}
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
        lowerRightIcon={true}
        upperRightIcon={true}
        confirmButtonStyle={styles.confirmButtonStyle}
        cancelButtonStyle={styles.cancelButtonStyle}
        confirmTextStyle={styles.confirmTextStyle}
        cancelTextStyle={styles.cancelTextStyle}
      />
    </KeyboardAvoidingView>
  );
};

// Styles with theme support
const getStyles = (colorScheme: string | null | undefined) => {
  const isDark = colorScheme === 'dark';
  
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    mainContainer: {
      backgroundColor: isDark ? "#23242D" : "#EBEBEB",
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    headerInfoContainer: {
      flex: 1,
    },
    headerInfoItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerInfoText: {
      color: "white",
      fontSize: 18,
    },
    headerTitle: {
      color: "white",
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
    scheduleContainer: {
      position: "absolute",
      padding: 5,
      marginTop: 130,
      width: "100%",
    },
    scheduleCard: {
      backgroundColor: isDark ? "#008cff" : "#FFFFFF",
      height: 100,
      borderRadius: 15,
      width: "100%",
      padding: 5,
    },
    scheduleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
    },
    scheduleText: {
      color: isDark ? "white" : "black",
    },
    scheduleItemContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
    },
    dashboardContent: {
      margin: 15,
      marginTop: 40,
      borderRadius: 10,
      backgroundColor: isDark ? "#373842" : 'transparent',
      padding: 10,
    },
    reportSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: "center",
      width: "100%",
    },
    dropdownContainer: {
      width: 150,
    },
    dropdown: {
      backgroundColor: "transparent",
      height: 48,
    },
    dropdownText: {
      color: isDark ? "#FFB30F" : "#0BA241",
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
      backgroundColor: isDark ? '#23242D' : "#FFFFFF",
      width: '48%',
      borderRadius: 10,
      padding: 15,
    },
    boxHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    boxTitle: {
      color: isDark ? '#fff' : '#1E90FF',
      fontWeight: 'regular',
      fontSize: 16,
      marginBottom: 5,
    },
    boxContent: {
      color: isDark ? '#575862' : '#000',
      fontSize: 14,
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
