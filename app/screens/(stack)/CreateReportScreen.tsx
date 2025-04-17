import React, { useState } from 'react';
import { useNavigation } from 'expo-router';
import ScreenLayout from '../../components/ScreenLayout';
import FormInput from '../../components/FormInput';
import CustomDropdown from '../../components/CustomDropdown';
import { View, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import { TabGroup } from '@/app/components/Tab';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import Dialog from '@/app/components/Dialog';

const reportSections = [
  {
    id: '1',
    title: 'بنیادی معلومات',
    fields: [
      {
        id: '1.1',
        title: 'کل آبادی کی تعداد درج کریں',
        field: 'totalPopulation',
        placeholder: '40'
      },
      {
        id: '1.2',
        title: 'مرد آبادی کی تعداد درج کریں',
        field: 'malePopulation',
        placeholder: '40'
      },
      {
        id: '1.3',
        title: 'عورتوں کی آبادی کی تعداد درج کریں',
        field: 'femalePopulation',
        placeholder: '40'
      }
    ]
  },
  {
    id: '2',
    title: 'مزید معلومات',
    fields: [
      {
        id: '2.1',
        title: 'کل ممبران کی تعداد',
        field: 'totalMembers',
        placeholder: '40'
      },
      {
        id: '2.2',
        title: 'مرد ممبران کی تعداد',
        field: 'maleMembers',
        placeholder: '40'
      },
      {
        id: '2.3',
        title: 'خواتین ممبران کی تعداد',
        field: 'femaleMembers',
        placeholder: '40'
      }
    ]
  }
];

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const [showDialog, setShowDialog] = useState(false);
  const [reportData, setReportData] = useState({
    zone: '',
    totalPopulation: '',
    malePopulation: '',
    femalePopulation: '',
    totalMembers: '',
    maleMembers: '',
    femaleMembers: '',
  });
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { label: 'سوال وجواب وزرڈ', value: 0 },
    { label: 'فارم(مکمل رپورٹ ایک ساتھ)', value: 1 },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleInputChange = (field: string) => (value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleZoneSelect = (option: { id: string; label: string; value: string }) => {
    setReportData(prev => ({
      ...prev,
      zone: option.value
    }));
  };

  const zoneOptions = [
    { id: '1', label: 'زون 1', value: 'zone1' },
    { id: '2', label: 'زون 2', value: 'zone2' },
    { id: '3', label: 'زون 3', value: 'zone3' },
    { id: '4', label: 'زون 4', value: 'zone4' },
    { id: '5', label: 'زون 5', value: 'zone5' },
  ];

  const yearOptions = [
    { id: '1', label: '2024', value: '2024' },
    { id: '2', label: '2023', value: '2023' },
    { id: '3', label: '2022', value: '2022' },
    { id: '4', label: '2021', value: '2021' },
  ];

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

  const handleContinue = () => {
    setShowDialog(true);
  };

  const handleDialogConfirm = () => {
    setShowDialog(false);
    // Handle continue logic here
    console.log('Continuing with report data:', reportData);
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
  };

  return (
    <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
      <View style={styles.container}>
        <CustomDropdown
          options={zoneOptions}
          onSelect={handleZoneSelect}
          placeholder="زون نمبر منتخب کریں"
          selectedValue={reportData.zone}
          dropdownContainerStyle={styles.dropdownContainer}
        />
        <CustomDropdown
          options={yearOptions}
          onSelect={handleZoneSelect}
          placeholder="مدت  : سال"
          selectedValue={reportData.zone}
          dropdownContainerStyle={styles.dropdownContainer}
        />
        <UrduText style={styles.tabTitle}>رپورٹ موڈ منتخب کریں</UrduText>
        <TabGroup
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
        <FlatList
          data={reportSections}
          renderItem={renderSection}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.buttonContainer}>
          <CustomButton
            text="جاری رکھیں"
            onPress={handleContinue}
            viewStyle={[{ backgroundColor: COLORS.primary, flex: 1, marginHorizontal: SPACING.sm }]}
            textStyle={[{ color: COLORS.white }]}
          />
        </View>
      </View>

      <Dialog
        onClose={() => setShowDialog(false)}
        visible={showDialog}
        onConfirm={handleDialogConfirm}
        title="رپورٹ جمع کروانے کی تصدیق"
        description="کیا آپ واقعی اس رپورٹ کو جمع کروانا چاہتے ہیں؟ ایک بار جمع ہونے کے بعد، آپ اسے صرف ایڈمن کی اجازت سے ایڈٹ کر سکیں گے"
        confirmText="ہاں، جمع کروائیں"
        cancelText="نہیں، واپس جائیں"
        showWarningIcon={true}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  dropdownContainer: {
    marginBottom: SPACING.md,
  },
  tabTitle: {
    color: COLORS.primary,
    textAlign: 'left',
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'left',
    lineHeight:40
  },
  buttonContainer: {
    position: 'absolute',
    bottom: SPACING.md*3,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default CreateReportScreen; 