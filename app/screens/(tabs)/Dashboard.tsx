import React, { useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useWindowDimensions,
  Alert,
} from 'react-native';
import i18n from '@/app/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import LocationIcon from '@/assets/images/location-icon-yellow.svg';
import UserIcon from '@/assets/images/user-icon.svg';
import LeftUpArrowWhite from '@/assets/images/left-up-arrow-white.svg';
import UrduText from '@/app/components/UrduText';
import { COLORS, SPACING, BORDER_RADIUS } from '@/app/constants/theme';
import {
  selectUserUnitDetails,
  selectDashboardSelectedUnit,
  selectDashboardSelectedUnitId,
  selectUserAssignedUnits,
  setDashboardSelectedUnit,
  fetchAllAssignedUnitHierarchies,
  fetchUserTanzeemiUnit,
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectParentUnitWithLevel } from '@/app/features/tanzeem/tanzeemSlice';
import {
  selectUserDetails,
  selectNazimDetails,
  fetchNazimDetails,
  fetchContactTypes,
  selectContactTypes,
  selectContactTypesStatus,
} from '@/app/features/persons/personSlice';
import { AppDispatch } from '@/app/store/types';
import { selectPendingSubmissionCountByUnitId, fetchReportSubmissions } from '@/app/features/reports/reportsSlice';
import UnitSelectionModal from './components/UnitSelectionModal';
import { formatUnitName } from '@/app/utils/formatUnitName';
import SpeedDialFAB, { SpeedDialAction } from '@/app/components/SpeedDialFAB';
import ActivityTypePicker from '@/app/components/ActivityTypePicker';
import BaitulmalTypePicker from '@/app/components/BaitulmalTypePicker';

// Theme-aligned button colors (primary, tertiary, orange, accent)
const DASHBOARD_BUTTON_COLORS = {
  initialInfo: '#396EB0', //'#0077C0', // COLORS.primary,      // #008CFF
  activities: COLORS.tertiary,      // #0BA241
  contacts: '#0B409C',              // رابطے button
  baitulMal: '#5C6BC0',            // soft indigo, theme-friendly
} as const;

// Center gap between square boxes (smaller = boxes closer)
const GRID_GAP = 6;
// Side margins (larger = more space on left/right)
const SIDE_MARGIN = SPACING.lg;
// Scale down button size so they fit better on screen
const BUTTON_SIZE_SCALE = 0.9;
// Shorter than grid tiles so FAB can sit above tab bar without crowding
const REPORTS_BUTTON_HEIGHT_TRIM = 30;

