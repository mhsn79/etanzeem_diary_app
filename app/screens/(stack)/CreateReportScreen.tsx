import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import ScreenLayout from '../../components/ScreenLayout';
import FormInput from '../../components/FormInput';
import CustomDropdown from '../../components/CustomDropdown';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/app/constants/theme';
import { TabGroup } from '@/app/components/Tab';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import Dialog from '@/app/components/Dialog';
import { 
  fetchAllReportData, 
  fetchReportSections, 
  fetchReportQuestions,
  updateReportData,
  submitReport,
  selectTanzeemiLevels,
  selectReportTemplates,
  selectReportSections,
  selectReportQuestions,
  selectCurrentReportData,
  selectReportsStatus,
  selectReportsError
} from '@/app/features/reports/reportsSlice';
import { AppDispatch } from '@/app/store';

// Define field type to match the structure used in processedSections
interface ReportField {
  id: string;
  title: string;
  field: string;
  placeholder: string;
  isRequired?: boolean;
  inputType?: string;
  helpText?: string;
  options?: any[];
}

// Define section type
interface ReportSection {
  id: string;
  title: string;
  fields: ReportField[];
}

// Fallback static data in case API fails
const staticReportSections: ReportSection[] = [
  {
    id: '1',
    title: 'بنیادی معلومات',
    fields: [
      {
        id: '1.1',
        title: 'کل آبادی کی تعداد درج کریں',
        field: 'totalPopulation',
        placeholder: '40',
        isRequired: true,
        inputType: 'number',
        helpText: ''
      },
      {
        id: '1.2',
        title: 'مرد آبادی کی تعداد درج کریں',
        field: 'malePopulation',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: ''
      },
      {
        id: '1.3',
        title: 'عورتوں کی آبادی کی تعداد درج کریں',
        field: 'femalePopulation',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: ''
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
        placeholder: '40',
        isRequired: true,
        inputType: 'number',
        helpText: ''
      },
      {
        id: '2.2',
        title: 'مرد ممبران کی تعداد',
        field: 'maleMembers',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: ''
      },
      {
        id: '2.3',
        title: 'خواتین ممبران کی تعداد',
        field: 'femaleMembers',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: ''
      }
    ]
  }
];

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  
  // Get data from Redux store
  const tanzeemiLevels = useSelector(selectTanzeemiLevels);
  const reportTemplates = useSelector(selectReportTemplates);
  const reportSections = useSelector(selectReportSections);
  const reportQuestions = useSelector(selectReportQuestions);
  const reportData = useSelector(selectCurrentReportData);
  const status = useSelector(selectReportsStatus);
  const error = useSelector(selectReportsError);
  
  // Fetch all report data when component mounts
  useEffect(() => {
    dispatch(fetchAllReportData());
  }, [dispatch]);
  
  // Process sections and questions into a format similar to the static data
  const processedSections = useMemo((): ReportSection[] => {
    if (reportSections.length === 0) {
      return staticReportSections;
    }
    
    return reportSections.map(section => ({
      id: section.id.toString(),
      title: section.section_label,
      fields: reportQuestions
        .filter(question => question.section_id === section.id)
        .map(question => ({
          id: question.id.toString(),
          title: question.question_text,
          field: `question_${question.id}`, // Generate a field name based on question ID
          placeholder: question.category || '',
          isRequired: question.highlight || false,
          inputType: question.input_type || 'text',
          helpText: '',
          options: undefined
        }))
    }));
  }, [reportSections, reportQuestions]);
  
  // Generate zone options from tanzeemi levels
  const zoneOptions = useMemo(() => {
    if (tanzeemiLevels.length === 0) {
      return [
        { id: '1', label: 'زون 1', value: 'zone1' },
        { id: '2', label: 'زون 2', value: 'zone2' },
        { id: '3', label: 'زون 3', value: 'zone3' },
        { id: '4', label: 'زون 4', value: 'zone4' },
        { id: '5', label: 'زون 5', value: 'zone5' },
      ];
    }
    
    return tanzeemiLevels.map(level => ({
      id: level.id.toString(),
      label: level.Name,
      value: level.id.toString()
    }));
  }, [tanzeemiLevels]);
  
  // Generate template options
  const templateOptions = useMemo(() => {
    if (reportTemplates.length === 0) {
      return [{ id: '1', label: 'Default Template', value: '1' }];
    }
    
    // Find the corresponding tanzeemi level for each template
    return reportTemplates.map(template => {
      const tanzeemiLevel = tanzeemiLevels.find(level => level.id === template.unit_level_id);
      const templateName = tanzeemiLevel ? `${tanzeemiLevel.Name} Report Template` : `Template ${template.id}`;
      
      return {
        id: template.id.toString(),
        label: templateName,
        value: template.id.toString()
      };
    });
  }, [reportTemplates, tanzeemiLevels]);

  const yearOptions = [
    { id: '1', label: '2024', value: '2024' },
    { id: '2', label: '2023', value: '2023' },
    { id: '3', label: '2022', value: '2022' },
    { id: '4', label: '2021', value: '2021' },
  ];

  const tabs = [
    { label: 'سوال وجواب وزرڈ', value: 0 },
    { label: 'فارم(مکمل رپورٹ ایک ساتھ)', value: 1 },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleInputChange = (field: string) => (value: string) => {
    dispatch(updateReportData({ field, value }));
  };

  const handleZoneSelect = (option: { id: string; label: string; value: string }) => {
    setSelectedZone(option.value);
    dispatch(updateReportData({ field: 'zone_id', value: option.value }));
  };
  
  const handleYearSelect = (option: { id: string; label: string; value: string }) => {
    setSelectedYear(option.value);
    dispatch(updateReportData({ field: 'year', value: option.value }));
  };
  
  const handleTemplateSelect = async (option: { id: string; label: string; value: string }) => {
    const templateId = parseInt(option.value);
    setSelectedTemplateId(templateId);
    dispatch(updateReportData({ field: 'template_id', value: templateId }));
    
    try {
      // Fetch sections for this template
      await dispatch(fetchReportSections(templateId)).unwrap();
      
      // After sections are loaded, fetch all questions
      // We'll filter them in the processedSections useMemo
      await dispatch(fetchReportQuestions(undefined)).unwrap();
    } catch (error) {
      console.error('Error loading template data:', error);
      Alert.alert('Error', 'Failed to load template data. Please try again.');
    }
  };

  const renderSection = ({ item }: { item: ReportSection }) => (
    <View style={styles.section}>
      <UrduText style={styles.sectionTitle}>{item.title}</UrduText>
      {item.fields.map(field => (
        <FormInput
          key={field.id}
          inputTitle={field.title}
          value={reportData[field.field as string] as string || ''}
          onChange={handleInputChange(field.field)}
          keyboardType={field.inputType === 'number' ? 'numeric' : 'default'}
          placeholder={field.placeholder}
          helpText={field.helpText}
          required={field.isRequired}
        />
      ))}
    </View>
  );

  const handleContinue = () => {
    // Validate required fields
    const missingFields: string[] = [];
    
    for (const section of processedSections) {
      for (const field of section.fields) {
        if (field.isRequired && !reportData[field.field]) {
          missingFields.push(field.title);
        }
      }
    }
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Required Fields',
        `Please fill in the following required fields: ${missingFields.join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Show confirmation dialog
    setShowDialog(true);
  };

  const handleDialogConfirm = async () => {
    setShowDialog(false);
    
    if (!selectedTemplateId) {
      Alert.alert('Error', 'Please select a report template');
      return;
    }
    
    if (!selectedZone) {
      Alert.alert('Error', 'Please select a zone');
      return;
    }
    
    if (!selectedYear) {
      Alert.alert('Error', 'Please select a year');
      return;
    }
    
    try {
      // Submit the report with additional metadata
      await dispatch(submitReport({
        templateId: selectedTemplateId,
        reportData: {
          ...reportData,
          zone_id: selectedZone,
          year: selectedYear,
          template_id: selectedTemplateId
        }
      })).unwrap();
      
      Alert.alert(
        'Success',
        'Report submitted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
  };
  
  // Show loading indicator while fetching data
  if (status === 'loading' && processedSections.length === 0) {
    return (
      <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <UrduText style={styles.loadingText}>Loading report data...</UrduText>
        </View>
      </ScreenLayout>
    );
  }
  
  // Show error message if fetching data failed
  if (status === 'failed' && error) {
    return (
      <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>Failed to load report data: {error}</UrduText>
          <CustomButton
            text="Retry"
            onPress={() => dispatch(fetchAllReportData())}
            viewStyle={[{ backgroundColor: COLORS.primary, marginTop: SPACING.md }]}
            textStyle={[{ color: COLORS.white }]}
          />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
      <View style={styles.container}>
        {/* Template Selection */}
        <CustomDropdown
          dropdownTitle="رپورٹ ٹیمپلیٹ منتخب کریں"
          options={templateOptions}
          onSelect={handleTemplateSelect}
          placeholder="رپورٹ ٹیمپلیٹ منتخب کریں"
          selectedValue={selectedTemplateId?.toString() || ''}
          dropdownContainerStyle={styles.dropdownContainer}
        />
        
        {/* Zone Selection */}
        <CustomDropdown
          dropdownTitle="زون منتخب کریں"
          options={zoneOptions}
          onSelect={handleZoneSelect}
          placeholder="زون نمبر منتخب کریں"
          selectedValue={selectedZone}
          dropdownContainerStyle={styles.dropdownContainer}
        />
        
        {/* Year Selection */}
        <CustomDropdown
          dropdownTitle="سال منتخب کریں"
          options={yearOptions}
          onSelect={handleYearSelect}
          placeholder="مدت  : سال"
          selectedValue={selectedYear}
          dropdownContainerStyle={styles.dropdownContainer}
        />
        
        {/* Report Mode Selection */}
        <UrduText style={styles.tabTitle}>رپورٹ موڈ منتخب کریں</UrduText>
        <TabGroup
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
        
        {/* Report Sections and Questions */}
        {selectedTab === 0 ? (
          // Wizard mode - show one section at a time (to be implemented)
          <FlatList
            data={processedSections}
            renderItem={renderSection}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          // Form mode - show all sections at once
          <FlatList
            data={processedSections}
            renderItem={renderSection}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            text="جاری رکھیں"
            onPress={handleContinue}
            viewStyle={[{ backgroundColor: COLORS.primary, flex: 1, marginHorizontal: SPACING.sm }]}
            textStyle={[{ color: COLORS.white }]}
            disabled={status === 'loading'}
          />
        </View>
      </View>

      {/* Confirmation Dialog */}
      <Dialog
        onClose={() => setShowDialog(false)}
        visible={showDialog}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
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
    paddingBottom: SPACING.xl * 3, // Extra padding to ensure content is visible above the button
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
    lineHeight: 40
  },
  buttonContainer: {
    position: 'absolute',
    bottom: SPACING.md * 3,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    textAlign: 'center',
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});

export default CreateReportScreen; 