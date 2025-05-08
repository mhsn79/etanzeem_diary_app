/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState, useRef } from 'react';
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

import { AppDispatch } from '@/app/store';



const CreateReportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const [showDialog, setShowDialog] = useState(false);

  
  
  return (
    <ScreenLayout title="رپورٹ بنائیں" onBack={() => navigation.goBack()}>
      <View style={styles.container}>
  
      <FormInput
          inputTitle="تنظیمی یونٹ"
          value={ ''}
          editable={false}
          onChange={() => {}}
        />
        <FormInput
          inputTitle="رپورٹنگ ماہ و "
          value={ ''}
          editable={false}
          onChange={() => {}}
        />

    

   

        {/* Continue button */}
        <View style={styles.buttonContainer}>
          <CustomButton
            text="جاری رکھیں"
            onPress={() => setShowDialog(true)}
            viewStyle={{
              backgroundColor: COLORS.primary,
              flex: 1,
              marginHorizontal: SPACING.sm,
            }}
            textStyle={{ color: COLORS.white }}
         
          />
        </View>
      </View>

      {/* Confirmation dialog */}
      <Dialog
        onClose={() => setShowDialog(false)}
        visible={showDialog}
        onConfirm={() => console.log('Confirmed')}
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
