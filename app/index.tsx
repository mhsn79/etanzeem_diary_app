import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import CustomTextInput from "./components/CustomTextInput";
import CustomButton from "./components/CustomButton";
import { useState } from "react";
import { router } from 'expo-router';
import { createDirectus, authentication, rest } from '@directus/sdk';

const client = createDirectus('http://174.138.29.121:8055')
  .with(authentication('json'))
  .with(rest());

async function loginUser(email: string, password: string, setEmailErr: Function, setPassErr: Function, setErrText: Function){

  setEmailErr(false);
  setPassErr(false);
  setErrText("");

  if(email.length === 0){
    setEmailErr(true);
    setErrText("email is required");
    return;
  }
  else if(password.length === 0){
    setPassErr(true);
    setErrText("password is required");
    return;
  }

  const result = await client.login(email, password).then((value) => value, (err) => err);
  console.log(result);

  if(result.errors){
    setEmailErr(true);
    setPassErr(true);
    setErrText("invalid credentials");
    return;
  }

  router.replace("/home")

}

export default function Index() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErr, setEmailErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [errText, setErrText] = useState("");

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <StatusBar hidden={true}/>
        <View style={styles.background}>
          <View style={styles.logoContainer}>
            <Image source={require("../assets/images/pattern.png")} style={styles.pattern}></Image>
            <Image source={require("../assets/images/jamat-logo.png")} style={styles.logo}></Image>
            <Text style={styles.title}>ای تنظیم ڈائری</Text>
          </View>
          <View style={styles.loginContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>ای میل</Text>
              <CustomTextInput
                placeholder="اپنی ای میل درج کریں"
                placeholderTextColor={"#2D2327"}
                onChangeText={newText => setEmail(newText)}
                value={email}
                error={emailErr}
              ></CustomTextInput>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>پاسوڑڈ</Text>
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
                <Text style={styles.resetPass}>پاس ورڈ ری سیٹ کریں</Text>
              </Pressable >
            </View>
            <CustomButton text={"لاگ اِن کریں"} onPress={() => loginUser(email, password, setEmailErr, setPassErr, setErrText)}></CustomButton>
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
})
