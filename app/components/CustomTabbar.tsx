import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeIconBlack from "../../assets/images/home-icon-black.svg";
import ArkanIconBlack from "../../assets/images/arkan-icon-black.svg";
import ActivitiesIconBlack from "../../assets/images/activities-icon-black.svg";
import ReportIcon2Black from "../../assets/images/report-icon-2-black.svg";
import HomeIconWhite from "../../assets/images/home-icon-white.svg";
import ArkanIconWhite from "../../assets/images/arkan-icon-white.svg";
import ActivitiesIconWhite from "../../assets/images/activities-icon-white.svg";
import ReportIcon2White from "../../assets/images/report-icon-2-white.svg";

function getIcon({ label, focused }) {
    return (
        focused
        ? <View>
            {label === 'Dashboard' && <HomeIconWhite style={{ width: 34, height: 32 }} />}
            {label === 'Arkan' && <ArkanIconWhite style={{ width: 34, height: 32 }} />}
            {label === 'Activities' && <ActivitiesIconWhite style={{ width: 34, height: 32 }} />}
            {label === 'Reports' && <ReportIcon2White style={{ width: 34, height: 32 }} />}
        </View>
        : <View>
            {label === 'Dashboard' && <HomeIconBlack style={{ width: 34, height: 32 }} />}
            {label === 'Arkan' && <ArkanIconBlack style={{ width: 34, height: 32 }} />}
            {label === 'Activities' && <ActivitiesIconBlack style={{ width: 34, height: 32 }} />}
            {label === 'Reports' && <ReportIcon2Black style={{ width: 34, height: 32 }} />}
        </View>
    );
}

function CustomTabBarButton({ focused, color, size, label, onPress }) {
    return (
        <TouchableOpacity onPress={onPress}>
            <View style={[{flexDirection: "row"}, {paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5} , {borderRadius: 50}, { alignItems: 'center' }, { backgroundColor: focused ? 'blue' : 'transparent' }]}>
                {getIcon({ label, focused })} 
                {focused && <Text style={{ paddingStart: 5, color: 'white' }}>{label}</Text>}
            </View>
        </TouchableOpacity>
    );
}

const CustomToolbar = () => {
    const [selectedTab, setSelectedTab] = useState('Dashboard');

    const handleTabPress = (label: string) => {
        setSelectedTab(label);
    };

    const navigation = useNavigation(); // Hook for navigation

    return (
        <View style={styles.toolbar}>
            <CustomTabBarButton
                focused={selectedTab === 'Dashboard'}
                color={undefined}
                size={undefined}
                label={"Dashboard"}
                onPress={() => handleTabPress('Dashboard')} />
            <CustomTabBarButton
                focused={selectedTab === 'Arkan'}
                color={undefined}
                size={undefined}
                label={"Arkan"}
                onPress={() => handleTabPress('Arkan')} />
            <CustomTabBarButton
                focused={selectedTab === 'Activities'}
                color={undefined}
                size={undefined}
                label={"Activities"}
                onPress={() => handleTabPress('Activities')} />
            <CustomTabBarButton
                focused={selectedTab === 'Reports'}
                color={undefined}
                size={undefined}
                label={"Reports"}
                onPress={() => handleTabPress('Reports')} />
        </View>
    );
};

const styles = StyleSheet.create({
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 50,
        padding: 10,
        height: 60,
    },
});

export default CustomToolbar;
