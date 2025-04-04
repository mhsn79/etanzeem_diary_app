import { useState } from "react";
import { ImageStyle, Pressable, PressableProps, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";

interface CustomButtonProps extends PressableProps {
  text: String;
  viewStyle: [ViewStyle?];
  textStyle: [TextStyle?];
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
      <Text style={[styles.buttonText, !rest.onPress && styles.disabledText, textStyle]}>{text}</Text>
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
  }

});
