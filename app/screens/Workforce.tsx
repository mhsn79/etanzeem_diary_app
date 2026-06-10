import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  AccessibilityProps,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
  TextInput
} from 'react-native';
import Modal from 'react-native-modal';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// We'll use Vibration API from React Native instead of external packages
import { Vibration } from 'react-native';

// SVG Icons
import UnitSelectorBar from '@/src/components/UnitSelectorBar';
import NoUnitMessage from '@/src/components/NoUnitMessage';
import EditIcon from '../../assets/images/edit-icon.svg';
import ModalCloseIcon from '../../assets/images/modal-close-icon.svg';

// Components
import CustomButton from '@/src/components/CustomButton';
import UrduText from '@/src/components/UrduText';

// Redux
import { 
  fetchPersonsByUnit, 
  selectAllPersons, 
  selectPersonsStatus, 
  selectPersonsError,
  fetchContactTypes,
  selectContactTypes,
  selectContactTypesStatus,
  selectContactTypesError
} from '@/src/features/persons/personSlice';
import {
  refreshStrengthData,
  setUserUnitId,
  setCurrentPeriod,
  selectStrengthTypes,
  selectStrengthByCategory,
  selectCurrentMonthRecordsByType,
  selectCarryForwardTotals,
  upsertStrengthRecord,
  fetchPreviousTotalForType,
  selectUserUnitId,
  selectCurrentYear,
  selectCurrentMonth,
  StrengthRecord,
} from '@/src/features/strength/strengthSlice';
import { AppDispatch } from '@/src/store/types';
import { selectDashboardSelectedUnitId, selectUserUnitDetails, selectAllTanzeemiUnits } from '@/src/features/tanzeem/tanzeemSlice';
import { getUrduMonth } from '@/src/constants/urduLocalization';

// Theme and constants
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES, SHADOWS, Z_INDEX, ANIMATION } from '@/src/constants/theme';
import i18n from '@/src/i18n';
import { startNavigationMetric } from '@/src/utils/navigationMetrics';

// Types
interface EditModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  typeId: number;
  existingRecord: StrengthRecord | null; // Current month's record if exists
  previousTotal: number; // Carried forward from prior month
  year: number;
  month: number;
  onSaved: () => void;
}

interface WorkforceItemProps extends AccessibilityProps {
  label: string;
  value: number;
  onEdit: () => void;
  typeId?: number;
  editable?: boolean;
}

/**
 * EditModal Component
 *
 * Shows both اضافہ (increase) and کمی (decrease) inputs simultaneously
 * with auto-calculated new total
 */
