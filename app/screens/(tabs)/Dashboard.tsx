import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/app/i18n';
import CustomDropdown from "@/app/components/CustomDropdown";
import CustomButton from '@/app/components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Spacer from '@/app/components/Spacer';
import SmallTarazu from "@/assets/images/small-tarazu.svg";
import LocationIcon from "@/assets/images/location-icon-yellow.svg";
import UserIcon from "@/assets/images/user-icon.svg";
import ReportIcon1 from "@/assets/images/report-icon-1.svg";
import LeftUpArrowWhite from "@/assets/images/left-up-arrow-white.svg";
import LeftUpArrowBlue from "@/assets/images/left-up-arrow-blue.svg";
import UrduText from '@/app/components/UrduText';

const Dashboard = () => {
    const insets = useSafeAreaInsets(); // Get safe area insets

    const [currentLanguage, setCurrentLanguage] = React.useState(i18n.locale);
    const [direction, setDirection] = useState(currentLanguage === "ur" ? 'rtl' : 'ltr');

    const changeLanguage = async (languageCode: string) => {
        try {
            await AsyncStorage.setItem('userLanguage', languageCode);
            i18n.locale = languageCode;
            setCurrentLanguage(languageCode);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };

    const changeDirection = async (dir: string) => {
        try {
            setDirection(dir);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };

    let scheduleForToday = [
        { "eventName": "Event 1", "startTime": "10:00 AM", "endTime": "12:00 PM", "location": "Room 101", "description": "Description for Event 1", "type": "type-1" },
        { "eventName": "Event 2", "startTime": "2:00 PM", "endTime": "4:00 PM", "location": "Room 102", "description": "Description for Event 2", "type": "type-2" },
        { "eventName": "Event 3", "startTime": "5:00 PM", "endTime": "7:00 PM", "location": "Room 103", "description": "Description for Event 3", "type": "type-3" },
        { "eventName": "Event 4", "startTime": "8:00 PM", "endTime": "10:00 PM", "location": "Room 104", "description": "Description for Event 4", "type": "type-4" },
        { "eventName": "Event 5", "startTime": "11:00 PM", "endTime": "1:00 AM", "location": "Room 105", "description": "Description for Event 5", "type": "type-5" }
    ];

    const [durationOpen, setDurationOpen] = useState(false);
    const [durationValue, setDurationValue] = useState(null);
    const [durationItems, setDurationItems] = useState([
        { label: i18n.t('last_2_weeks'), value: 'last_2_weeks' },
        { label: i18n.t('last_4_weeks'), value: 'last_4_weeks' },
        { label: i18n.t('this_month'), value: 'this_month' },
        { label: i18n.t('last_month'), value: 'last_month' },
        { label: i18n.t('last_3_months'), value: 'last_3_months' },
        { label: i18n.t('last_6_months'), value: 'last_6_months' },
        { label: i18n.t('this_year'), value: 'this_year' },
        { label: i18n.t('last_year'), value: 'last_year' },
        { label: i18n.t('last_2_years'), value: 'last_2_years' },
    ]);

    const durationItemNames = [
        { id: '1', label: i18n.t('last_2_weeks'), value: 'last_2_weeks' },
        { id: '2', label: i18n.t('last_4_weeks'), value: 'last_4_weeks' },
        { id: '3', label: i18n.t('this_month'), value: 'this_month' },
        { id: '4', label: i18n.t('last_month'), value: 'last_month' },
        { id: '5', label: i18n.t('last_3_months'), value: 'last_3_months' },
        { id: '6', label: i18n.t('last_6_months'), value: 'last_6_months' },
        { id: '7', label: i18n.t('this_year'), value: 'this_year' },
        { id: '8', label: i18n.t('last_year'), value: 'last_year' },
        { id: '9', label: i18n.t('last_2_years'), value: 'last_2_years' },
    ];

    // Get the current date
    const currentDate = new Date();

    // Format the date as "February 23, 2025"
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let colorScheme = useColorScheme();
    let styles = colorScheme === "dark" ? darkThemeStyles : lightThemeStyles

    useEffect(() => {
        // Load saved language preference
        const loadLanguagePreference = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem('userLanguage');
                if (savedLanguage) {
                    i18n.locale = savedLanguage;
                }
                console.log('savedLanguage', i18n.locale)
            } catch (error) {
                console.error('Error loading language preference:', error);
            }
        };

        loadLanguagePreference();
    }, []);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            {/* <View style={{ flex: 1 }}> */}
            <StatusBar hidden />
            {/* Header section */}
            <View style={{ backgroundColor: (colorScheme === "dark") ? "#23242D" : "#EBEBEB", direction: i18n.locale == 'ur' ? 'rtl' : 'ltr' }}>
                <View style={[styles.header, { paddingTop: 0, height: 200, alignItems: 'center', borderBottomStartRadius: 20, borderBottomEndRadius: 20 }]}>
                    {/* Image section */}
                    <View style={[styles.imageContainer, { padding: 5, marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }]}>
                        <Image
                            source={require('@/assets/images/icon.png')}
                            style={[styles.logo]}
                        />
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={() => router.push("/screens/UnitSelection")}>
                                <View style={[{ flexDirection: "row", alignItems: "center" }]}>
                                    <UrduText kasheedaStyle={true} style={{ color: "white", fontSize: 24, marginHorizontal: 10 }}>{i18n.t('uc')}</UrduText>
                                    <LeftUpArrowWhite style={{ width: 17, height: 17 }} />
                                    <Spacer height={10}></Spacer>
                                </View>
                            </TouchableOpacity>
                            <View style={[{ flexDirection: "row", alignItems: "center" }]}>
                                <LocationIcon style={{ width: 13, height: 16, marginHorizontal: 10 }} />
                                <UrduText style={{ color: "white", fontSize: 18 }}>{i18n.t('zone')}</UrduText>
                                <Spacer height={10} width={"100%"}></Spacer>
                            </View>
                            <TouchableOpacity onPress={() => router.push("/screens/ProfileView")}>
                                <View style={[{ flexDirection: "row", alignItems: "center" }]}>
                                    <UserIcon style={{ width: 14, height: 15, marginHorizontal: 10 }} />
                                    <UrduText style={{ color: "white", fontSize: 18 }}>{i18n.t('nazim')}</UrduText>
                                    <Spacer height={10} width={"100%"}></Spacer>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ position: "absolute", padding: 5, marginTop: 130, width: "100%" }}>
                        {/* Schedule */}
                        <View style={{ backgroundColor: (colorScheme === "dark") ? "#008cff" : "#FFFFFF", height: 100, borderRadius: 15, width: "100%", padding: 5 }}>
                            {/* Schedule Heading */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
                                <UrduText style={{ color: (colorScheme === "dark") ? "white" : "black" }}>{i18n.t("schedule_for_today")}</UrduText>
                                <TouchableOpacity onPress={() => router.push("/screens/Activities")}>
                                    <UrduText style={{ color: (colorScheme === "dark") ? "white" : "black" }}>{i18n.t('view-all')}</UrduText>
                                </TouchableOpacity>
                                <UrduText style={{ color: (colorScheme === "dark") ? "white" : "black" }}>{formattedDate}</UrduText>
                            </View>
                            {/* Schedule Details */}
                            <ScrollView>
                                {scheduleForToday.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => console.log(item)}>
                                        <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
                                            <Text style={{ color: (colorScheme === "dark") ? "white" : "black" }}>{index + 1}</Text>
                                            <Text style={{ color: (colorScheme === "dark") ? "white" : "black" }}>{item.eventName}</Text>
                                            <Text style={{ color: (colorScheme === "dark") ? "white" : "black" }}>{item.startTime}</Text>
                                            {/* <Text style={{ color: (colorScheme === "dark") ? "white" : "black"}}>{item.endTime}</Text> */}
                                            <Text style={{ color: (colorScheme === "dark") ? "white" : "black" }}>{item.location}</Text>
                                            {/* <Text style={{ color: (colorScheme === "dark") ? "white" : "black"}}>{item.description}</Text> */}
                                            {/* <Text style={{ color: (colorScheme === "dark") ? "white" : "black"}}>{item.type}</Text> */}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>

                <View style={{ margin: 15, marginTop: 40, borderRadius: 10, backgroundColor: (colorScheme === 'dark') ? "#373842" : 'transparent', padding: 10 }}>
                    {/* Light Gray Rounded Rectangle: Duration Dropdown + Generate Report */}
                    <View style={[styles.boxRow, { width: "100%", alignItems: "center" }]}>
                        <View style={{ width: 150 }}>
                            <CustomDropdown
                                viewStyle={[{
                                    backgroundColor: "transparent",
                                    height: 48,
                                    // justifyContent: 'center',
                                    // alignItems: 'center'
                                }]}
                                options={durationItemNames}
                                onSelect={console.log}
                                placeholder={i18n.t('select_duration')}
                                textStyle={[{
                                    color: (colorScheme === 'dark') ? "#FFB30F" : "#0BA241",
                                    lineHeight: 28,
                                    includeFontPadding: false,
                                    textAlignVertical: 'center',
                                    padding: 0
                                }]} />
                        </View>
                        <TouchableOpacity style={styles.reportButton} onPress={() => router.push("/screens/ReportsScreen")}>
                            <ReportIcon1 style={{ width: 20, height: 20, marginStart: 10 }} />
                            <UrduText style={styles.reportButtonText}>{i18n.t('generate_report')}</UrduText>
                        </TouchableOpacity>
                    </View>

                    {/* Rows of Boxes (Dark Gray Background) */}
                    <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: 0 }]} style={{ height: 320 }}>
                        {/* <View> */}
                        <View style={styles.boxRow}>
                            <View style={styles.box}>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <TouchableOpacity onPress={() => router.push("/screens/Workforce")}>
                                        <UrduText kasheedaStyle={true} style={styles.boxTitle}>{i18n.t('workforce')}</UrduText>
                                    </TouchableOpacity>
                                    <LeftUpArrowBlue style={[{ transform: [{ rotateY: ((i18n.locale == 'ur') ? "0deg" : "180deg") }] }]} />
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('arkan')}</UrduText>
                                    <UrduText style={styles.boxContent}>50</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('increase')}</UrduText>
                                    <UrduText style={styles.boxContent}>5</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('target')}</UrduText>
                                    <UrduText style={styles.boxContent}>10</UrduText>
                                </View>
                            </View>
                            <View style={styles.box}>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <TouchableOpacity onPress={() => router.push("/screens/UnitSelection")}>
                                        <UrduText kasheedaStyle={true} style={styles.boxTitle}>{i18n.t('sub_units')}</UrduText>
                                    </TouchableOpacity>
                                    <LeftUpArrowBlue style={[{ transform: [{ rotateY: ((i18n.locale == 'ur') ? "0deg" : "180deg") }] }]} />
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('wards')}</UrduText>
                                    <UrduText style={styles.boxContent}>5</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                </View>
                            </View>
                        </View>
                        <View style={styles.boxRow}>
                            <View style={styles.box}>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <TouchableOpacity onPress={() => router.push("/screens/Activities")}>
                                        <UrduText kasheedaStyle={true} style={styles.boxTitle}>{i18n.t('activities')}</UrduText>
                                    </TouchableOpacity>
                                    <LeftUpArrowBlue style={[{ transform: [{ rotateY: ((i18n.locale == 'ur') ? "0deg" : "180deg") }] }]} />
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('organizational')}</UrduText>
                                    <UrduText style={styles.boxContent}>1</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('invitational')}</UrduText>
                                    <UrduText style={styles.boxContent}>1</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('training')}</UrduText>
                                    <UrduText style={styles.boxContent}>1</UrduText>
                                </View>
                            </View>
                            <View style={styles.box}>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <TouchableOpacity onPress={() => router.push("/screens/UnitSelection")}>
                                        <UrduText kasheedaStyle={true} style={styles.boxTitle}>{i18n.t('upper_management')}</UrduText>
                                    </TouchableOpacity>
                                    <LeftUpArrowBlue style={[{ transform: [{ rotateY: ((i18n.locale == 'ur') ? "0deg" : "180deg") }] }]} />
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('activities')}</UrduText>
                                    <UrduText style={styles.boxContent}>1</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>{i18n.t('participation')}</UrduText>
                                    <UrduText style={styles.boxContent}>1</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                </View>
                            </View>
                        </View>
                        <View style={styles.boxRow}>
                            <View style={styles.box}>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <TouchableOpacity onPress={() => router.push("/screens/Meetings")}>
                                        <UrduText kasheedaStyle={true} style={styles.boxTitle}>{i18n.t('visits')}</UrduText>
                                    </TouchableOpacity>
                                    <LeftUpArrowBlue style={[{ transform: [{ rotateY: ((i18n.locale == 'ur') ? "0deg" : "180deg") }] }]} />
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                    <UrduText style={styles.boxContent}>{i18n.t('meetings')}</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                </View>
                            </View>
                            <View style={styles.box}>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <TouchableOpacity onPress={() => router.push("/screens/Income")}>
                                        <UrduText kasheedaStyle={true} style={styles.boxTitle}>{i18n.t('money')}</UrduText>
                                    </TouchableOpacity>
                                    <LeftUpArrowBlue style={[{ transform: [{ rotateY: ((i18n.locale == 'ur') ? "0deg" : "180deg") }] }]} />
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>0</UrduText>
                                    <UrduText style={styles.boxContent}>{i18n.t('income')}</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>0</UrduText>
                                    <UrduText style={styles.boxContent}>{i18n.t('expenses')}</UrduText>
                                </View>
                                <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                    <UrduText style={styles.boxContent}>-</UrduText>
                                </View>
                            </View>
                        </View>
                        {/* </View> */}
                    </ScrollView>
                </View>
            </View >
        </KeyboardAvoidingView >
    );
};

