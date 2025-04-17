import React, { useState } from 'react';
import { useNavigation } from 'expo-router';
import ScreenLayout from '../../components/ScreenLayout';
import { COLORS, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import { View, StyleSheet, FlatList } from 'react-native';
import FormInput from '@/app/components/FormInput';
import CustomButton from '@/app/components/CustomButton';
import Dialog from '@/app/components/Dialog';

const reportSections = [
  {
    id: '1',
    title: 'بنیادی ممبرشپ ڈیٹا',
    fields: [
      {
        id: '1.1',
        title: 'یونین کونسل میں موجود مرد اراکین کی موجودہ تعداد؟',
        field: 'totalPopulation',
        placeholder: '45'
      },
      {
        id: '1.2',
        title: 'یونین کونسل کے لیے مقرر کردہ مرد اراکین کا ہدف کیا ہے؟',
        field: 'malePopulation',
        placeholder: '45'
      },
      {
        id: '1.3',
        title: 'رپورٹنگ مدت کے دوران مرد اراکین میں شمولیت کی تعداد کتنی ہے؟',
        field: 'femalePopulation',
        placeholder: '45'
      }
    ]
  },
  {
    id: '2',
    title: 'امیدواران کا ڈیٹا',
    fields: [
      {
        id: '2.1',
        title: 'یونین کونسل میں موجود مرد اراکین کی موجودہ تعداد؟',
        field: 'candidateTotalPopulation',
        placeholder: '45'
      },
      {
        id: '2.2',
        title: 'یونین کونسل کے لیے مقرر کردہ مرد اراکین کا ہدف کیا ہے؟',
        field: 'candidateMalePopulation',
        placeholder: '45'
      },
      {
        id: '2.3',
        title: 'رپورٹنگ مدت کے دوران مرد اراکین میں شمولیت کی تعداد کتنی ہے؟',
        field: 'candidateFemalePopulation',
        placeholder: '45'
      }
    ]
  }
];

const yearOptions = [
  { label: '2024', value: '2024' },
  { label: '2023', value: '2023' },
  { label: '2022', value: '2022' },
  { label: '2021', value: '2021' },
];

const SubmittedReportScreen = () => {
  const navigation = useNavigation();
  const [showDialog, setShowDialog] = useState(false);
  const [reportData, setReportData] = useState({
    zone: '',
    totalPopulation: '',
    malePopulation: '',
    femalePopulation: '',
    candidateTotalPopulation: '',
    candidateMalePopulation: '',
    candidateFemalePopulation: '',
    selectedYear: '',
  });

  const handleBack = () => {
    navigation.goBack();
  };

  const handleInputChange = (field: string) => (value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Handle save logic
    setShowDialog(true);
    console.log('Saving report data:', reportData);
  };

  const handleDialogConfirm = () => {
    setShowDialog(false);
    // Handle continue logic here
    console.log('Continuing with report data:', reportData);
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
  };

  const renderSection = ({ item }: { item: typeof reportSections[0] }) => (
    <View style={styles.section}>
      <UrduText style={styles.sectionTitle}>{item.title}</UrduText>
      {item.fields.map(field => (
        <FormInput
          key={field.id}
          inputTitle={field.title}
          value={reportData[field.field as keyof typeof reportData]}
          onChange={handleInputChange(field.field)}
          keyboardType="numeric"
          placeholder={field.placeholder}
        />
      ))}
    </View>
  );

  return (
    <ScreenLayout title="جمع شدہ رپورٹس" onBack={handleBack}>
      <View style={styles.container}>
        <FlatList
          data={reportSections}
          renderItem={renderSection}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.buttonContainer}>
          <CustomButton
            text="اپڈیٹس محفوظ کریں"
            onPress={handleSave}
            viewStyle={[{ backgroundColor: COLORS.primary, flex: 1, marginHorizontal: SPACING.sm }]}
            textStyle={[{ color: COLORS.white }]}
          />
        </View>
      </View>

      <Dialog
        visible={showDialog}
        onConfirm={handleDialogConfirm}
        onClose={() => setShowDialog(false)}
        title="رپورٹ جمع کروانے کی تصدیق"
        description="کیا آپ واقعی رپورٹ جمع کروانا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔"
        confirmText="ہاں، جمع کریں"
        cancelText="نہیں، واپس جائیں"
        showSuccessIcon={true}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    margin: SPACING.md,
  },
  listContent: {
    paddingBottom: 120, // Add padding to account for buttons
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
    color: COLORS.primary,
    textAlign: 'left',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: SPACING.md*1,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
});

export default SubmittedReportScreen; 