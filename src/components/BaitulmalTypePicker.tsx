import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UrduText from './UrduText';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import {
  fetchBaitulmalTypes,
  selectIncomeTypes,
  selectExpenseTypes,
  selectBaitulmalTypesLoading,
  selectBaitulmalTypes,
} from '@/src/features/baitulmal/baitulmalSlice';
import { getUrduMonth } from '@/src/constants/urduLocalization';

interface MonthOption {
  month: number;
  year: number;
  label: string;
}

function getReportMonthOptions(): MonthOption[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  // RTL: first item = right side. Show prev on right, current on left. Current selected.
  return [
    { month: prevMonth, year: prevYear, label: `${getUrduMonth(prevMonth)} ${prevYear}` },
    { month: currentMonth, year: currentYear, label: `${getUrduMonth(currentMonth)} ${currentYear}` },
  ];
}

interface BaitulmalTypePickerProps {
  visible: boolean;
  category: 'income' | 'expense';
  onSelect: (typeId: string, reportMonth: string, reportYear: string) => void;
  onCancel: () => void;
}

const BaitulmalTypePicker: React.FC<BaitulmalTypePickerProps> = ({
  visible,
  category,
  onSelect,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const allTypes = useAppSelector(selectBaitulmalTypes);
  const incomeTypes = useAppSelector(selectIncomeTypes);
  const expenseTypes = useAppSelector(selectExpenseTypes);
  const loading = useAppSelector(selectBaitulmalTypesLoading);
  const { height: windowHeight } = useWindowDimensions();
  const scrollMaxHeight = Math.min(windowHeight * 0.50, 420);

  const types = category === 'income' ? incomeTypes : expenseTypes;
  const title = category === 'income' ? 'آمدنی کا اندراج' : 'خرچ کا اندراج';
  const iconName: keyof typeof Ionicons.glyphMap = category === 'income' ? 'trending-up' : 'trending-down';

  const monthOptions = useMemo(() => getReportMonthOptions(), []);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(1); // current month at index 1

  // Reset month selection when modal opens
  useEffect(() => {
    if (visible) setSelectedMonthIdx(1);
  }, [visible]);

  useEffect(() => {
    if (visible && allTypes.length === 0) {
      dispatch(fetchBaitulmalTypes());
    }
  }, [visible, allTypes.length, dispatch]);

  const handleTypeSelect = (typeId: string) => {
    const selected = monthOptions[selectedMonthIdx];
    onSelect(typeId, String(selected.month), String(selected.year));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.overlayBackdrop} onPress={onCancel} />
        <View style={styles.overlayCenter}>
          <View style={styles.dialogBox}>
            <UrduText style={styles.dialogTitle}>{title}</UrduText>

            {/* Month selector */}
            <UrduText style={styles.sectionLabel}>ماہ منتخب کریں</UrduText>
            <View style={styles.monthRow}>
              {monthOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={`${opt.month}-${opt.year}`}
                  style={[styles.monthBtn, selectedMonthIdx === idx && styles.monthBtnSelected]}
                  onPress={() => setSelectedMonthIdx(idx)}
                  activeOpacity={0.7}
                >
                  <UrduText style={[styles.monthBtnText, selectedMonthIdx === idx && styles.monthBtnTextSelected]}>
                    {opt.label}
                  </UrduText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Type list */}
            <UrduText style={styles.sectionLabel}>
              {category === 'income' ? 'آمدنی کی قسم منتخب کریں' : 'خرچ کی قسم منتخب کریں'}
            </UrduText>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <ScrollView
                style={[styles.typesList, { maxHeight: scrollMaxHeight }]}
                contentContainerStyle={styles.typesListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                {types.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.typeBtn}
                    onPress={() => handleTypeSelect(String(type.id))}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIconCircle, { backgroundColor: category === 'income' ? COLORS.tertiary : '#E57373' }]}>
                      <Ionicons name={iconName} size={20} color={COLORS.white} />
                    </View>
                    <UrduText style={styles.typeText}>{type.Name}</UrduText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.cancelWrap}>
              <UrduText style={styles.cancelText}>منسوخ کریں</UrduText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? SHADOWS.medium : { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' }),
  },
  dialogTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  monthRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    width: '100%',
  },
  monthBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  monthBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightPrimary || '#E3F2FD',
  },
  monthBtnText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.textSecondary,
  },
  monthBtnTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
  },
  typesList: {
    width: '100%',
  },
  typesListContent: {
    paddingVertical: SPACING.xs,
    flexGrow: 1,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.lg,
    backgroundColor: COLORS.lightGray,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    width: '100%',
  },
  typeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: 'JameelNooriNastaleeq',
    flex: 1,
  },
  cancelWrap: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: 'JameelNooriNastaleeq',
  },
});

export default BaitulmalTypePicker;
