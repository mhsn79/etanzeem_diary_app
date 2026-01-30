import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import i18n from '@/app/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
  setDashboardSelectedUnit,
} from '@/app/features/tanzeem/tanzeemSlice';
import { selectParentUnitWithLevel } from '@/app/features/tanzeem/tanzeemSlice';
import { selectUserDetails } from '@/app/features/persons/personSlice';
import { fetchUserTanzeemiUnit } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store/types';
import UnitSelectionModal from './components/UnitSelectionModal';
import { formatUnitName } from '@/app/utils/formatUnitName';

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

const Dashboard = () => {
  const colorScheme = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - 2 * SIDE_MARGIN;
  const fullSquare = Math.floor((contentWidth - GRID_GAP) / 2);
  const squareSize = Math.floor(fullSquare * BUTTON_SIZE_SCALE);
  const buttonHeight = squareSize;
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
  const dispatch = useDispatch<AppDispatch>();

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

  useEffect(() => {
    if (userDetails && (userDetails.Tanzeemi_Unit || userDetails.unit)) {
      const unitId = userDetails.Tanzeemi_Unit || userDetails.unit;
      if (typeof unitId === 'number') {
        dispatch(fetchUserTanzeemiUnit(unitId));
      }
    }
  }, [userDetails?.id, userDetails?.Tanzeemi_Unit, userDetails?.unit]);

  useEffect(() => {
    if (userUnit && !selectedUnitId) {
      dispatch(setDashboardSelectedUnit(userUnit.id));
    }
  }, [userUnit, selectedUnitId]);

  const gridButtons = [
    { key: 'initial_info', label: i18n.t('initial_info'), color: DASHBOARD_BUTTON_COLORS.initialInfo, onPress: () => router.push('/screens/Workforce') },
    { key: 'activities', label: i18n.t('activities'), color: DASHBOARD_BUTTON_COLORS.activities, onPress: () => router.push('/screens/(tabs)/Activities') },
    { key: 'contacts', label: i18n.t('contacts'), color: DASHBOARD_BUTTON_COLORS.contacts, onPress: () => router.push('/screens/(tabs)/Arkan') },
    { key: 'money', label: i18n.t('money'), color: DASHBOARD_BUTTON_COLORS.baitulMal, onPress: () => router.push('/screens/Income') },
  ] as const;

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
              <UrduText style={styles.headerText} numberOfLines={1}>{typeof parentUnitWithLevel === 'string' ? parentUnitWithLevel : i18n.t('zone')}</UrduText>
            </View>
            <TouchableOpacity style={styles.headerRow} onPress={() => router.push('/screens/ProfileView')} activeOpacity={0.8}>
              <UserIcon style={styles.headerIcon} />
              <UrduText style={styles.headerText} numberOfLines={1}>{'ناظم: ' + (userDetails?.Name || '')}</UrduText>
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
                  style={[styles.reportsButton, { height: buttonHeight }]}
                  onPress={() => router.push('/screens/ReportsManagementScreen')}
                  activeOpacity={0.85}
                >
                  <UrduText style={styles.dashboardButtonText}>{i18n.t('reports')}</UrduText>
                </TouchableOpacity>
              </View>

              <View style={styles.gridContainer}>
                {[0, 1].map((rowIndex) => (
                  <View key={rowIndex} style={styles.gridRow}>
                    {gridButtons.slice(rowIndex * 2, rowIndex * 2 + 2).map(({ key, label, color, onPress }) => (
                      <TouchableOpacity
                        key={key}
                        style={[styles.gridButton, { backgroundColor: color, width: squareSize, height: squareSize }]}
                        onPress={onPress}
                        activeOpacity={0.85}
                      >
                        <UrduText style={styles.gridButtonText} numberOfLines={2}>{label}</UrduText>
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
  });
};

export default Dashboard;
