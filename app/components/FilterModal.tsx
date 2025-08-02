import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { SimpleLineIcons } from '@expo/vector-icons';
import UrduText from './UrduText';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { selectAllHierarchyUnits } from '../features/tanzeem/tanzeemSlice';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApplyFilter: (selectedTime: string, startDate: Date, endDate: Date, selectedUnitId: number | null) => void;
    onResetFilter: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApplyFilter, onResetFilter }) => {
    const [selectedTime, setSelectedTime] = useState('all');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [showDatePickerModal, setShowDatePickerModal] = useState(false);
    const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
    const [currentDatePicker, setCurrentDatePicker] = useState<'start' | 'end' | null>(null);
    const [androidDateType, setAndroidDateType] = useState<'start' | 'end' | null>(null);

    // Helper function to format unit name with description
    const formatUnitName = (unit: any) => {
        const name = unit.name || unit.Name || '';
        const description = unit.description || unit.Description || '';
        
        // If description exists and is different from name, append it
        if (description && description !== name) {
            return `${name} (${description})`;
        }
        
        return name;
    };

    const allHierarchyUnits = useSelector(selectAllHierarchyUnits);

    const handleReset = () => {
        setSelectedTime('');
        setStartDate(new Date());
        setEndDate(new Date());
        setSelectedUnitId(null);
        onResetFilter(); // Trigger reset in parent
    };

    const handleApply = () => {
        onApplyFilter(selectedTime, startDate, endDate, selectedUnitId);
        onClose();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ur-PK', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleDatePress = (type: 'start' | 'end') => {
        if (Platform.OS === 'ios') {
            setCurrentDatePicker(type);
            setShowDatePickerModal(true);
        } else {
            setAndroidDateType(type);
            setShowAndroidDatePicker(true);
        }
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
        if (Platform.OS === 'ios') {
            if (selectedDate) {
                if (currentDatePicker === 'start') {
                    setStartDate(selectedDate);
                } else {
                    setEndDate(selectedDate);
                }
            }
            setShowDatePickerModal(false);
            setCurrentDatePicker(null);
        } else {
            setShowAndroidDatePicker(false);
            if (selectedDate) {
                if (androidDateType === 'start') {
                    setStartDate(selectedDate);
                } else {
                    setEndDate(selectedDate);
                }
            }
            setAndroidDateType(null);
        }
    };

    const handleCancelDate = () => {
        setShowDatePickerModal(false);
        setCurrentDatePicker(null);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <SimpleLineIcons name="close" size={60} color={COLORS.white} />
                </TouchableOpacity>

                <View style={styles.modalContent}>
                    <View style={styles.titleContainer}>
                        <UrduText style={styles.title}>فلٹر تلاش کریں</UrduText>
                    </View>
{allHierarchyUnits.length > 0 &&
 <View style={styles.sectionContainer}>
 <UrduText style={styles.sectionTitle}>یوسی / علاقہ منتخب کریں</UrduText>
 <View style={styles.areaOptionsContainer}>
     {allHierarchyUnits.map((unit) => (
         <TouchableOpacity
             key={unit.id}
             style={[
                 styles.areaOption,
                 selectedUnitId === unit.id && styles.selectedAreaOption,
             ]}
             onPress={() => setSelectedUnitId(unit.id)}
         >
             <UrduText
                 numberOfLines={1}
                 style={[
                     styles.areaOptionText,
                     selectedUnitId === unit.id && styles.selectedAreaOptionText,
                 ]}
             >
                 {formatUnitName(unit)}
             </UrduText>
         </TouchableOpacity>
     ))}
 </View>
</View>
 }
                   

                    <View style={styles.sectionContainer}>
                        <UrduText style={styles.sectionTitle}>مہینہ اور سال منتخب کریں</UrduText>
                        <View style={styles.dateContainer}>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => handleDatePress('start')}
                            >
                                <UrduText style={styles.dateText}>{formatDate(startDate)}</UrduText>
                            </TouchableOpacity>
                            <View style={styles.dateSeparator}>
                                <UrduText style={styles.dateSeparatorText}>سے</UrduText>
                            </View>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => handleDatePress('end')}
                            >
                                <UrduText style={styles.dateText}>{formatDate(endDate)}</UrduText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.applyButton]}
                            onPress={handleApply}
                        >
                            <UrduText style={styles.applyButtonText}>فلٹرز لگائیں</UrduText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.resetButton]}
                            onPress={handleReset}
                        >
                            <UrduText style={styles.resetButtonText}>فلٹر ری سیٹ کریں</UrduText>
                        </TouchableOpacity>
                    </View>
                </View>

                {Platform.OS === 'ios' && showDatePickerModal && (
                    <Modal
                        visible={showDatePickerModal}
                        transparent
                        animationType="slide"
                    >
                        <View style={styles.datePickerModalContainer}>
                            <View style={styles.datePickerModalContent}>
                                <View style={styles.datePickerHeader}>
                                    <TouchableOpacity onPress={handleCancelDate}>
                                        <UrduText style={styles.datePickerButtonText}>منسوخ کریں</UrduText>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                                        <UrduText style={styles.datePickerButtonText}>منتخب کریں</UrduText>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={currentDatePicker === 'start' ? startDate : endDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    style={styles.datePicker}
                                />
                            </View>
                        </View>
                    </Modal>
                )}

                {Platform.OS === 'android' && showAndroidDatePicker && (
                    <DateTimePicker
                        value={androidDateType === 'start' ? startDate : endDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.xl * 8,
        right: SPACING.xl * 5,
        zIndex: 1,
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: BORDER_RADIUS.lg,
        borderTopRightRadius: BORDER_RADIUS.lg,
        width: '100%',
        height: '60%',
        ...SHADOWS.large,
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.black,
        textAlign: 'center',
    },
    sectionContainer: {
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        textAlign: 'left',
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    areaOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        borderRadius: BORDER_RADIUS.md,
    },
    areaOption: {
        flex: 1,
        padding: SPACING.sm2,
        borderRadius: BORDER_RADIUS.sm,
        marginBottom: SPACING.sm,
        marginHorizontal: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.black,
    },
    selectedAreaOption: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    areaOptionText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.black,
        textAlign: 'center',
    },
    selectedAreaOptionText: {
        color: COLORS.white,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateInput: {
        flex: 1,
        padding: SPACING.sm2,
        borderWidth: 1,
        borderColor: COLORS.black,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.white,
    },
    dateSeparator: {
        marginHorizontal: SPACING.lg,
    },
    dateSeparatorText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.black,
    },
    dateText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.black,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        marginTop: 'auto',
        marginBottom: SPACING.xl,
    },
    button: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginHorizontal: SPACING.sm,
    },
    resetButton: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.lightPrimary,
    },
    applyButton: {
        backgroundColor: COLORS.primary,
    },
    resetButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.primary,
        textAlign: 'center',
    },
    applyButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.white,
        textAlign: 'center',
    },
    datePickerModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    datePickerModalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.lg,
        borderTopRightRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    datePickerButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        color: COLORS.primary,
    },
    datePicker: {
        height: 200,
    },
});

export default FilterModal;
