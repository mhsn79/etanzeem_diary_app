import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import ScreenLayout from '@/app/components/ScreenLayout';
import { useNavigation } from 'expo-router';
import CustomDropdown from '@/app/components/CustomDropdown';
import FormInput from '@/app/components/FormInput';
import DateTimePickerModal from './components/DateTimePickerModal';
import CustomButton from '@/app/components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

const MeetingScreen = () => {
    const navigation = useNavigation();
    const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const [formData, setFormData] = useState({
        place: '',
        purposeOfMeeting: '',
        listOfPersons: '',
    });



    const meetingPlaceOptions = [
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

    const purposeOfMeetingOptions = [
        { id: '1', label: 'ترقیاتی امور', value: '' },
        { id: '2', label: 'منصوبہ بندی', value: '' },
        { id: '3', label: 'سیاسی ملاقات', value: '' },
        { id: '4', label: 'عوامی مسائل', value: '' },
        { id: '5', label: 'صحت و سلامتی', value: '' },
    ];

    const listOfPersonsOptions = [
        { id: '1', label: 'UC چیئرمین', value: '' },
        { id: '2', label: 'سیاسی رہنما', value: '' },
        { id: '3', label: 'علاقہ کے نمائندگان', value: '' },
        { id: '4', label: 'پارٹی کے اعضاء', value: '' },
        { id: '5', label: 'عوام', value: '' },
        { id: '6', label: 'پارٹی کے علاقہ کے نمائندگان', value: '' },
    ];

    const handleBack = () => {
        navigation.goBack();
    };

    const handleDateTimeSelect = (date: Date) => {
        setSelectedDateTime(date);
        setDateTimePickerVisible(false);
    };


    const handlePlaceSelect = (option: { id: string; label: string; value: string }) => {
        setFormData(prev => ({
            ...prev,
            place: option.value
        }));
    };

    const handlePurposeOfMeetingSelect = (option: { id: string; label: string; value: string }) => {
        setFormData(prev => ({
            ...prev,
            purposeOfMeeting: option.value
        }));
    };

    const handleListOfPersonsSelect = (option: { id: string; label: string; value: string }) => {
        setFormData(prev => ({
            ...prev,
            listOfPersons: option.value
        }));
    };

    const handleSubmit = () => {
        // Handle form submission
        console.log('Form submitted:', { ...formData, dateTime: selectedDateTime });
    };

    return (
        <ScreenLayout title="ملاقات شیڈول کریں" onBack={handleBack}>
            <ScrollView style={styles.container}>
                <View style={styles.content}>

                    <FormInput
                        rightIcon={<TouchableOpacity onPress={() => setDateTimePickerVisible(true)}>
                            <Ionicons name="calendar" size={24} color="black" />
                        </TouchableOpacity>}
                        inputTitle="ملاقات کی تاریخ"
                        value={selectedDateTime ? selectedDateTime.toLocaleString() : ''}
                        onChange={() => { }}
                        placeholder="تاریخ اور وقت منتخب کریں"
                    />

                    <CustomDropdown
                        options={meetingPlaceOptions}
                        onSelect={handlePlaceSelect}
                        dropdownTitle="ملاقات کا مقام"
                        placeholder="ملاقات کا مقام منتخب کریں"
                        selectedValue={formData.place}
                        dropdownContainerStyle={styles.dropdownContainer}
                    />

                    <CustomDropdown
                        options={purposeOfMeetingOptions}
                        onSelect={handlePurposeOfMeetingSelect}
                        placeholder="ملاقات کا مقصد"
                        dropdownTitle="ملاقات کا مقصد"
                        selectedValue={formData.purposeOfMeeting}
                        dropdownContainerStyle={styles.dropdownContainer}
                    />

                    <CustomDropdown
                        options={listOfPersonsOptions}
                        onSelect={handleListOfPersonsSelect}
                        placeholder="شخصیات کی فہرست"
                        dropdownTitle="شخصیات کی فہرست"
                        selectedValue={formData.listOfPersons}
                        dropdownContainerStyle={styles.dropdownContainer}
                    />

                </View>

            </ScrollView>
            <View style={styles.buttonContainer}>
                <CustomButton
                    text="رپورٹ جمع کروائیں"
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

export default MeetingScreen; 