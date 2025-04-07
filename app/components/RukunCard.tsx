// import { router } from "expo-router";
import React, { useState } from "react";
import { ImageStyle, Linking, Pressable, PressableProps, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { Image, ScrollView, KeyboardAvoidingView, Platform, StatusBar, useColorScheme } from 'react-native';
import i18n from "@/app/i18n";
import CustomButton from "./CustomButton";
import { Line } from "react-native-svg";
import { RukunData } from "../models/RukunData";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/src/types/RootStackParamList";

// Define the props for our component
type RukunListItemProps = {
    item?: RukunData | any;
};

const RukunCard: React.FC<RukunListItemProps> = ({ item }) => {
    const handleCall = () => {
        if (item.phone) {
            Linking.openURL(`tel:${item.phone}`);
        }
    };

    const handleWhatsApp = () => {
        if (item.whatsApp) {
            Linking.openURL(`whatsapp://send?phone=${item.whatsApp}`);
        }
    };

    const handleSMS = () => {
        if (item.sms) {
            Linking.openURL(`sms:${item.sms}`);
        }
    };

    // Set up navigation
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Handle navigation to details screen
    const handleViewDetails = () => {
        navigation.navigate('screens/RukunView', { rukun: item });
    };

    // const [pressed, setPressed] = useState(false);
    console.log(item);

    return (
        <View style={[styles.imageContainer, { padding: 10, marginTop: 10 }]}>
            <View style={[{ flexDirection: "column" }]}>
                <View style={[{ flexDirection: "row" }]}>
                    <Image
                        source={require('@/assets/images/avatar.png')}
                        style={[styles.logo]}
                    />
                    <View style={[{ flexDirection: "column", paddingStart: 5, flex: 1 }]}>
                        <View style={[{ flexDirection: "row", alignItems: "center" }]}>
                            <Text style={[styles.nameStyle, { flexWrap: 'wrap' }]}>{item.name}</Text>
                        </View>
                        <View style={[{ flexDirection: "row", alignItems: "center" }]}>
                            {/* <Spacer height={10} width={"100%"}></Spacer> */}
                            {/* <UrduText style={{ color: "white", fontSize: 18 }}>{address}</UrduText> */}
                            <Image
                                source={require('@/assets/images/location-icon-blue.png')}
                                style={[{ height: 16, width: 16 }]}
                            />
                            <Text style={[{ flexWrap: 'wrap' }]}>{item.address}</Text>
                        </View>
                    </View>
                    <Pressable 
                    // onPress={() => router.replace('/screens/Rukun')}
                    onPress={handleViewDetails}
                    >
                        <Image
                            source={require('@/assets/images/edit-icon-2.png')}
                            style={[{ width: 20, height: 20 }]}
                        />
                    </Pressable>
                </View>
                <Line stroke={'white'} strokeWidth={1} />
                <View style={[{ flexDirection: "row", flex: 1 }]}>
                    {item.phone && <CustomButton
                        text={i18n.t('call')}
                        style={{ margin: 5 }}
                        viewStyle={[{ backgroundColor: 'white', borderRadius: 15, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5 }]}
                        textStyle={[{ color: 'black' }]}
                        iconImage={require("@/assets/images/phone-icon.png")}
                        // onPress={() => call(item.phone)}
                        onPress={handleCall}
                    />}
                    {item.whatsApp && <CustomButton
                        text={i18n.t('whatsapp')}
                        style={{ margin: 5 }}
                        viewStyle={[{ backgroundColor: 'white', borderRadius: 15, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5 }]}
                        textStyle={[{ color: 'black' }]}
                        iconImage={require("@/assets/images/whatsapp-icon.png")}
                        // onPress={() => whatsapp(item.whatsApp)}
                        onPress={handleWhatsApp}
                    />}
                    {item.sms && <CustomButton
                        text={i18n.t('sms')}
                        style={{ margin: 5 }}
                        viewStyle={[{ backgroundColor: 'white', borderRadius: 15, alignItems: "center", paddingHorizontal: 10, paddingVertical: 5 }]}
                        textStyle={[{ color: 'black' }]}
                        iconImage={require("@/assets/images/sms-icon.png")}
                        // onPress={() => sms(item.sms)}
                        onPress={handleSMS}
                    />}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        backgroundColor: '#F3F3F3',
        borderRadius: 15,
        // alignItems: 'center', // Center the image
        // marginTop: -30, // To overlap slightly above the header (optional)
    },
    logo: {
        width: 72, // Adjust your image size
        height: 72, // Adjust your image size
        resizeMode: 'contain', // Ensure it fits inside the container
        borderColor: '#008CFF',
        borderWidth: 1,
        borderRadius: 50,
        padding: 2,
        margin: 10
    },
    nameStyle: {
        color: '#008CFF',
        fontSize: 24,
        marginStart: 0,
    }
});

export default RukunCard;