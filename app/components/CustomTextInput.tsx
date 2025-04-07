import { useState } from "react";
import { ImageStyle, StyleSheet, TextInput, TextInputProps, TextStyle, ViewStyle } from "react-native";
import { ImageSource } from "react-native-vector-icons/Icon";

interface CustomTextInputProps extends TextInputProps {
  error?: boolean;
  viewStyle?: [ViewStyle?];
  textStyle?: [TextStyle?];
  iconImage?: ImageSource;
  iconStyle?: [ImageStyle?];
}

export default function CustomTextInput({ error, ...rest }: CustomTextInputProps) {

  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      style={[
        styles.inputField,
        focused && styles.focused,
        error && styles.error
      ]}
      autoCapitalize="none"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...rest}>
    </TextInput>
  );
}

const styles = StyleSheet.create({
  inputField: {
    fontSize: 16,
    fontFamily: "JameelNooriNastaleeq",
    backgroundColor: "#F7F7F7",
    borderColor: "#EBEBEB",
    borderWidth: 1,
    borderRadius: 8,
    width: "100%",
    padding: 12,
    height: 56,
    textAlign: "right",
    writingDirection: "rtl"
  },
  focused: {
    borderColor: "#008CFF"
  },
  error: {
    borderColor: "#EA5455"
  }
});
