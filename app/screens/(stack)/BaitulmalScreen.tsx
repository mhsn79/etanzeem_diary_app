import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import FormInput from '../../components/FormInput';
import CustomDropdown, { Option } from '../../components/CustomDropdown';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import { getUrduMonth } from '@/app/constants/urduLocalization';
import UrduText from '../../components/UrduText';
import { useAppDispatch } from '@/src/hooks/useAppDispatch';
import { useAppSelector } from '@/src/hooks/useAppSelector';
import {
  selectIncomeTypes,
  selectExpenseTypes,
  selectBaitulmalTypes,
  selectBaitulmalCreateStatus,
  selectBaitulmalEditStatus,
  createBaitulmalRecord,
  editBaitulmalRecord,
  resetCreateStatus,
  resetEditStatus,
  getBaitulmalRecordById,
  fetchBaitulmalTypes,
} from '@/app/features/baitulmal/baitulmalSlice';

export default function BaitulmalScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { mode, recordId, reportMonth, reportYear } = useLocalSearchParams<{
    mode?: string;  // 'income' | 'expense' | 'edit'
    recordId?: string;
    reportMonth?: string;
    reportYear?: string;
  }>();

  const isEditMode = mode === 'edit';
  const isIncome = mode === 'income';
  const categoryLabel = isEditMode ? 'ترمیم' : (isIncome ? 'آمدن' : 'اخراجات');

  // Load existing record for edit mode
  const existingRecord = useAppSelector(getBaitulmalRecordById(recordId || 0));

  // Types
  const allTypes = useAppSelector(selectBaitulmalTypes);
  const incomeTypes = useAppSelector(selectIncomeTypes);
  const expenseTypes = useAppSelector(selectExpenseTypes);
  const createStatus = useAppSelector(selectBaitulmalCreateStatus);
  const editStatus = useAppSelector(selectBaitulmalEditStatus);

  // Determine which types to show
  const availableTypes = useMemo(() => {
    if (isEditMode && existingRecord) {
      const typeInfo = allTypes.find(t => t.id === existingRecord.Type);
      return typeInfo?.main_category === 'income' ? incomeTypes : expenseTypes;
    }
    return isIncome ? incomeTypes : expenseTypes;
  }, [isEditMode, existingRecord, isIncome, incomeTypes, expenseTypes, allTypes]);

  // Dropdown options
  const typeOptions: Option[] = useMemo(() => {
    return availableTypes.map(t => ({
      id: String(t.id),
      label: t.Name,
      value: String(t.id),
    }));
  }, [availableTypes]);

  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ type?: string; amount?: string }>({});

  // Month/year from params or existing record
  const month = useMemo(() => {
    if (isEditMode && existingRecord) return existingRecord.report_month;
    return reportMonth ? parseInt(reportMonth, 10) : new Date().getMonth() + 1;
  }, [isEditMode, existingRecord, reportMonth]);

  const year = useMemo(() => {
    if (isEditMode && existingRecord) return existingRecord.report_year;
    return reportYear ? parseInt(reportYear, 10) : new Date().getFullYear();
  }, [isEditMode, existingRecord, reportYear]);

  // Fetch types if not loaded
  useEffect(() => {
    if (allTypes.length === 0) {
      dispatch(fetchBaitulmalTypes());
    }
  }, [dispatch, allTypes.length]);

  // Pre-fill for edit mode
  useEffect(() => {
    if (isEditMode && existingRecord) {
      setSelectedTypeId(String(existingRecord.Type));
      setAmount(String(existingRecord.amount));
      setNotes(existingRecord.notes || '');
    }
  }, [isEditMode, existingRecord]);

  // Handle create/edit success
  useEffect(() => {
    if (createStatus === 'succeeded') {
      dispatch(resetCreateStatus());
      router.back();
    }
  }, [createStatus, dispatch, router]);

  useEffect(() => {
    if (editStatus === 'succeeded') {
      dispatch(resetEditStatus());
      router.back();
    }
  }, [editStatus, dispatch, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetCreateStatus());
      dispatch(resetEditStatus());
    };
  }, [dispatch]);

  const validate = useCallback((): boolean => {
    const newErrors: { type?: string; amount?: string } = {};
    if (!selectedTypeId) newErrors.type = 'مد منتخب کریں';
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'درست رقم درج کریں';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedTypeId, amount]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    try {
      if (isEditMode && recordId) {
        await dispatch(editBaitulmalRecord({
          id: parseInt(recordId),
          data: {
            Type: parseInt(selectedTypeId),
            amount: parseInt(amount),
            notes: notes.trim() || null,
          },
        })).unwrap();
      } else {
        await dispatch(createBaitulmalRecord({
          Type: parseInt(selectedTypeId),
          amount: parseInt(amount),
          notes: notes.trim() || null,
          report_month: month,
          report_year: year,
        })).unwrap();
      }
    } catch (e: any) {
      Alert.alert('خرابی', e || 'محفوظ نہیں ہو سکا');
    }
  }, [validate, isEditMode, recordId, selectedTypeId, amount, notes, month, year, dispatch]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const isSaving = createStatus === 'loading' || editStatus === 'loading';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={true} />
      <View style={styles.headerArea}>
        <Header title={`بیت المال - ${categoryLabel}`} onBack={handleBack} showBack={true} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Period info bar */}
          <View style={styles.periodInfoBar}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <UrduText style={styles.periodInfoText}>
              رپورٹنگ مدت: {getUrduMonth(month)} {year}
            </UrduText>
          </View>

          {/* Type dropdown */}
          <View style={styles.fieldContainer}>
            <UrduText style={styles.fieldLabel}>مد *</UrduText>
            <CustomDropdown
              options={typeOptions}
              selectedValue={selectedTypeId}
              onSelect={(option) => {
                setSelectedTypeId(option.value);
                setErrors(prev => ({ ...prev, type: undefined }));
              }}
              placeholder="مد منتخب کریں"
              dropdownTitle="مد منتخب کریں"
            />
            {errors.type && <UrduText style={styles.errorText}>{errors.type}</UrduText>}
          </View>

          {/* Amount */}
          <FormInput
            inputTitle="رقم *"
            value={amount}
            onChange={(text) => {
              setAmount(text);
              setErrors(prev => ({ ...prev, amount: undefined }));
            }}
            placeholder="رقم درج کریں"
            keyboardType="numeric"
            error={errors.amount}
          />

          {/* Notes */}
          <FormInput
            inputTitle="تفصیل / نوٹ"
            value={notes}
            onChange={setNotes}
            placeholder="تفصیل درج کریں (اختیاری)"
            multiline={true}
            numberOfLines={3}
          />

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <UrduText style={styles.saveButtonText}>
                {isEditMode ? 'تبدیلیاں محفوظ کریں' : 'محفوظ کریں'}
              </UrduText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  headerArea: { backgroundColor: COLORS.white },
  flex: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl * 2 },
  periodInfoBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightPrimary,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg, gap: SPACING.xs,
  },
  periodInfoText: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.primary, fontFamily: 'JameelNooriNastaleeq' },
  fieldContainer: { marginBottom: SPACING.md },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm, fontFamily: 'JameelNooriNastaleeq',
    color: COLORS.black, marginBottom: SPACING.xs,
  },
  errorText: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.error, fontFamily: 'JameelNooriNastaleeq', marginTop: 4 },
  saveButton: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: SPACING.lg,
  },
  saveButtonDisabled: { backgroundColor: COLORS.disabled, opacity: 0.7 },
  saveButtonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.lg, fontFamily: 'JameelNooriNastaleeq' },
});