function EditModal({
  visible,
  setVisible,
  title,
  typeId,
  existingRecord,
  previousTotal: previousTotalProp,
  year,
  month,
  onSaved,
}: EditModalProps) {
  const [plusInput, setPlusInput] = useState('');
  const [minusInput, setMinusInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const { width } = useWindowDimensions();
  const dispatch = useDispatch<AppDispatch>();
  const userUnitId = useSelector(selectUserUnitId);
  const [saving, setSaving] = useState(false);
  const [livePreviousTotal, setLivePreviousTotal] = useState(previousTotalProp);
  const [loadingPrevTotal, setLoadingPrevTotal] = useState(false);

  const plusValue = useMemo(() => {
    const parsed = parseInt(plusInput, 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [plusInput]);

  const minusValue = useMemo(() => {
    const parsed = parseInt(minusInput, 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [minusInput]);

  const newTotal = useMemo(() => {
    return Math.max(0, livePreviousTotal + plusValue - minusValue);
  }, [livePreviousTotal, plusValue, minusValue]);

  // Handle numeric-only input
  const handleNumericInput = useCallback((text: string, setter: (v: string) => void) => {
    if (/^\d*$/.test(text)) {
      setter(text);
    }
  }, []);

  // Spinner increment/decrement
  const handleIncrement = useCallback((setter: (v: string) => void, currentVal: number) => {
    setter(String(currentVal + 1));
  }, []);

  const handleDecrement = useCallback((setter: (v: string) => void, currentVal: number) => {
    if (currentVal > 0) {
      setter(String(currentVal - 1));
    }
  }, []);

  // Fetch fresh previousTotal AND auto-create Strength_Record if missing
  useEffect(() => {
    if (visible && typeId) {
      setLoadingPrevTotal(true);
      setLivePreviousTotal(previousTotalProp); // Show prop value immediately as fallback
      dispatch(fetchPreviousTotalForType({ typeId, year, month }))
        .unwrap()
        .then(result => {
          setLivePreviousTotal(result.previousTotal);
        })
        .catch(() => {
          // Keep the prop fallback
        })
        .finally(() => setLoadingPrevTotal(false));

      // Auto-create the Strength_Record if it doesn't exist yet.
      // This ensures carry-forward values are persisted even when user
      // opens the dialog but makes no plus/minus changes.
      if (!existingRecord && userUnitId) {
        import('@/src/features/strength/strengthSync')
          .then(({ getOrCreateStrengthRecord }) =>
            getOrCreateStrengthRecord(userUnitId, typeId, year, month)
          )
          .then(() => {
            // Refresh records so the parent list picks up the new row
            dispatch(refreshStrengthData({ year, month }));
          })
          .catch(err =>
            console.warn('[Workforce] Auto-create strength record failed:', err)
          );
      }
    }
  }, [visible, typeId, year, month, dispatch, previousTotalProp, existingRecord, userUnitId]);

  // Pre-populate from existing record when modal opens
  useEffect(() => {
    if (visible) {
      if (existingRecord) {
        setPlusInput(existingRecord.plus_value > 0 ? String(existingRecord.plus_value) : '');
        setMinusInput(existingRecord.minus_value > 0 ? String(existingRecord.minus_value) : '');
        setNotesInput(existingRecord.notes || '');
      } else {
        setPlusInput('');
        setMinusInput('');
        setNotesInput('');
      }
    }
  }, [visible, existingRecord]);

  const handleSave = useCallback(async () => {
    if (!typeId || !userUnitId) return;

    setSaving(true);
    try {
      await dispatch(upsertStrengthRecord({
        typeId,
        plus_value: plusValue,
        minus_value: minusValue,
        year,
        month,
        notes: notesInput.trim() || undefined,
      })).unwrap();

      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 50, 50, 50]);
      }

      onSaved();
      setVisible(false);
    } catch (error) {
      console.error('Failed to save strength record:', error);
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 100, 50, 100]);
      }
    } finally {
      setSaving(false);
    }
  }, [typeId, userUnitId, plusValue, minusValue, notesInput, year, month, dispatch, onSaved, setVisible]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  // Always allow saving — even with 0 changes, this persists the carry-forward
  // record so the value propagates to future months correctly.
  const isDisabled = false;

  return (
    <Modal
      isVisible={visible}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={ANIMATION.duration.normal}
      animationOutTiming={ANIMATION.duration.normal}
      useNativeDriver={true}
      coverScreen={true}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      statusBarTranslucent={true}
      backdropOpacity={0.6}
      deviceHeight={Dimensions.get('screen').height}
      style={styles.modalContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ width: width * 0.9 }}
      >
        <View style={styles.modalCard}>
          {/* Header with title and month/year */}
          <View style={styles.modalHeader}>
            <UrduText style={styles.modalTitle}>{title}</UrduText>
            <UrduText style={styles.modalSubtitle}>
              {getUrduMonth(month)} {year}
            </UrduText>
            <Pressable
              onPress={handleClose}
              style={styles.modalCloseButton}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('close')}
            >
              <ModalCloseIcon height={24} width={24} color={COLORS.white} />
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            {/* Previous Total (read-only, freshly fetched) */}
            <View style={styles.fieldRow}>
              <UrduText style={styles.fieldRowLabel}>پچھلی تعداد</UrduText>
              {loadingPrevTotal ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.fieldRowValue}>{livePreviousTotal}</Text>
              )}
            </View>

            {/* Increase Input (اضافہ) with spinner */}
            <View style={styles.fieldRow}>
              <UrduText style={[styles.fieldRowLabel, styles.positiveValue]}>اضافہ (+)</UrduText>
              <View style={[styles.spinnerWrapper, { borderColor: COLORS.success }]}>
                <Pressable
                  style={[styles.spinnerBtn, { backgroundColor: COLORS.success }]}
                  onPress={() => handleIncrement(setPlusInput, plusValue)}
                  accessibilityLabel="اضافہ بڑھائیں"
                >
                  <Ionicons name="chevron-up" size={18} color={COLORS.white} />
                </Pressable>
                <TextInput
                  style={styles.spinnerInput}
                  value={plusInput}
                  onChangeText={(text) => handleNumericInput(text, setPlusInput)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  maxLength={6}
                  accessibilityLabel="اضافہ"
                />
                <Pressable
                  style={[styles.spinnerBtn, { backgroundColor: COLORS.success, opacity: plusValue === 0 ? 0.4 : 1 }]}
                  onPress={() => handleDecrement(setPlusInput, plusValue)}
                  disabled={plusValue === 0}
                  accessibilityLabel="اضافہ کم کریں"
                >
                  <Ionicons name="chevron-down" size={18} color={COLORS.white} />
                </Pressable>
              </View>
            </View>

            {/* Decrease Input (کمی) with spinner */}
            <View style={styles.fieldRow}>
              <UrduText style={[styles.fieldRowLabel, styles.negativeValue]}>کمی (-)</UrduText>
              <View style={[styles.spinnerWrapper, { borderColor: COLORS.error }]}>
                <Pressable
                  style={[styles.spinnerBtn, { backgroundColor: COLORS.error }]}
                  onPress={() => handleIncrement(setMinusInput, minusValue)}
                  accessibilityLabel="کمی بڑھائیں"
                >
                  <Ionicons name="chevron-up" size={18} color={COLORS.white} />
                </Pressable>
                <TextInput
                  style={styles.spinnerInput}
                  value={minusInput}
                  onChangeText={(text) => handleNumericInput(text, setMinusInput)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textSecondary}
                  maxLength={6}
                  accessibilityLabel="کمی"
                />
                <Pressable
                  style={[styles.spinnerBtn, { backgroundColor: COLORS.error, opacity: minusValue === 0 ? 0.4 : 1 }]}
                  onPress={() => handleDecrement(setMinusInput, minusValue)}
                  disabled={minusValue === 0}
                  accessibilityLabel="کمی کم کریں"
                >
                  <Ionicons name="chevron-down" size={18} color={COLORS.white} />
                </Pressable>
              </View>
            </View>

            {/* New Total (auto-calculated) */}
            <View style={[styles.fieldRow, styles.totalRow]}>
              <UrduText style={styles.totalLabel}>نئی تعداد</UrduText>
              <Text style={styles.totalValue}>{newTotal}</Text>
            </View>

            {/* Notes Input (نوٹس) */}
            <TextInput
              style={styles.notesInput}
              value={notesInput}
              onChangeText={setNotesInput}
              placeholder="تبصرہ یا نوٹ لکھیں (اختیاری)"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              accessibilityLabel="نوٹس"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <CustomButton
              text={'منسوخ کریں'}
              viewStyle={styles.cancelButton}
              textStyle={styles.cancelButtonText}
              onPress={handleClose}
              accessibilityLabel={i18n.t('cancel')}
            />

            <CustomButton
              text={saving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
              viewStyle={[
                styles.updateButton,
                (isDisabled || saving) && styles.updateButtonDisabled
              ]}
              textStyle={styles.updateButtonText}
              onPress={handleSave}
              disabled={isDisabled || saving}
              accessibilityLabel={i18n.t('update')}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * WorkforceItem Component
 * 
 * A reusable component for displaying workforce items with edit functionality
 */
const WorkforceItem = ({ label, value, onEdit, typeId, editable = true, ...accessibilityProps }: WorkforceItemProps) => {
  return (
    <Pressable
      style={styles.detailBox}
      onPress={editable ? onEdit : undefined}
      disabled={!editable}
      accessibilityRole="button"
      accessibilityLabel={`${i18n.t('edit')} ${label}`}
      {...accessibilityProps}
    >
      <UrduText style={styles.detailText}>{label}</UrduText>
      <Text style={styles.detailNum}>{value}</Text>
      <View style={[styles.editIcon, !editable && { opacity: 0.25 }]}>
        <EditIcon />
      </View>
    </Pressable>
  );
};

/**
 * StrengthTypeItem Component
 */
interface StrengthTypeItemProps {
  type: any;
  monthlyRecord: StrengthRecord | null;
  carryForwardTotal?: number;
  showModal: (title: string, typeId: number, record: StrengthRecord | null) => void;
  editable: boolean;
}

const StrengthTypeItem = ({ type, monthlyRecord, carryForwardTotal, showModal, editable }: StrengthTypeItemProps) => {
  // If a record exists for this month, show its new_total; otherwise show the carry-forward from the latest previous month
  const currentValue = monthlyRecord?.new_total ?? (carryForwardTotal ?? 0);

  return (
    <WorkforceItem
      key={type.id}
      label={type.Name_Plural}
      value={currentValue}
      typeId={type.id}
      editable={editable}
      onEdit={() => showModal(type.Name_Plural, type.id, monthlyRecord)}
    />
  );
};

/**
 * Workforce Screen Component
 * 
 * Displays and allows editing of workforce statistics
 */
export default function Workforce() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { preSelectedMonth, preSelectedYear } = useLocalSearchParams<{
    preSelectedMonth?: string;
    preSelectedYear?: string;
  }>();
  
  // Redux state
  const persons = useSelector(selectAllPersons);
  const status = useSelector(selectPersonsStatus);
  const error = useSelector(selectPersonsError);
  const contactTypes = useSelector(selectContactTypes);
  const contactTypesStatus = useSelector(selectContactTypesStatus);
  const contactTypesError = useSelector(selectContactTypesError);
  
  // Strength slice state
  const strengthTypes = useSelector(selectStrengthTypes);
  const strengthByCategory = useSelector(selectStrengthByCategory);
  const currentMonthRecords = useSelector(selectCurrentMonthRecordsByType);
  const carryForwardTotals = useSelector(selectCarryForwardTotals);
  const now = useMemo(() => new Date(), []);
  const currentYear = useSelector(selectCurrentYear) || now.getFullYear();
  const currentMonth = useSelector(selectCurrentMonth) || (now.getMonth() + 1);
  
  // Fetch persons and contact types on component mount
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPersonsByUnit());
    }
    if (contactTypesStatus === 'idle') {
      dispatch(fetchContactTypes());
    }
  }, [dispatch, status, contactTypesStatus]);
  
  // Get the selected unit from dashboard (or fall back to user's own unit)
  const selectedUnitId = useSelector(selectDashboardSelectedUnitId);
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const displayUnitId = selectedUnitId || userUnitDetails?.id;
  const allTanzeemiUnits = useSelector(selectAllTanzeemiUnits);

  // Unit IDs for filtering counts — selected unit + all descendants
  const countUnitIds = useMemo(() => {
    const ids = new Set<number>();
    if (!displayUnitId) return ids;
    ids.add(displayUnitId);
    const addDescendants = (parentId: number) => {
      allTanzeemiUnits.forEach(u => {
        const pid = Number(u.Parent_id || u.parent_id);
        if (pid === parentId && !ids.has(u.id)) {
          ids.add(u.id);
          addDescendants(u.id);
        }
      });
    };
    addDescendants(displayUnitId);
    return ids;
  }, [displayUnitId, allTanzeemiUnits]);

  // Fetch strength data
  const prevStrengthUnitRef = React.useRef<number | undefined>();
  useEffect(() => {
    if (!displayUnitId) return;
    if (displayUnitId === prevStrengthUnitRef.current) return;
    prevStrengthUnitRef.current = displayUnitId;
    dispatch(setUserUnitId(displayUnitId));
    dispatch(refreshStrengthData());
  }, [dispatch, displayUnitId]);

  // Pre-select month/year from navigation params (e.g., from report auto-question)
  useEffect(() => {
    if (preSelectedMonth && preSelectedYear) {
      const m = parseInt(preSelectedMonth, 10);
      const y = parseInt(preSelectedYear, 10);
      if (!isNaN(m) && !isNaN(y)) {
        dispatch(setCurrentPeriod({ year: y, month: m }));
        dispatch(refreshStrengthData({ year: y, month: m }));
      }
    }
  }, [preSelectedMonth, preSelectedYear, dispatch]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    typeId: 0,
    existingRecord: null as StrengthRecord | null,
  });

  // Calculate counts based on contact types (excluding archived persons)
  const counts = useMemo(() => {
    if (!persons.length || !contactTypes.length) {
      return {
        rukun: 0,
        karkun: 0,
        umeedwar: 0,
        others: 0,
        total: 0
      };
    }
    
    // Filter out archived persons and apply unit filter
    const activePersons = persons.filter(person => {
      if (person.status === 'archived') return false;
      if (countUnitIds.size > 0) {
        const rawUnit = person.Tanzeemi_Unit;
        const unitId = typeof rawUnit === 'object' && rawUnit !== null ? Number((rawUnit as any).id) : Number(rawUnit);
        if (isNaN(unitId) || !countUnitIds.has(unitId)) return false;
      }
      return true;
    });
    
    const result = {
      rukun: 0,
      karkun: 0,
      umeedwar: 0,
      others: 0,
      total: activePersons.length
    };
    
    contactTypes.forEach(type => {
      const count = activePersons.filter(person => person.contact_type === type.id).length;
      if (type.type === 'rukun' || type.type === 'karkun' || type.type === 'umeedwar') {
        result[type.type] = count;
      } else {
        result.others += count;
      }
    });
    
    return result;
  }, [persons, contactTypes, countUnitIds]);

  // Calculate total members for display
  const totalMembers = useMemo(() => {
    return counts.total;
  }, [counts]);

  // Calculate total change (placeholder for actual calculation)
  const totalChange = useMemo(() => {
    // This would be calculated based on previous values vs current values
    return 13;
  }, []);

  // Get category labels from strength types
  const getCategoryLabel = useCallback((category: string) => {
    // if (!strengthTypes.length) {
      // Fallback to hardcoded labels if no strength types available
      switch (category) {
        case 'workforce':
          return 'افرادی قوت کی تفصیل';
        case 'place':
          return 'مقامات کی تفصیل';
        case 'magazine':
          return 'رسائل کی تفصیل';
        default:
          return category;
      }
    // }
    
    // // Find strength types for this category
    // const categoryTypes = strengthTypes.filter(type => type.Category === category);
    
    // if (categoryTypes.length === 0) {
    //   // Fallback to hardcoded labels if no types found for this category
    //   switch (category) {
    //     case 'workforce':
    //       return 'قوت کی تفصیل';
    //     case 'place':
    //       return 'مقامات کی تفصیل';
    //     case 'magazine':
    //       return 'رسائل کی تفصیل';
    //     default:
    //       return category;
    //   }
    // }
    
    // // Use the Name_Plural from the first type in this category
    // const firstType = categoryTypes[0];
    // return `${firstType.Name_Plural} کی تفصیل`;
  }, [strengthTypes]);

  // Calculate annual target (placeholder for actual calculation)
  const annualTarget = useMemo(() => {
    // This would be fetched from API or calculated
    return 2341;
  }, []);

  // Show modal with specific configuration
  const showModal = useCallback((
    title: string,
    typeId: number,
    record: StrengthRecord | null,
  ) => {
    setModalConfig({ title, typeId, existingRecord: record });
    setModalVisible(true);
  }, []);

  // Determine real current month for editability checks
  const realNow = useMemo(() => new Date(), []);
  const realYear = realNow.getFullYear();
  const realMonth = realNow.getMonth() + 1; // 1-based

  // Only current month and previous month are editable
  const isCurrentMonthEditable = useMemo(() => {
    // Convert to a comparable number: year*12 + month
    const viewingPeriod = currentYear * 12 + currentMonth;
    const currentPeriod = realYear * 12 + realMonth;
    const prevPeriod = currentPeriod - 1;

    return viewingPeriod === currentPeriod || viewingPeriod === prevPeriod;
  }, [currentYear, currentMonth, realYear, realMonth]);

  // Block forward navigation beyond current month
  const canGoNext = useMemo(() => {
    const viewingPeriod = currentYear * 12 + currentMonth;
    const currentPeriod = realYear * 12 + realMonth;
    return viewingPeriod < currentPeriod;
  }, [currentYear, currentMonth, realYear, realMonth]);

  // Month navigation
  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === 'next') {
      if (!canGoNext) return; // Block future navigation
      if (currentMonth === 12) {
        newMonth = 1;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
      }
    } else {
      if (currentMonth === 1) {
        newMonth = 12;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
      }
    }

    dispatch(setCurrentPeriod({ year: newYear, month: newMonth }));
    dispatch(refreshStrengthData({ year: newYear, month: newMonth }));
  }, [currentMonth, currentYear, canGoNext, dispatch]);

  // Callback after modal save
  const handleModalSaved = useCallback(() => {
    dispatch(refreshStrengthData({ year: currentYear, month: currentMonth }));
  }, [dispatch, currentYear, currentMonth]);

  // Always use carry-forward total (latest previous month's new_total) as previousTotal.
  // This ensures that if a prior month's record was updated, subsequent months reflect it.
  const modalPreviousTotal = useMemo(() => {
    const carryForward = carryForwardTotals[modalConfig.typeId];
    if (carryForward != null) {
      return carryForward;
    }
    // Fallback to existing record's previous_total if carry-forward hasn't loaded yet
    return modalConfig.existingRecord?.previous_total ?? 0;
  }, [modalConfig, carryForwardTotals]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    const completeMetric = startNavigationMetric('workforce_back_to_route_change');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/screens/(tabs)/Dashboard');
    }
    requestAnimationFrame(completeMetric);
  }, [router]);

  // Handle navigation to Arkan screen with optional contact type filter
  const handleNavigateToArkan = useCallback((contactTypeStr?: string) => {
    if (contactTypeStr) {
      router.push(`/screens/(tabs)/Arkan?contactType=${contactTypeStr}`);
    } else {
      router.push('/screens/(tabs)/Arkan');
    }
  }, [router]);

  // No unit assigned
  if (!displayUnitId) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <NoUnitMessage />
      </SafeAreaView>
    );
  }

  // Render loading state
  if ((status === 'loading' || contactTypesStatus === 'loading') && !modalVisible) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.centerContent]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if ((status === 'failed' && error) || (contactTypesStatus === 'failed' && contactTypesError)) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
          translucent={Platform.OS === 'android'}
        />
        <View style={[styles.centerContent]}>
          <Text style={styles.errorText}>
            {error?.includes('{') ? i18n.t('api_error') : error || contactTypesError}
          </Text>
          <CustomButton
            text={i18n.t('try_again')}
            onPress={() => {
              dispatch(fetchPersonsByUnit());
              dispatch(fetchContactTypes());
            }}
            style={styles.retryButton}
            viewStyle={styles.retryButtonView}
            textStyle={styles.retryButtonText}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Status Bar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.primary} 
        translucent={true} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            { 
              flexGrow: 1,
              paddingBottom: 100, // Add extra padding at the bottom to prevent content from being hidden
            }
          ]} 
          style={styles.container}
        >
        {/* Edit Modal */}
        <EditModal
          visible={modalVisible}
          setVisible={setModalVisible}
          title={modalConfig.title}
          typeId={modalConfig.typeId}
          existingRecord={modalConfig.existingRecord}
          previousTotal={modalPreviousTotal}
          year={currentYear}
          month={currentMonth}
          onSaved={handleModalSaved}
        />
        
        {/* Top Container with Stats */}
        <View style={styles.topContainer}>
          <View style={styles.quwatContainer}>
             {/* Karkun Count */}
             <Pressable
               style={styles.quwatBox}
               onPress={() => handleNavigateToArkan('karkun')}
               accessibilityRole="button"
               accessibilityLabel={`${i18n.t('karkun')} - ${i18n.t('view_list')}`}
               accessibilityHint={i18n.t('navigate_to_arkan_screen')}
             >
              <Image 
                source={require('../../assets/images/red-target-icon.png')} 
                style={styles.quwatIcon}
                accessibilityLabel={i18n.t('karkun_icon')}
              />
              <Text style={styles.quwatValue}>{counts.karkun}</Text>
              <UrduText style={styles.quwatText}>{i18n.t('karkun')}</UrduText>
            </Pressable>
         
              {/* Umeedwar Count */}
              <Pressable
                style={styles.quwatBox}
                onPress={() => handleNavigateToArkan('umeedwar')}
                accessibilityRole="button"
                accessibilityLabel={`${i18n.t('umeedwar')} - ${i18n.t('view_list')}`}
                accessibilityHint={i18n.t('navigate_to_arkan_screen')}
              >
              <Image 
                source={require('../../assets/images/yellow-arkan-icon.png')} 
                style={styles.quwatIcon}
                accessibilityLabel={i18n.t('umeedwar_icon')}
              />
              <Text style={styles.quwatValue}>{counts.umeedwar}</Text>
              <UrduText style={styles.quwatText}>{i18n.t('umeedwar')}</UrduText>
            </Pressable>
                       {/* Rukun Count */}

            <Pressable
              style={styles.quwatBox}
              onPress={() => handleNavigateToArkan('rukun')}
              accessibilityRole="button"
              accessibilityLabel={`${i18n.t('rukun')} - ${i18n.t('view_list')}`}
              accessibilityHint={i18n.t('navigate_to_arkan_screen')}
            >
              <Image 
                source={require('../../assets/images/green-arkan-icon.png')} 
                style={styles.quwatIcon}
                accessibilityLabel={i18n.t('rukun_icon')}
              />
              <Text style={styles.quwatValue}>{counts.rukun}</Text>
              <UrduText style={styles.quwatText}>{i18n.t('rukun')}</UrduText>
            </Pressable>
          
          </View>
          
          {/* <Link href="/screens/Arkan" style={styles.arkanLink}>
            {i18n.t('view_list_of_arkan') || "View List of Arkan"}
          </Link> */}
        </View>

      
        
        <UnitSelectorBar />
        {/* Month/Year Selector */}
        <View style={styles.monthSelector}>
          <Pressable
            onPress={() => handleMonthChange('prev')}
            style={styles.monthArrow}
            accessibilityLabel="پچھلا مہینہ"
          >
            <Text style={styles.monthArrowText}>{'>'}</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <UrduText style={styles.monthText}>
              {getUrduMonth(currentMonth)} {currentYear}
            </UrduText>
            {!isCurrentMonthEditable && (
              <UrduText style={styles.readOnlyBadge}>صرف مشاہدہ</UrduText>
            )}
          </View>
          <Pressable
            onPress={() => handleMonthChange('next')}
            style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
            disabled={!canGoNext}
            accessibilityLabel="اگلا مہینہ"
          >
            <Text style={[styles.monthArrowText, !canGoNext && { color: COLORS.textSecondary }]}>{'<'}</Text>
          </Pressable>
        </View>

        {/* Strength Data by Category */}
        {strengthTypes.length > 0 && (
          <View style={styles.strengthDataContainer}>
            {Object.entries(strengthByCategory).map(([category, types]) => (
              <React.Fragment key={category}>
                {types.length > 0 && (
                  <>
                    <UrduText style={styles.blueHeading}>
                      {getCategoryLabel(category)}
                    </UrduText>

                    {types.map((type) => (
                      <StrengthTypeItem
                        key={`type-${type.id}`}
                        type={type}
                        monthlyRecord={currentMonthRecords[type.id] || null}
                        carryForwardTotal={carryForwardTotals[type.id]}
                        showModal={showModal}
                        editable={isCurrentMonthEditable}
                      />
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header styles
  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    zIndex: Z_INDEX.header,
    ...SHADOWS.medium,
  },
  header: {
    backgroundColor: 'transparent',
  },
  
  // Main container
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  
  // Top section with stats
  topContainer: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.medium
  },
  quwatContainer: {
    flexDirection: "row-reverse",
    gap: SPACING.lg,
  },
  quwatBox: {
    padding: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    width: "30%",
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small
  },
  quwatIcon: {
    width: 50,
    height: 50
  },
  quwatValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
    fontFamily: 'JameelNooriNastaleeq',
  },
  quwatText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
    fontFamily: 'JameelNooriNastaleeq',
  },
  arkanLink: {
    color: COLORS.white,
    textDecorationLine: "underline",
    fontSize: TYPOGRAPHY.fontSize.sm
  },
  
  // Bottom section with workforce details
  bottomContainer: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg
  },
  // Month selector
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.lightPrimary,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  monthArrow: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  monthArrowText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  monthText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
  },
  monthArrowDisabled: {
    opacity: 0.3,
  },
  readOnlyBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: 'JameelNooriNastaleeq',
    marginTop: 2,
  },
  // Strength data container
  strengthDataContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  blueHeading: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    textAlign:'left',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },
  
  // Detail items
  detailBox: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: COLORS.lightGray,
    borderBottomWidth: 1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: "JameelNooriNastaleeq"
  },
  detailNum: {
    marginLeft: "auto",
    fontSize: TYPOGRAPHY.fontSize.md,
    margin: SPACING.sm,
    fontFamily: 'JameelNooriNastaleeq',
  },
  editIcon: {
    padding: SPACING.sm,
  },
  
  // Modal styles - Redesigned with consistent heights and improved UI
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    width: '100%',
    ...SHADOWS.large
  },
  modalHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg + SPACING.xl,
    position: 'relative',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.white,
    fontFamily: 'JameelNooriNastaleeq',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'JameelNooriNastaleeq',
    textAlign: 'center',
    marginTop: 2,
  },
  modalCloseButton: {
    position: "absolute",
    left: SPACING.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: SPACING.sm,
    zIndex: Z_INDEX.modal,
  },
  modalContent: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  // Compact row layout: label on right, value on left (RTL)
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    minHeight: 40,
  },
  fieldRowLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textSecondary,
    textAlign: 'right',
    minWidth: 80,
  },
  fieldRowValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontFamily: 'JameelNooriNastaleeq',
    minWidth: 60,
    textAlign: 'center',
  },
  // Spinner input with up/down buttons
  spinnerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    overflow: 'hidden',
    height: 40,
  },
  spinnerBtn: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerInput: {
    width: 60,
    height: '100%',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  // Total row with highlight
  totalRow: {
    backgroundColor: COLORS.lightPrimary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.primary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'JameelNooriNastaleeq',
  },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    minHeight: 44,
    marginTop: SPACING.xs,
  },
  positiveValue: {
    color: COLORS.success,
  },
  negativeValue: {
    color: COLORS.error,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  updateButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    height: 42,
  },
  updateButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  updateButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.warning,
    height: 42,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 24,
  },
  // Loading and error styles
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'JameelNooriNastaleeq',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    fontFamily: 'JameelNooriNastaleeq',
  },
  retryButton: {
    marginTop: 20,
  },
  retryButtonView: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  // Removed unused strength data styles
  unitLevelGroup: {
    marginBottom: 20,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: 15,
    ...SHADOWS.small,
  },
  unitLevelGroupHeading: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 5,
  },
  genderSection: {
    marginBottom: 15,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  genderHeading: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  strengthTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    marginBottom: 5,
    borderRadius: BORDER_RADIUS.sm,
  },
  strengthTypeLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  strengthTypeValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // Removed unused recent changes styles
});
