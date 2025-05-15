import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import ScreenLayout from '@/app/components/ScreenLayout';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import CustomDropdown from '@/app/components/CustomDropdown';
import FormInput from '@/app/components/FormInput';
import DateTimePickerModal from './components/DateTimePickerModal';
import CustomButton from '@/app/components/CustomButton';
import Dialog from '@/app/components/Dialog';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/src/hooks/redux';
import { 
    fetchActivityTypes, 
    selectAllActivityTypes,
    selectActivityTypesStatus,
    selectActivityTypesError
} from '@/app/features/activityTypes/activityTypesSlice';
import {
    createActivity,
    selectCreateActivityStatus,
    selectCreateActivityError
} from '@/app/features/activities/activitySlice';

const ActivityScreen = () => {
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    const dispatch = useAppDispatch();
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    // Initialize with current date for report mode, or tomorrow for schedule mode
    const mode = params.mode || 'schedule';
    const initialDate = mode === 'report' 
        ? new Date() // Today for report mode
        : new Date(new Date().setDate(new Date().getDate() + 1)); // Tomorrow for schedule mode
    
    const [selectedActivityDate, setSelectedActivityDate] = useState<Date | null>(initialDate);
    const [activityDetails, setActivityDetails] = useState({
        activityType: '',
        location: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Redux selectors
    const activityTypes = useAppSelector(selectAllActivityTypes);
    const activityTypesStatus = useAppSelector(selectActivityTypesStatus);
    const activityTypesError = useAppSelector(selectActivityTypesError);
    const createActivityStatus = useAppSelector(selectCreateActivityStatus);
    const createActivityError = useAppSelector(selectCreateActivityError);
console.log(activityTypes);

    // Fetch activity types on component mount
    useEffect(() => {
        if (activityTypesStatus === 'idle') {
            dispatch(fetchActivityTypes());
        }
    }, [dispatch, activityTypesStatus]);

    // Handle activity creation status changes
    useEffect(() => {
        if (createActivityStatus === 'succeeded' && isSubmitting) {
            setShowSuccessDialog(true);
            setIsSubmitting(false);
        } else if (createActivityStatus === 'failed' && isSubmitting) {
            // Show error dialog or fallback to alert for errors
            setShowConfirmDialog(false);
            setIsSubmitting(false);
            // We'll show an error message in the form instead of an alert
        }
    }, [createActivityStatus, createActivityError, isSubmitting]);

    // Map activity types from API to dropdown options
    const activityTypeOptions = activityTypes.map(type => ({
        id: String(type.id),
        label: type.Name,
        value: String(type.id),
    }));

    const locationOptions = [
        { id: '1', label: 'پارٹی کا ہیڈ آفس، لاہور', value: '1' },
        { id: '2', label: 'یونین کونسل 1', value: '2' },
        { id: '3', label: 'یونین کونسل 2', value: '3' },
        { id: '4', label: 'یونین کونسل 3', value: '4' },
        { id: '5', label: 'یونین کونسل 4', value: '5' },
        { id: '6', label: 'یونین کونسل 5', value: '6' },
        { id: '7', label: 'یونین کونسل 6', value: '7' },
        { id: '8', label: 'یونین کونسل 7', value: '8' },
        { id: '9', label: 'یونین کونسل 8', value: '9' },
        { id: '10', label: 'یونین کونسل 9', value: '10' },
    ];

    const navigateBack = () => {
        navigation.goBack();
    };

    const selectActivityDate = (date: Date) => {
        setSelectedActivityDate(date);
        setDatePickerVisible(false);
    };

    const updateActivityField = (field: string) => (value: string) => {
        setActivityDetails(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const selectActivityType = (option: { id: string; label: string; value: string }) => {
        setActivityDetails(prev => ({
            ...prev,
            activityType: option.value,
        }));
    };

    const selectLocation = (option: { id: string; label: string; value: string }) => {
        setActivityDetails(prev => ({
            ...prev,
            location: option.value,
        }));
    };

    const validateForm = () => {
        if (!selectedActivityDate) {
            return 'براہ کرم تاریخ اور وقت منتخب کریں۔';
        }
        if (!activityDetails.activityType) {
            return 'براہ کرم سرگرمی کی قسم منتخب کریں۔';
        }
        if (!activityDetails.location) {
            return 'براہ کرم جگہ منتخب کریں۔';
        }
        return null; // No errors
    };

    const [validationError, setValidationError] = useState<string | null>(null);

    const submitActivity = () => {
        // Validate form
        const error = validateForm();
        if (error) {
            setValidationError(error);
            return;
        }
        
        setValidationError(null);
        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    const handleConfirmSubmit = () => {
        // Prepare payload
        const payload = {
            activity_type: Number(activityDetails.activityType),
            activity_date_and_time: selectedActivityDate!.toISOString(),
            location: activityDetails.location,
            activity_details: activityDetails.notes,
            status: 'draft'
        };

        // Dispatch create activity action
        setIsSubmitting(true);
        dispatch(createActivity(payload));
    };

    const handleSuccessDialogConfirm = () => {
        setShowSuccessDialog(false);
        navigation.goBack();
    };

    // Determine the screen title based on the mode parameter
    const screenTitle = mode === 'report' ? 'سرگرمی رپورٹ فارم' : 'سرگرمی شیڈول کریں';

    return (
        <ScreenLayout title={screenTitle} onBack={navigateBack}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <FormInput
                        rightIcon={
                            <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                                <Ionicons name="calendar" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        }
                        inputTitle="تاریخ اور وقت"
                        value={selectedActivityDate ? selectedActivityDate.toLocaleString() : ''}
                        onChange={() => {}}
                        placeholder="تاریخ اور وقت منتخب کریں"
                    />
                    <FormInput
                        inputTitle="سرگرمی کا نام"
                        value={activityDetails.notes}
                        onChange={updateActivityField('notes')}
                        placeholder="سرگرمی کا نام منتخب کریں"
                    />
                    <CustomDropdown
                        options={activityTypeOptions}
                        onSelect={selectActivityType}
                        dropdownTitle="سرگرمی کی وضاحت"
                        placeholder="نئے امیدواروں کا انٹرویو، مہم کے منتظمین سے ملاقات"
                        selectedValue={activityDetails.activityType}
                        dropdownContainerStyle={styles.dropdownContainer}
                        loading={activityTypesStatus === 'loading'}
                    />
                    <CustomDropdown
                        options={locationOptions}
                        onSelect={selectLocation}
                        placeholder="جگہ"
                        dropdownTitle="جگہ"
                        selectedValue={activityDetails.location}
                        dropdownContainerStyle={styles.dropdownContainer}
                    />
                </View>
            </ScrollView>
            {validationError && (
                <View style={styles.errorContainer}>
                    <UrduText style={styles.errorText}>{validationError}</UrduText>
                </View>
            )}
            
            {createActivityError && createActivityStatus === 'failed' && (
                <View style={styles.errorContainer}>
                    <UrduText style={styles.errorText}>{createActivityError}</UrduText>
                </View>
            )}
            
            <View style={styles.buttonContainer}>
                <CustomButton
                    text="سرگرمی جمع کروائیں"
                    onPress={submitActivity}
                    viewStyle={[{ backgroundColor: COLORS.primary, flex: 1, marginHorizontal: SPACING.sm }]}
                    textStyle={[{ color: COLORS.white }]}
                    loading={createActivityStatus === 'loading'}
                    disabled={createActivityStatus === 'loading'}
                />
            </View>
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={selectActivityDate}
                selectedDate={selectedActivityDate}
                mode={mode as 'report' | 'schedule'} // Pass the mode
            />

            {/* Confirmation Dialog */}
            <Dialog
                visible={showConfirmDialog}
                onConfirm={handleConfirmSubmit}
                onClose={() => setShowConfirmDialog(false)}
                title="سرگرمی جمع کروانے کی تصدیق"
                description="کیا آپ واقعاً اس سرگرمی کو جمع کروانا چاہتے ہیں؟ ایک بار جمع ہونے کے بعد، آپ اسے صرف ایڈمن کی اجازت سے ایڈٹ کر سکیں گے"
                confirmText="ہاں، جمع کروائیں"
                cancelText="نہیں، واپس جائیں"
                showWarningIcon={true}
            />

            {/* Success Dialog */}
            <Dialog
                visible={showSuccessDialog}
                onConfirm={handleSuccessDialogConfirm}
                onClose={() => setShowSuccessDialog(false)}
                title="مبارک ہو! آپ کی سرگرمی جمع کر دی گئی ہے!"
                description="آپ کی سرگرمی کامیابی سے سبمٹ ہو چکی ہے۔ آپ چاہیں تو جمع شدہ سرگرمیاں دیکھ سکتے ہیں یا واپس ہوم پیج پر جا سکتے ہیں۔"
                confirmText="ٹھیک ہے"
                showSuccessIcon={true}
            />
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.md,
    },
    dropdownContainer: {
        marginBottom: SPACING.md,
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        padding: SPACING.sm,
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.error || 'red',
    },
    errorText: {
        color: COLORS.error || 'red',
        textAlign: 'right',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: SPACING.md,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: SPACING.md,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },
});

export default ActivityScreen;