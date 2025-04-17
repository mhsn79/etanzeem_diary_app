import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import ScreenLayout from '@/app/components/ScreenLayout';
import { useNavigation } from 'expo-router';
import CustomDropdown from '@/app/components/CustomDropdown';
import FormInput from '@/app/components/FormInput';
import DateTimePickerModal from './DateTimePickerModal';
import CustomButton from '@/app/components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

const ScheduleActivitiesScreen = () => {
    const navigation = useNavigation();
    const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const [formData, setFormData] = useState({
        activityName: '',
        place: '',
        description: '',
    });

    const activityNameOptions = [
        { id: '1', label: 'ارکان میں اضافہ', value: '1' },
        { id: '2', label: 'امیدواروں کا اضافہ/کمی — پارٹی تنظیم کے اندر', value: '2' },
        { id: '3', label: 'امیدواران میں اضافہ فیصد', value: '3' },
    ];

    const placeOptions = [
        { id: '1', label: 'پارٹی کا ہیڈ آفس، لاہور', value: '' },
        { id: '2', label: 'یونین کونسل 1', value: '' },
        { id: '3', label: 'یونین کونسل 2', value: '' },
        { id: '4', label: 'یونین کونسل 3', value: '' },
        { id: '5', label: 'یونین کونسل 4', value: '' },
        { id: '6', label: 'یونین کونسل 5', value: '' },
        { id: '7', label: 'یونین کونسل 6', value: '' },
        { id: '8', label: 'یونین کونسل 7', value: '' },
        { id: '9', label: 'یونین کونسل 8', value: '' },
        { id: '10', label: 'یونین کونسل 9', value: '' },




    ];

    const handleBack = () => {
        navigation.goBack();
    };

    const handleDateTimeSelect = (date: Date) => {
        setSelectedDateTime(date);
        setDateTimePickerVisible(false);
    };

    const handleInputChange = (field: string) => (value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleActivityNameSelect = (option: { id: string; label: string; value: string }) => {
        setFormData(prev => ({
            ...prev,
            activityName: option.value
        }));
    };

    const handlePlaceSelect = (option: { id: string; label: string; value: string }) => {
        setFormData(prev => ({
            ...prev,
            place: option.value
        }));
    };
    const handleGroupSelect = (option: { id: string; label: string; value: string }) => {
        setFormData(prev => ({
            ...prev,
            place: option.value
        }));
    };
    const handleSubmit = () => {
        // Handle form submission
        console.log('Form submitted:', { ...formData, dateTime: selectedDateTime });
    };

    return (
        <ScreenLayout title="سرگرمی شیڈول کریں" onBack={handleBack}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <CustomDropdown
                        options={activityNameOptions}
                        onSelect={handleActivityNameSelect}
                        dropdownTitle="سرگرمی کی قسم"
                        placeholder="سرگرمی کا نام منتخب کریں"
                        selectedValue={formData.activityName}
                        dropdownContainerStyle={styles.dropdownContainer}
                    />
                    <FormInput
                        rightIcon={<TouchableOpacity onPress={() => setDateTimePickerVisible(true)}>
                            <Ionicons name="calendar" size={24} color={COLORS.primary} />
                        </TouchableOpacity>}
                        inputTitle="تاریخ اور وقت"
                        value={selectedDateTime ? selectedDateTime.toLocaleString() : ''}
                        onChange={() => { }}
                        placeholder="تاریخ اور وقت منتخب کریں"
                    />



                    <CustomDropdown
                        options={placeOptions}
                        onSelect={handlePlaceSelect}
                        placeholder="جگہ / مقام"
                        dropdownTitle="جگہ"
                        selectedValue={formData.place}
                        dropdownContainerStyle={styles.dropdownContainer}
                    />


                    <CustomDropdown
                        options={placeOptions}
                        onSelect={handleGroupSelect}
                        placeholder="اطلاع دینے کے لیے گروپ سیلیکٹ کریں"
                        dropdownTitle="جگہ"
                        selectedValue={formData.place}
                        dropdownContainerStyle={styles.dropdownContainer}
                    />

                </View>

            </ScrollView>
            <View style={styles.buttonContainer}>
                <CustomButton
                    text="سرگرمی شیڈول کریں"
                    onPress={handleSubmit}
                    viewStyle={[{ backgroundColor: COLORS.primary, flex: 1, marginHorizontal: SPACING.sm }]}
                    textStyle={[{ color: COLORS.white }]}
                />
            </View>
            <DateTimePickerModal
                isVisible={isDateTimePickerVisible}
                onClose={() => setDateTimePickerVisible(false)}
                onSelect={handleDateTimeSelect}
                selectedDate={selectedDateTime}
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
    dateTimeInput: {
        marginBottom: SPACING.md,
    },
    dropdownContainer: {
        marginBottom: SPACING.md,
    },
    descriptionInput: {
        marginBottom: SPACING.lg,
        minHeight: 120,
    },
    submitButton: {
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    submitButtonText: {
        color: COLORS.white,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: SPACING.md * 1,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: SPACING.md,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },
});

export default ScheduleActivitiesScreen; 