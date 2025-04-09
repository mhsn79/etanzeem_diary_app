import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import { useEffect, useState } from "react";
import { router } from 'expo-router';
import { createDirectus, authentication, rest } from '@directus/sdk';
import i18n from "../i18n";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
// import { Appearance, useColorScheme } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL as string;

const client = createDirectus(BASE_URL)
  .with(authentication('json'))
  .with(rest());

async function loginUser(email: string, password: string, setEmailErr: Function, setPassErr: Function, setErrText: Function) {

  setEmailErr(false);
  setPassErr(false);
  setErrText("");

  if (email.length === 0) {
    setEmailErr(true);
    setErrText(i18n.t('email_is_required'));
    return;
  }
  else if (password.length === 0) {
    setPassErr(true);
    setErrText(i18n.t('password_is_required'));
    return;
  }

  const result = await client.login(email, password).then((value) => value, (err) => err);

  if (result.errors) {
    setEmailErr(true);
    setPassErr(true);
    setErrText(i18n.t('invalid_credentials'));
    return;
  }

  router.replace("/screens/Dashboard")
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.locale);

  const changeLanguage = async (languageCode: string) => {
    try {
      await AsyncStorage.setItem('userLanguage', languageCode);
      i18n.locale = languageCode;
      setCurrentLanguage(languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const [email, setEmail] = useState("sohail-abubaker@pixelpk.com");
  const [password, setPassword] = useState("12345678");
  const [emailErr, setEmailErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [errText, setErrText] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // useEffect(() => {
  //   setTimeout(() => {
  //     router.replace("/TestScreen")
  //   }, 2000);  // Show for 2 seconds
  // }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <StatusBar hidden={true} />
        <View style={styles.background}>
          <View style={styles.logoContainer}>
            <Image source={require("../../assets/images/pattern.png")} style={styles.pattern}></Image>
            <Image source={require("../../assets/images/jamat-logo.png")} style={styles.logo}></Image>
            <Text style={styles.title}>{i18n.t('appname')}</Text>
            {/* , width: 50, height: 50, backgroundColor: "#008CFF", borderColor: "gray", shadowColor: "black", alignContent: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, */}
            {/* <View style={[{ position: "absolute", top: 20, right: 20 }]}>
              <CustomButton
                text={(currentLanguage === "ur" ? "En" : "ار")}
                textStyle={[{ fontFamily: "Tahoma", fontSize: 16 }]}
                viewStyle={[{ width: 50, height: 50, padding: 5, opacity: 0.5, borderWidth: 1, borderColor: "black", direction: (currentLanguage === "ur" ? "rtl" : "ltr") }]}
                // , shadowColor: "black", shadowRadius: 1, shadowOpacity: 50,
                onPress={() => {
                  changeLanguage(currentLanguage === "ur" ? "en" : "ur");
                }}
              />
            </View> */}
          </View>
          <View style={styles.loginContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{i18n.t('email')}</Text>
              <CustomTextInput
                placeholder={i18n.t('enter_your_email')}
                placeholderTextColor={"#2D2327"}
                onChangeText={newText => setEmail(newText)}
                value={email}
                error={emailErr}
              ></CustomTextInput>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>{i18n.t('password')}</Text>
              <CustomTextInput
                placeholder="********"
                placeholderTextColor={"#2D2327"}
                secureTextEntry={true}
                onChangeText={newPass => setPassword(newPass)}
                value={password}
                error={passErr}
              ></CustomTextInput>
            </View>
            <Text style={styles.errText}>{errText}</Text>
            <View style={styles.resetPass}>
              <Pressable onPress={() => console.log("password reset")}>
                <Text style={styles.resetPass}>{i18n.t('reset_your_password')}</Text>
              </Pressable >
            </View>
            <CustomButton text={i18n.t('login')} textStyle={[]} onPress={() => loginUser(email, password, setEmailErr, setPassErr, setErrText)} viewStyle={[]}></CustomButton>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#008CFF"
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    position: "absolute",
    top: 45,
    color: "white",
    fontSize: 30,
    fontFamily: "JameelNooriNastaleeq"
  },
  pattern: {
    width: "100%",
    height: "auto",
    aspectRatio: 1,
    opacity: 0.5
  },
  logo: {
    position: "absolute",
  },
  loginContainer: {
    flex: 1,
    backgroundColor: "#EBEBEB",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
    gap: 10,
    paddingTop: 60,
    padding: 25

  },
  inputContainer: {
    alignItems: "flex-end",
    width: "100%",
    gap: 10
  },
  inputText: {
    fontSize: 16,
    fontFamily: "JameelNooriNastaleeq",
    color: "#2D2327"
  },
  errText: {
    alignSelf: "flex-end",
    color: "#EA5455"
  },
  resetPass: {
    fontSize: 12,
    fontFamily: "JameelNooriNastaleeq",
    color: "#2D2327",
    alignSelf: "flex-start",
  },
  ddcontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ddheader: {
    fontSize: 24,
    marginBottom: 20,
  },
});
