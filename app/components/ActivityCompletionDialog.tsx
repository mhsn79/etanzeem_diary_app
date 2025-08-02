import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import UrduText from './UrduText';
import Dialog from './Dialog';
import FormInput from './FormInput';
import CustomButton from './CustomButton';
import CustomDropdown from './CustomDropdown';

interface ActivityCompletionDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: { attendance: string; reportingMonth: string; reportingYear: string }) => void;
  activityDate: string;
  loading?: boolean;
}

const ActivityCompletionDialog: React.FC<ActivityCompletionDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  activityDate,
  loading = false,
}) => {
  const [attendance, setAttendance] = useState('');
  const [reportingMonth, setReportingMonth] = useState('');
  const [reportingYear, setReportingYear] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Urdu month names
  const urduMonths = [
    { id: '1', label: 'جنوری', value: '1' },
    { id: '2', label: 'فروری', value: '2' },
    { id: '3', label: 'مارچ', value: '3' },
    { id: '4', label: 'اپریل', value: '4' },
    { id: '5', label: 'مئی', value: '5' },
    { id: '6', label: 'جون', value: '6' },
    { id: '7', label: 'جولائی', value: '7' },
    { id: '8', label: 'اگست', value: '8' },
    { id: '9', label: 'ستمبر', value: '9' },
    { id: '10', label: 'اکتوبر', value: '10' },
    { id: '11', label: 'نومبر', value: '11' },
    { id: '12', label: 'دسمبر', value: '12' },
  ];

  // Generate year options (current year and 2 past years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { id: String(currentYear - 2), label: String(currentYear - 2), value: String(currentYear - 2) },
    { id: String(currentYear - 1), label: String(currentYear - 1), value: String(currentYear - 1) },
    { id: String(currentYear), label: String(currentYear), value: String(currentYear) },
  ];

  // Auto-fill reporting month and year from activity date or current date
  useEffect(() => {
    let date: Date;
    
    if (activityDate) {
      // Use activity date if available
      date = new Date(activityDate);
    } else {
      // Fallback to current date
      date = new Date();
    }
    
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const year = date.getFullYear();
    
    setReportingMonth(String(month));
    setReportingYear(String(year));
  }, [activityDate]);

  const handleInitialConfirm = () => {
    setShowForm(true);
  };

  const selectMonth = (option: { id: string; label: string; value: string }) => {
    setReportingMonth(option.value);
  };

  const selectYear = (option: { id: string; label: string; value: string }) => {
    setReportingYear(option.value);
  };

  const handleFormSubmit = () => {
    if (!attendance.trim()) {
      Alert.alert('غلطی', 'براہ کرم حاضری کی تعداد درج کریں');
      return;
    }
    if (!reportingMonth.trim() || !reportingYear.trim()) {
      Alert.alert('غلطی', 'براہ کرم رپورٹنگ کا مہینہ اور سال درج کریں');
      return;
    }

    onConfirm({
      attendance: attendance.trim(),
      reportingMonth: reportingMonth.trim(),
      reportingYear: reportingYear.trim(),
    });
  };

  const handleClose = () => {
    setShowForm(false);
    setAttendance('');
    onClose();
  };

  if (!showForm) {
    return (
      <Dialog
        visible={visible}
        onConfirm={handleInitialConfirm}
        onClose={handleClose}
        title="سرگرمی مکمل ہوئی؟"
        description="کیا یہ سرگرمی مکمل ہو گئی ہے؟ اگر ہاں، تو براہ کرم حاضری اور رپورٹنگ کی تفصیلات درج کریں۔"
        confirmText="ہاں، مکمل ہوئی"
        cancelText="نہیں، ابھی نہیں"
        showWarningIcon={false}
        showSuccessIcon={false}
      />
    );
  }

  return (
    <Dialog
      visible={visible}
      onConfirm={handleFormSubmit}
      onClose={handleClose}
      title="سرگرمی کی رپورٹ"
      description="براہ کرم سرگرمی کی تفصیلات درج کریں"
      confirmText="محفوظ کریں"
      cancelText="منسوخ کریں"
      showWarningIcon={false}
      showSuccessIcon={false}
      loading={loading}
      customContent={
        <View style={styles.formContainer}>
          <FormInput
            inputTitle="حاضری کی تعداد"
            value={attendance}
            onChange={setAttendance}
            placeholder="حاضری کی تعداد درج کریں"
            keyboardType="numeric"
            required
          />
          <CustomDropdown
            options={urduMonths}
            onSelect={selectMonth}
            dropdownTitle="رپورٹنگ کا مہینہ"
            placeholder="مہینہ منتخب کریں"
            selectedValue={reportingMonth}
            dropdownContainerStyle={styles.dropdownContainer}
          />
          <CustomDropdown
            options={yearOptions}
            onSelect={selectYear}
            dropdownTitle="رپورٹنگ کا سال"
            placeholder="سال منتخب کریں"
            selectedValue={reportingYear}
            dropdownContainerStyle={styles.dropdownContainer}
          />
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  formContainer: {
    padding: SPACING.md,
  },
  dropdownContainer: {
    marginBottom: SPACING.sm,
  },
});

export default ActivityCompletionDialog; 