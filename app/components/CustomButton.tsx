import { useState } from "react";
import { Image, ImageStyle, Pressable, PressableProps, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { ImageSource } from "react-native-vector-icons/Icon";

interface CustomButtonProps extends PressableProps {
  text: String;
  viewStyle?: [ViewStyle?];
  textStyle?: [TextStyle?];
  iconImage?: ImageSource;
  iconStyle?: [ImageStyle?];
}

export default function CustomButton({ text, viewStyle, textStyle, ...rest }: CustomButtonProps) {

  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.button,
        pressed && styles.buttonPressed,
        !rest.onPress && styles.disabled,
        viewStyle
      ]}
      disabled={!rest.onPress}
      {...rest}>
      <View style={[{ flexDirection: "row" }, viewStyle]}>
        {/* <Spacer height={10} width={"100%"}></Spacer>
          <UrduText style={{ color: "white", fontSize: 18 }}>{data.phone}</UrduText>
          <UserIcon style={{ width: 14, height: 15, marginStart: 10 }} /> */}
        {rest.iconImage && <Image
          source={rest.iconImage}
          style={[styles.icon]}
        />}
        <Text style={[styles.buttonText, !rest.onPress && styles.disabledText, textStyle]}>{text}</Text>
      </View>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#008CFF",
    padding: 12,
    borderRadius: 8,
    height: 48
  },
  buttonPressed: {
    backgroundColor: "#006CC5"
  },
  disabled: {
    backgroundColor: "#BCBCBC",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "JameelNooriNastaleeq",
    color: "white"
  },
  disabledText: {
    color: "#6F6F6F"
  },
  icon: {
    width: 14,
    height: 14,
    marginStart: 10,
    marginEnd: 10,
    resizeMode: "contain"
  }

});
