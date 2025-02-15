import { useState } from "react";
import { Pressable, PressableProps, StyleSheet, Text } from "react-native";

interface CustomButtonProps extends PressableProps {
  text: String;
}

export default function CustomButton({ text , ...rest }: CustomButtonProps) {

  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.button,
        pressed && styles.buttonPressed,
        !rest.onPress && styles.disabled
      ]}
      disabled={!rest.onPress}
      {...rest}>
      <Text style={[styles.buttonText, !rest.onPress && styles.disabledText]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 30,
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
    fontFamily: "JameelNoori",
    color: "white"
  },
  disabledText: {
    color: "#6F6F6F"
  }

});