const Dashboard = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = 'light';
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - 2 * SIDE_MARGIN;
  const fullSquare = Math.floor((contentWidth - GRID_GAP) / 2);
  const squareSize = Math.floor(fullSquare * BUTTON_SIZE_SCALE);
  const buttonHeight = squareSize;
  const reportsButtonHeight = Math.max(squareSize - REPORTS_BUTTON_HEIGHT_TRIM, 96);
  // Horizontal gap between the two boxes in a row (space-between leaves this space)
  const horizontalGap = contentWidth - 2 * squareSize;
  // Use half for vertical and horizontal gaps (was too much)
  const verticalGap = Math.floor(horizontalGap / 2);
  const rowHorizontalPadding = Math.floor(horizontalGap / 4); // makes gap between boxes = horizontalGap/2
  const styles = getStyles(colorScheme, buttonHeight, squareSize, verticalGap, SIDE_MARGIN, rowHorizontalPadding);
  const isRtl = i18n.locale === 'ur';
  const userUnit = useSelector(selectUserUnitDetails);
  const selectedUnit = useSelector(selectDashboardSelectedUnit);
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const displayUnit = selectedUnit || userUnit;
  const displayUnitId = selectedUnitId || userUnit?.id;
  const parentUnitWithLevel = useSelector(selectParentUnitWithLevel(displayUnitId || -1));
  const userDetails = useSelector(selectUserDetails);
  const nazimDetails = useSelector(selectNazimDetails);
  const dispatch = useDispatch<AppDispatch>();
  const pendingReportCount = useSelector((state: any) => selectPendingSubmissionCountByUnitId(state, displayUnitId));
  const contactTypes = useSelector(selectContactTypes);
  const contactTypesStatus = useSelector(selectContactTypesStatus);

  const umeedwarContactTypeId = useMemo(
    () => contactTypes?.find(ct => ct.type === 'umeedwar')?.id,
    [contactTypes]
  );
  const karkunContactTypeId = useMemo(
    () => contactTypes?.find(ct => ct.type === 'karkun')?.id,
    [contactTypes]
  );

  useEffect(() => {
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, contactTypesStatus]);

  // Fetch report submissions so badge stays up-to-date
  useEffect(() => {
    dispatch(fetchReportSubmissions());
  }, [dispatch, displayUnitId]);

  // Fetch Nazim details when selected unit changes
  useEffect(() => {
    if (displayUnit?.Nazim_id) {
      dispatch(fetchNazimDetails(displayUnit.Nazim_id));
    }
  }, [dispatch, displayUnit?.Nazim_id]);

  // Show Nazim name from the selected unit's Nazim, fallback to logged-in user
  const displayNazimName = nazimDetails?.Name || userDetails?.Name || '';

  const displayUnitWithLevel = useSelector((state: any) => {
    if (!displayUnit) return '';
    const levelId = displayUnit.Level_id;
    let levelName = '';
    if (levelId && typeof levelId === 'number') {
      const tanzeemState = state.tanzeem;
      if (tanzeemState?.levelsById) {
        const levelDetails = tanzeemState.levelsById[levelId];
        if (levelDetails) levelName = levelDetails.Name || '';
      }
    }
    return levelName ? `${levelName}: ${formatUnitName(displayUnit)}` : formatUnitName(displayUnit) || '';
  });

  const [showUnitSelectionModal, setShowUnitSelectionModal] = React.useState(false);
  const [activityPickerMode, setActivityPickerMode] = React.useState<'schedule' | 'report' | null>(null);
  const [baitulmalPickerCategory, setBaitulmalPickerCategory] = React.useState<'income' | 'expense' | null>(null);
  const userAssignedUnits = useSelector(selectUserAssignedUnits);

  // Fetch hierarchies for all assigned units (multi-unit support)
  useEffect(() => {
    const assignedIds = userAssignedUnits.map(u => u.id);
    if (assignedIds.length > 0) {
      dispatch(fetchAllAssignedUnitHierarchies(assignedIds));
    } else if (userDetails && (userDetails.Tanzeemi_Unit || userDetails.unit)) {
      // Fallback for legacy/single-unit case (assigned units not yet loaded)
      const unitId = userDetails.Tanzeemi_Unit || userDetails.unit;
      if (typeof unitId === 'number') {
        dispatch(fetchUserTanzeemiUnit(unitId));
      }
    }
  }, [dispatch, userAssignedUnits, userDetails]);

  useEffect(() => {
    if (userUnit && !selectedUnitId) {
      dispatch(setDashboardSelectedUnit(userUnit.id));
    }
  }, [dispatch, userUnit, selectedUnitId]);

  const gridButtons = [
    { key: 'initial_info', label: i18n.t('initial_info'), color: DASHBOARD_BUTTON_COLORS.initialInfo, onPress: () => router.push('/screens/Workforce'), fabNotch: false },
    { key: 'activities', label: i18n.t('activities'), color: DASHBOARD_BUTTON_COLORS.activities, onPress: () => (navigation as any).navigate('Activities'), fabNotch: false },
    { key: 'contacts', label: i18n.t('contacts'), color: DASHBOARD_BUTTON_COLORS.contacts, onPress: () => (navigation as any).navigate('Arkan'), fabNotch: true },
    { key: 'money', label: i18n.t('money'), color: DASHBOARD_BUTTON_COLORS.baitulMal, onPress: () => router.push('/screens/Baitulmal'), fabNotch: true },
  ] as const;

  // Speed dial is 60×60 (r=30). Notch: circle centered on the bottom-edge midpoint of the tile (same x as button
  // center), radius a bit larger than the FAB so the arc clears overlap without eating the label.
  const fabNotchRadius = useMemo(() => {
    const fabHalf = 30;
    return Math.round(fabHalf + 10 + Math.min(12, squareSize * 0.04));
  }, [squareSize]);

  // Inner corners toward FAB: Baitulmal (money) shifts toward +x, Afrad (contacts) toward -x in LTR coords.
  // With `direction: 'rtl'` on the screen, absolute `left` is mirrored — flip so notches stay inner in Urdu.
  const { fabNotchShiftMoney, fabNotchShiftContacts } = useMemo(() => {
    const h = Math.round(squareSize * 0.5);
    return isRtl
      ? { fabNotchShiftMoney: -h, fabNotchShiftContacts: h }
      : { fabNotchShiftMoney: h, fabNotchShiftContacts: -h };
  }, [squareSize, isRtl]);

  const fabActions: SpeedDialAction[] = useMemo(
    () => [
      {
        icon: 'document-text',
        label: 'رپورٹ بنائیں',
        color: COLORS.primary,
        onPress: () => (navigation as any).navigate('Reports'),
      },
      {
        icon: 'person-add',
        label: 'نیا امیدوار',
        color: DASHBOARD_BUTTON_COLORS.contacts,
        onPress: () => {
          if (!umeedwarContactTypeId) {
            Alert.alert('', 'رکن کی اقسام ابھی لوڈ نہیں ہوئیں۔ دوبارہ کوشش کریں۔');
            return;
          }
          (navigation as any).navigate('screens/RukunAddEdit', { contactTypeId: umeedwarContactTypeId });
        },
      },
      {
        icon: 'people',
        label: 'نیا کارکن',
        color: DASHBOARD_BUTTON_COLORS.contacts,
        onPress: () => {
          if (!karkunContactTypeId) {
            Alert.alert('', 'رکن کی اقسام ابھی لوڈ نہیں ہوئیں۔ دوبارہ کوشش کریں۔');
            return;
          }
          (navigation as any).navigate('screens/RukunAddEdit', { contactTypeId: karkunContactTypeId });
        },
      },
      {
        icon: 'calendar',
        label: 'سرگرمی شیڈول کریں',
        color: DASHBOARD_BUTTON_COLORS.activities,
        onPress: () => setActivityPickerMode('schedule'),
      },
      {
        icon: 'clipboard',
        label: 'سرگرمی کی رپورٹ',
        color: DASHBOARD_BUTTON_COLORS.activities,
        onPress: () => setActivityPickerMode('report'),
      },
      {
        icon: 'barbell',
        label: 'تنظیمی قوت میں اضافہ/کمی',
        color: DASHBOARD_BUTTON_COLORS.initialInfo,
        onPress: () => router.push('/screens/Workforce'),
      },
      {
        icon: 'trending-up',
        label: 'آمدنی کا اندراج',
        color: DASHBOARD_BUTTON_COLORS.baitulMal,
        onPress: () => setBaitulmalPickerCategory('income'),
      },
      {
        icon: 'trending-down',
        label: 'خرچ کا اندراج',
        color: DASHBOARD_BUTTON_COLORS.baitulMal,
        onPress: () => setBaitulmalPickerCategory('expense'),
      },
    ],
    [navigation, router, umeedwarContactTypeId, karkunContactTypeId]
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={Platform.OS === 'android'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={[styles.mainContainer, { direction: isRtl ? 'rtl' : 'ltr' }]}>
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.headerRow} onPress={() => setShowUnitSelectionModal(true)} activeOpacity={0.8}>
              <LeftUpArrowWhite style={styles.headerIcon} />
              <UrduText style={styles.headerText} numberOfLines={1}>{displayUnitWithLevel || i18n.t('unit')}</UrduText>
            </TouchableOpacity>
            <View style={styles.headerRow}>
              <LocationIcon style={styles.headerIcon} />
              <UrduText style={styles.headerText} numberOfLines={1}>{(typeof parentUnitWithLevel === 'string' && parentUnitWithLevel) ? parentUnitWithLevel : i18n.t('zone')}</UrduText>
            </View>
            <TouchableOpacity style={styles.headerRow} onPress={() => router.push('/screens/ProfileView')} activeOpacity={0.8}>
              <UserIcon style={styles.headerIcon} />
              <UrduText style={styles.headerText} numberOfLines={1}>{'ناظم: ' + displayNazimName}</UrduText>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.reportsButtonWrapper}>
                <TouchableOpacity
                  style={[styles.reportsButton, { height: reportsButtonHeight }]}
                  onPress={() => (navigation as any).navigate('Reports')}
                  activeOpacity={0.85}
                >
                  <UrduText style={styles.dashboardButtonText}>{i18n.t('reports')}</UrduText>
                  {pendingReportCount > 0 && (
                    <View style={styles.pendingBadge}>
                      <UrduText style={styles.pendingBadgeText}>
                        {pendingReportCount} جمع کروانا باقی ہے
                      </UrduText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.gridContainer}>
                {[0, 1].map((rowIndex) => (
                  <View key={rowIndex} style={styles.gridRow}>
                    {gridButtons.slice(rowIndex * 2, rowIndex * 2 + 2).map(({ key, label, color, onPress, fabNotch }) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.gridButton,
                          fabNotch && styles.gridButtonFabNotch,
                          { backgroundColor: color, width: squareSize, height: squareSize },
                        ]}
                        onPress={onPress}
                        activeOpacity={0.85}
                      >
                        <UrduText style={styles.gridButtonText} numberOfLines={2}>{label}</UrduText>
                        {fabNotch && (
                          <View
                            pointerEvents="none"
                            style={[
                              styles.fabNotchCircle,
                              styles.fabNotchFill,
                              {
                                width: fabNotchRadius * 2,
                                height: fabNotchRadius * 2,
                                borderRadius: fabNotchRadius,
                                left:
                                  squareSize / 2 -
                                  fabNotchRadius +
                                  (key === 'money' ? fabNotchShiftMoney : fabNotchShiftContacts),
                                top: squareSize - fabNotchRadius,
                              },
                            ]}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <UnitSelectionModal
          visible={showUnitSelectionModal}
          onClose={() => setShowUnitSelectionModal(false)}
          isRtl={isRtl}
          colorScheme={colorScheme}
        />
        
        <SpeedDialFAB actions={fabActions} />

        <ActivityTypePicker
          visible={activityPickerMode !== null}
          mode={activityPickerMode || 'schedule'}
          onSelect={(activityTypeId, reportMonth, reportYear) => {
            const m = activityPickerMode!;
            setActivityPickerMode(null);
            router.push({ pathname: '/screens/ActivityScreen', params: { mode: m, activityType: activityTypeId, reportMonth, reportYear } });
          }}
          onCancel={() => setActivityPickerMode(null)}
        />

        <BaitulmalTypePicker
          visible={baitulmalPickerCategory !== null}
          category={baitulmalPickerCategory || 'income'}
          onSelect={(typeId, reportMonth, reportYear) => {
            const cat = baitulmalPickerCategory!;
            setBaitulmalPickerCategory(null);
            router.push({ pathname: '/screens/BaitulmalScreen', params: { mode: cat, baitulmalType: typeId, reportMonth, reportYear } });
          }}
          onCancel={() => setBaitulmalPickerCategory(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (
  colorScheme: string | null | undefined,
  _buttonHeight: number,
  _squareSize: number,
  verticalGap: number,
  sideMargin: number,
  rowHorizontalPadding: number
) => {
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
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.md,
      alignItems: 'center',
      borderBottomStartRadius: 20,
      borderBottomEndRadius: 20,
      backgroundColor: isDark ? '#23242D' : COLORS.primary,
    },
    headerRow: {
      flexDirection: 'row',
      paddingVertical: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    headerIcon: {
      width: 18,
      height: 18,
    },
    headerText: {
      color: COLORS.white,
      fontSize: 22,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      minHeight: 200,
      marginHorizontal: sideMargin,
      paddingTop: SPACING.lg,
      backgroundColor: isDark ? '#23242D' : '#EBEBEB',
    },
    scrollView: {
      flex: 1,
      minHeight: 0,
    },
    scrollContent: {
      paddingBottom: SPACING.xl,
    },
    reportsButtonWrapper: {
      paddingHorizontal: rowHorizontalPadding,
      marginBottom: verticalGap,
    },
    reportsButton: {
      width: '100%',
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primary,
    },
    gridContainer: {
      flexDirection: 'column',
    },
    gridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: verticalGap,
      paddingHorizontal: rowHorizontalPadding,
    },
    gridButton: {
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.xs,
      position: 'relative',
    },
    gridButtonFabNotch: {
      overflow: 'hidden',
    },
    fabNotchCircle: {
      position: 'absolute',
    },
    fabNotchFill: {
      backgroundColor: isDark ? '#23242D' : '#EBEBEB',
    },
    dashboardButtonText: {
      color: COLORS.white,
      fontSize: 30,
      includeFontPadding: false,
    },
    gridButtonText: {
      color: COLORS.white,
      fontSize: 30,
      includeFontPadding: false,
      textAlign: 'center',
    },
    pendingBadge: {
      position: 'absolute',
      bottom: 12,
      backgroundColor: 'rgba(255,255,255,0.25)',
      paddingHorizontal: 12,
      paddingVertical: 3,
      borderRadius: 12,
    },
    pendingBadgeText: {
      color: COLORS.white,
      fontSize: 14,
      includeFontPadding: false,
    },
  });
};

export default Dashboard;
