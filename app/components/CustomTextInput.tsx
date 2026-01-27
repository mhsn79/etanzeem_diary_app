import { useState, useCallback, useMemo } from "react";
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

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  // Memoize the style to prevent unnecessary re-renders
  const inputStyle = useMemo(() => [
    styles.inputField,
    focused && styles.focused,
    error && styles.error
  ], [focused, error]);

  return (
    <TextInput
      style={inputStyle}
      autoCapitalize="none"
      onFocus={handleFocus}
      onBlur={handleBlur}
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
    writingDirection: "rtl",
    // Add these to prevent layout shifts
    minHeight: 56,
    maxHeight: 56,
  },
  focused: {
    borderColor: "#008CFF",
  },
  error: {
    borderColor: "#EA5455",
  }
});
