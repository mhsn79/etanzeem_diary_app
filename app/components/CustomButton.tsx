import { useState } from "react";
import { ActivityIndicator, Image, ImageStyle, Pressable, PressableProps, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { ImageSource } from "react-native-vector-icons/Icon";
import { COLORS } from "../constants/theme";

interface CustomButtonProps extends PressableProps {
  text: String;
  viewStyle?: [ViewStyle?];
  textStyle?: [TextStyle?];
  iconImage?: ImageSource;
  iconStyle?: [ImageStyle?];
  loading?: boolean;
}

export default function CustomButton({ text, viewStyle, textStyle, loading = false, ...rest }: CustomButtonProps) {

  const [pressed, setPressed] = useState(false);
  const isDisabled = !rest.onPress || rest.disabled || loading;

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.button,
        pressed && styles.buttonPressed,
        isDisabled && styles.disabled,
        viewStyle
      ]}
      disabled={isDisabled}
      {...rest}>
      <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center" }, viewStyle]}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} style={styles.loader} />
        ) : (
          <>
            {rest.iconImage && <Image
              source={rest.iconImage}
              style={[styles.icon]}
            />}
            <Text style={[styles.buttonText, isDisabled && styles.disabledText, textStyle]}>{text}</Text>
          </>
        )}
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
  },
  loader: {
    marginHorizontal: 10
  }
});
