import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import CustomTextInput from "./components/CustomTextInput";
import CustomButton from "./components/CustomButton";

export default function Index() {
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
              <Text style={styles.inputText}>فون نمبر</Text>
              <CustomTextInput placeholder="اپنا فون نمبر درج کریں" placeholderTextColor={"#2D2327"}></CustomTextInput>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>پاسوڑڈ</Text>
              <CustomTextInput placeholder="********" placeholderTextColor={"#2D2327"} secureTextEntry={true}></CustomTextInput>
            </View>
            <View style={styles.resetPass}>
              <Pressable onPress={() => console.log("password reset")}>
                <Text style={styles.resetPass}>پاس ورڈ ری سیٹ کریں</Text>
              </Pressable >
            </View>
            <CustomButton text={"لاگ اِن کریں"} onPress={() => console.log("login")}></CustomButton>
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
  resetPass: {
    fontSize: 12,
    fontFamily: "JameelNooriNastaleeq",
    color: "#2D2327",
    alignSelf: "flex-start",
  },
})