const darkThemeStyles = StyleSheet.create({
    header: {
        backgroundColor: '#23242D',
        height: 100, // Adjust the height of your header
        // justifyContent: 'center',
        paddingHorizontal: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        paddingEnd: 5,
        fontSize: 18,
    },
    imageContainer: {
        // alignItems: 'center', // Center the image
        // marginTop: -30, // To overlap slightly above the header (optional)
    },
    logo: {
        width: 85, // Adjust your image size
        height: 85, // Adjust your image size
        resizeMode: 'contain', // Ensure it fits inside the container
    },
    boxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    box: {
        backgroundColor: '#23242D',
        width: '48%',
        borderRadius: 10,
        padding: 15,
    },
    boxTitle: {
        color: '#fff',
        fontWeight: 'regular',
        fontSize: 16,
        marginBottom: 5,
    },
    boxContent: {
        color: '#575862',
        fontSize: 14,
    },
    reportButton: {
        backgroundColor: '#1E90FF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        height: 48,
        paddingHorizontal: 15,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 20,
        includeFontPadding: false,
        textAlignVertical: 'center',
    }
});

const lightThemeStyles = StyleSheet.create({
    header: {
        backgroundColor: '#008cff',
        height: 100, // Adjust the height of your header
        // justifyContent: 'center',
        paddingHorizontal: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        color: '#1E90FF',
        paddingEnd: 5,
        fontSize: 18,
    },
    imageContainer: {
        // alignItems: 'center', // Center the image
        // marginTop: -30, // To overlap slightly above the header (optional)
    },
    logo: {
        width: 85, // Adjust your image size
        height: 85, // Adjust your image size
        resizeMode: 'contain', // Ensure it fits inside the container
    },
    boxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    box: {
        backgroundColor: "#FFFFFF",
        width: '48%',
        borderRadius: 10,
        padding: 15,
    },
    boxTitle: {
        color: '#1E90FF',
        fontWeight: 'regular',
        fontSize: 16,
        marginBottom: 5,
    },
    boxContent: {
        color: '#000',
        fontSize: 14,
    },
    reportButton: {
        backgroundColor: '#1E90FF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        height: 48,
        paddingHorizontal: 15,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 20,
        includeFontPadding: false,
        textAlignVertical: 'center',
    }
});


export default Dashboard;
