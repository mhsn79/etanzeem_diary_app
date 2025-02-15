import { Image, KeyboardAvoidingView, Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";

export default function Index(){
  return (
    <View style={styles.background}>
      <StatusBar hidden={true}/>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/images/pattern.png")} style={styles.pattern}></Image>
        <Image source={require("../assets/images/jamat-logo.png")} style={styles.logo}></Image>
        <Text style={styles.title}>ای تنظیم ڈائری</Text>
      </View>
      <View style={styles.loginContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>فون نمبر</Text>
          <TextInput style={styles.inputField} placeholder="اپنا فون نمبر درج کریں" placeholderTextColor={"#2D2327"}></TextInput>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>پاسوڑڈ</Text>
          <TextInput style={styles.inputField} placeholder="********" placeholderTextColor={"#2D2327"} secureTextEntry={true}></TextInput>
        </View>
        <View style={styles.resetPass}>
          <Pressable onPress={() => console.log("password reset")}>
            <Text style={styles.resetPass}>پاس ورڈ ری سیٹ کریں</Text>
          </Pressable>
        </View>
        <Pressable style={styles.loginButton}>
          <Text style={styles.loginButtonText}>لاگ اِن کریں</Text>
        </Pressable>
      </View>
    </View>
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
    fontFamily: "JameelNoori"
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
    height: 84,
    gap: 10
  },
  inputText: {
    fontSize: 16,
    fontFamily: "JameelNoori",
    color: "#2D2327"
  },
  inputField: {
    fontSize: 16,
    fontFamily: "JameelNoori",
    backgroundColor: "#F7F7F7",
    borderColor: "#EBEBEB",
    borderWidth: 1,
    borderRadius: 8,
    width: "100%",
    padding: 12,
    height: 48,
    textAlign: "right",
  },
  resetPass: {
    fontSize: 12,
    fontFamily: "JameelNoori",
    color: "#2D2327",
    alignSelf: "flex-start",
  },
  loginButton: {
    marginTop: 30,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#008CFF",
    padding: 12,
    borderRadius: 8,
    height: 48
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: "JameelNoori",
    color: "white"
  }
})
