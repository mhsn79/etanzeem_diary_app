import React from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import i18n from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RukunData } from '../models/RukunData';
import { Line } from 'react-native-svg';
import CustomButton from '../components/CustomButton';
import { Linking, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "../../src/types/RootStackParamList";

type RukunDetailsRouteProp = RouteProp<RootStackParamList, 'screens/RukunAddEdit'>;

export default function RukunAddEdit() {

  const route = useRoute<RukunDetailsRouteProp>();
  const { rukun } = route.params;

  // let rukun: RukunData = { id: 1, name: "Rukun 1", address: "Apartment 1, Street 1, Area 1, Islamabad", phone: "0000000000000", whatsApp: "923001231111", sms: "0000000000000", picture: undefined }

  const insets = useSafeAreaInsets();

  const handlePictureUpdate = () => {
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[{ flexGrow: 1, paddingTop: insets.top }]} style={styles.container}>

        <View style={[{direction: i18n.locale === 'ur' ? 'rtl' : 'ltr'}]}>
          <Pressable onPress={handlePictureUpdate}>
            <Image
              source={require('../../assets/images/edit-icon-2.png')}
              style={[{ width: 20, height: 20 }]}
            />
          </Pressable>
          <View style={[styles.imageContainer, { padding: 10, alignContent: "center", alignItems: "center", marginTop: 10 }]}>
            <Image
              source={require('../../assets/images/avatar.png')}
              style={[styles.logo]}
            />
          </View>
          <View style={[{ alignContent: "center", alignItems: "center", marginTop: 10 }]}>
            <Text style={[styles.nameStyle, { flex: 1, flexWrap: 'wrap', alignContent: "center", alignItems: "center", justifyContent: "center" }]}>{rukun.name}</Text>
            <View style={[{ flex: 1, flexDirection: "row", alignItems: "center", alignContent: "center" }]}>
              {/* <Spacer height={10} width={"100%"}></Spacer> */}
              {/* <UrduText style={{ color: "white", fontSize: 18 }}>{address}</UrduText> */}
              <Image
                source={require('../../assets/images/location-icon-blue.png')}
                style={[{ height: 16, width: 16 }]}
              />
              <Text style={[{ flexWrap: 'wrap' }]}>{rukun.address}</Text>
            </View>
          </View>
          <View style={[{ flexDirection: "column", flex: 1 }]}>
            <Text style={[styles.textItem]}>
              {i18n.t("parent")}
            </Text>
            <TextInput>
              {rukun.parent}
            </TextInput>
            <Text style={[styles.textItem]}>
              {i18n.t("dob")}
            </Text>
            <TextInput>
              {rukun.dob}
            </TextInput>
            <Text style={[styles.textItem]}>
              {i18n.t("cnic")}
            </Text>
            <TextInput>
              {rukun.cnic}
            </TextInput>
            <Text style={[styles.textItem]}>
              {i18n.t("unit")}
            </Text>
            <TextInput>
              {rukun.unit}
            </TextInput>
            <Text style={[styles.textItem]}>
              {i18n.t("status")}
            </Text>
            <TextInput>
              {rukun.status}
            </TextInput>
            <Text style={[styles.textItem]}>
              {i18n.t("phone_number")}
            </Text>
            <TextInput>
              {rukun.phone}
            </TextInput>
            <Text style={[styles.textItem]}>
              {i18n.t("whatsapp_number")}
            </Text>
            <TextInput>
              {rukun.whatsApp}
            </TextInput>
            <Text style={[styles.textItem]}>
              {i18n.t("email")}
            </Text>
            <TextInput>
              {rukun.email}
            </TextInput>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    // backgroundColor: '#F3F3F3',
    // borderRadius: 15,
    // alignItems: 'center', // Center the image
    // marginTop: -30, // To overlap slightly above the header (optional)
  },
  logo: {
    width: 122, // Adjust your image size
    height: 122, // Adjust your image size
    resizeMode: 'contain', // Ensure it fits inside the container
    borderColor: '#0BA241',
    borderWidth: 1,
    borderRadius: 65,
    padding: 2,
    margin: 10
  },
  nameStyle: {
    color: '#008CFF',
    fontSize: 28,
    // marginStart: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  textItem: {
    color: '#000000',
    fontFamily: "JameelNooriNastaleeq",
    fontSize: 16,
    marginVertical: 5,
  }
});
