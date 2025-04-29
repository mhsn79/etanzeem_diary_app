/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from 'expo-router';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';
import FormInput from '../../components/FormInput';
import CustomDropdown from '../../components/CustomDropdown';
import { TabGroup } from '@/app/components/Tab';
import UrduText from '@/app/components/UrduText';
import CustomButton from '@/app/components/CustomButton';
import Dialog from '@/app/components/Dialog';

import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@/app/constants/theme';
import {
  fetchAllReportData,
  fetchReportSections,
  fetchReportQuestions,
  selectCurrentReportData,
  selectReportQuestions,
  selectReportSections,
  selectReportTemplates,
  selectReportsError,
  selectReportsStatus,
  selectTanzeemiLevels,
  // submitReport,
  updateReportData,
} from '@/app/features/reports/reportsSlice';
import { AppDispatch } from '@/app/store';

/* ------------------------------------------------------------------ */
/*  Types used locally                                                */
/* ------------------------------------------------------------------ */

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

interface ReportSectionLocal {
  id: string;
  title: string;
  fields: ReportField[];
}

/* ------------------------------------------------------------------ */
/*  Static fallback sections                                          */
/* ------------------------------------------------------------------ */

const staticReportSections: ReportSectionLocal[] = [
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
        helpText: '',
      },
      {
        id: '1.2',
        title: 'مرد آبادی کی تعداد درج کریں',
        field: 'malePopulation',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: '',
      },
      {
        id: '1.3',
        title: 'عورتوں کی آبادی کی تعداد درج کریں',
        field: 'femalePopulation',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: '',
      },
    ],
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
        helpText: '',
      },
      {
        id: '2.2',
        title: 'مرد ممبران کی تعداد',
        field: 'maleMembers',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: '',
      },
      {
        id: '2.3',
        title: 'خواتین ممبران کی تعداد',
        field: 'femaleMembers',
        placeholder: '40',
        isRequired: false,
        inputType: 'number',
        helpText: '',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const [showDialog, setShowDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');

  /* ------------ Redux state (immune to 'undefined') ------------- */
  const tanzeemiLevels   = useSelector(selectTanzeemiLevels) ?? [];
  const reportTemplates  = useSelector(selectReportTemplates) ?? [];
  const reportSections   = useSelector(selectReportSections) ?? [];
  const reportQuestions  = useSelector(selectReportQuestions) ?? [];
  const reportData       = useSelector(selectCurrentReportData) ?? {};
  const status           = useSelector(selectReportsStatus) ?? 'idle';
  const error            = useSelector(selectReportsError) ?? null;

console.log('tanzeemiLevels',tanzeemiLevels);
console.log('reportTemplates',reportTemplates);
console.log('reportSections',reportSections);
console.log('reportQuestions',reportQuestions);
  console.log('reportData',reportData);




  /* -------------------------------------------------------------- */
  /*  Data bootstrapping                                            */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    // Fetch all report data when component mounts
    console.log('CreateReportScreen: Dispatching fetchAllReportData');
    dispatch(fetchAllReportData())
      .unwrap()
      .then((result) => {
        console.log('CreateReportScreen: fetchAllReportData succeeded with data:', {
          tanzeemiLevelsCount: result.tanzeemiLevels.length,
          reportTemplatesCount: result.reportTemplates.length,
          reportSectionsCount: result.reportSections.length,
          reportQuestionsCount: result.reportQuestions.length
        });
      })
      .catch((error) => {
        console.error('CreateReportScreen: fetchAllReportData failed:', error);
        Alert.alert('Error', 'Failed to load report data. Please try again.');
      });
  }, []);

  /* -------------------------------------------------------------- */
  /*  Build dynamic report sections safely                          */
  /* -------------------------------------------------------------- */
  const processedSections = useMemo<ReportSectionLocal[]>(() => {
    console.log('Processing sections with data:', { 
      sectionsLength: reportSections?.length ?? 0, 
      questionsLength: reportQuestions?.length ?? 0 
    });
    
    // If we don't have any sections from the API, use static data
    if (!reportSections?.length) {
      console.log('Using static report sections as fallback');
      return staticReportSections;
    }

    // Map API sections to the format expected by the UI
    const processed = reportSections.map((section) => {
      // Find questions for this section
      const sectionQuestions = (reportQuestions ?? [])
        .filter((q) => q?.section_id === section.id);
      
      console.log(`Processing section ${section.id} (${section.section_label}) with ${sectionQuestions.length} questions`);
      
      return {
        id: section.id.toString(),
        title: section.section_label || `Section ${section.id}`,
        fields: sectionQuestions.map((q) => ({
          id: q.id.toString(),
          title: q.question_text || `Question ${q.id}`,
          field: `question_${q.id}`,
          placeholder: q.category ?? '',
          isRequired: q.highlight ?? false,
          inputType: q.input_type ?? 'text',
          helpText: '',
          options: undefined,
        })),
      };
    });
    
    console.log('Processed sections:', processed.length);
    return processed;
  }, [reportSections, reportQuestions]);

  /* -------------------------------------------------------------- */
  /*  Dropdown options                                              */
  /* -------------------------------------------------------------- */
  const zoneOptions = useMemo(() => {
    console.log('Building zone options with tanzeemiLevels:', tanzeemiLevels?.length ?? 0);
    
    if (tanzeemiLevels?.length) {
      return tanzeemiLevels.map((lvl) => ({
        id: lvl.id.toString(),
        label: lvl.Name || `Zone ${lvl.id}`,
        value: lvl.id.toString(),
      }));
    }
    
    // Fallback static options
    console.log('Using static zone options as fallback');
    return [
      { id: '1', label: 'زون 1', value: 'zone1' },
      { id: '2', label: 'زون 2', value: 'zone2' },
      { id: '3', label: 'زون 3', value: 'zone3' },
      { id: '4', label: 'زون 4', value: 'zone4' },
      { id: '5', label: 'زون 5', value: 'zone5' },
    ];
  }, [tanzeemiLevels]);

  const templateOptions = useMemo(() => {
    console.log('Building template options with reportTemplates:', reportTemplates?.length ?? 0);
    
    if (reportTemplates?.length) {
      return reportTemplates.map((tpl) => {
        const lvl = tanzeemiLevels?.find(
          (l) => l.id === tpl.unit_level_id
        );
        
        return {
          id: tpl.id.toString(),
          label: lvl ? `${lvl.Name} Report Template` : `Template ${tpl.id}`,
          value: tpl.id.toString(),
        };
      });
    }
    
    // Fallback static options
    console.log('Using static template options as fallback');
    return [{ id: '1', label: 'Default Template', value: '1' }];
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

  /* -------------------------------------------------------------- */
  /*  Handlers                                                      */
  /* -------------------------------------------------------------- */
  const handleBack = () => navigation.goBack();

  const handleInputChange = (field: string) => (value: string) =>
    dispatch(updateReportData({ field, value }));

  const handleZoneSelect = (opt: { value: string }) => {
    setSelectedZone(opt.value);
    dispatch(updateReportData({ field: 'zone_id', value: opt.value }));
  };

  const handleYearSelect = (opt: { value: string }) => {
    setSelectedYear(opt.value);
    dispatch(updateReportData({ field: 'year', value: opt.value }));
  };

  const handleTemplateSelect = async (opt: { value: string }) => {
    const id = Number(opt.value);
    console.log('Template selected:', id);
    setSelectedTemplateId(id);
    dispatch(updateReportData({ field: 'template_id', value: id }));

    try {
      console.log('Fetching sections for template ID:', id);
      const sectionsResult = await dispatch(fetchReportSections(id)).unwrap();
      console.log('Sections fetched successfully:', sectionsResult.length);
      
      console.log('Fetching all questions');
      const questionsResult = await dispatch(fetchReportQuestions(undefined)).unwrap();
      console.log('Questions fetched successfully:', questionsResult.length);
      
      console.log('Template data loaded successfully');
    } catch (error) {
      console.error('Failed to load template data:', error);
      Alert.alert('Error', 'Failed to load template data. Please try again.');
    }
  };

  const renderSection = ({ item }: { item: ReportSectionLocal }) => (
    <View style={styles.section}>
      <UrduText style={styles.sectionTitle}>{item.title}</UrduText>
      {item.fields.map((f) => (
        <FormInput
          key={f.id}
          inputTitle={f.title}
          value={String(reportData[f.field] ?? '')}
          onChange={handleInputChange(f.field)}
          keyboardType={f.inputType === 'number' ? 'numeric' : 'default'}
          placeholder={f.placeholder}
          helpText={f.helpText}
          required={f.isRequired}
        />
      ))}
    </View>
  );

  /* -------------------------------------------------------------- */
  /*  Submission pipeline                                           */
  /* -------------------------------------------------------------- */
  const validateRequired = (): string[] => {
    const missing: string[] = [];
    processedSections.forEach((sec) =>
      sec.fields.forEach((f) => {
        if (f.isRequired && !reportData[f.field]) missing.push(f.title);
      }),
    );
    return missing;
  };

  const handleContinue = () => {
    const missing = validateRequired();
    if (missing.length) {
      Alert.alert(
        'Missing Required Fields',
        `Please fill in: ${missing.join(', ')}`,
      );
      return;
    }
    setShowDialog(true);
  };

  const handleDialogConfirm = async () => {
    setShowDialog(false);

    if (!selectedTemplateId || !selectedZone || !selectedYear) {
      Alert.alert('Error', 'Please select template, zone and year.');
      return;
    }

    try {
      // await dispatch(
      //   submitReport({
      //     templateId: selectedTemplateId,
      //     reportData: {
      //       ...reportData,
      //       zone_id: selectedZone,
      //       year: selectedYear,
      //       template_id: selectedTemplateId,
      //     },
      //   }),
      // ).unwrap();
      Alert.alert('Success', 'Report submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit report.');
    }
  };

  /* -------------------------------------------------------------- */
  /*  Conditional rendering                                         */
  /* -------------------------------------------------------------- */
  if (status === 'loading' && 
      !reportSections?.length && 
      !tanzeemiLevels?.length && 
      !reportTemplates?.length) {
    console.log('Rendering loading state');
    return (
      <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <UrduText style={styles.loadingText}>Loading report data…</UrduText>
        </View>
      </ScreenLayout>
    );
  }

  if (status === 'failed' && error) {
    console.log('Rendering error state:', error);
    return (
      <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
        <View style={styles.errorContainer}>
          <UrduText style={styles.errorText}>
            Failed to load report data: {error}
          </UrduText>
          <CustomButton
            text="Retry"
            onPress={() => {
              console.log('Retrying data fetch');
              dispatch(fetchAllReportData());
            }}
            viewStyle={{
              backgroundColor: COLORS.primary,
              marginTop: SPACING.md,
            }}
            textStyle={{ color: COLORS.white }}
          />
        </View>
      </ScreenLayout>
    );
  }

  /* -------------------------------------------------------------- */
  /*  Main render                                                   */
  /* -------------------------------------------------------------- */
  return (
    <ScreenLayout title="رپورٹ بنائیں" onBack={handleBack}>
      <View style={styles.container}>
  
        <CustomDropdown
          options={zoneOptions}
          onSelect={handleZoneSelect}
          placeholder="زون نمبر منتخب کریں"
          selectedValue={selectedZone}
          dropdownContainerStyle={styles.dropdownContainer}
        />

         <CustomDropdown
          options={yearOptions}
          onSelect={handleYearSelect}
          placeholder="مدت  : سال"
          selectedValue={selectedYear}
          dropdownContainerStyle={styles.dropdownContainer}
        />

    

        {/* Sections */}
        <FlatList
          data={processedSections}
          renderItem={renderSection}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Continue button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            text="جاری رکھیں"
            onPress={handleContinue}
            viewStyle={{
              backgroundColor: COLORS.primary,
              flex: 1,
              marginHorizontal: SPACING.sm,
            }}
            textStyle={{ color: COLORS.white }}
            disabled={status === 'loading'}
          />
        </View>
      </View>

      {/* Confirmation dialog */}
      <Dialog
        onClose={() => setShowDialog(false)}
        visible={showDialog}
        onConfirm={handleDialogConfirm}
        onCancel={() => setShowDialog(false)}
        title="رپورٹ جمع کروانے کی تصدیق"
        description="کیا آپ واقعی اس رپورٹ کو جمع کروانا چاہتے ہیں؟ ایک بار جمع ہونے کے بعد، آپ اسے صرف ایڈمن کی اجازت سے ایڈٹ کر سکیں گے"
        confirmText="ہاں، جمع کروائیں"
        cancelText="نہیں، واپس جائیں"
        showWarningIcon
      />
    </ScreenLayout>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md },
  dropdownContainer: { marginBottom: SPACING.md },
  tabTitle: {
    color: COLORS.primary,
    textAlign: 'left',
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  listContent: { paddingBottom: SPACING.xl * 3 },
  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'left',
    lineHeight: 40,
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
