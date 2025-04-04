import React from 'react';
import HomeIconBlack from "../../assets/images/home-icon-black.svg";
import ArkanIconBlack from "../../assets/images/arkan-icon-black.svg";
import ActivitiesIconBlack from "../../assets/images/activities-icon-black.svg";
import ReportIcon2Black from "../../assets/images/report-icon-2-black.svg";
import HomeIconWhite from "../../assets/images/home-icon-white.svg";
import ArkanIconWhite from "../../assets/images/arkan-icon-white.svg";
import ActivitiesIconWhite from "../../assets/images/activities-icon-white.svg";
import ReportIcon2White from "../../assets/images/report-icon-2-white.svg";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TouchableOpacity } from "react-native";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import i18n from '../i18n';

function getIcon(label: string, focused?: boolean) {
    return (
        focused
        ? <>
            {label === 'ڈیش بورڈ' && <HomeIconWhite style={{ width: 25, height: 25 }} />}
            {label === 'ارکان' && <ArkanIconWhite style={{ width: 25, height: 25 }} />}
            {label === 'سرگرمیاں' && <ActivitiesIconWhite style={{ width: 25, height: 25 }} />}
            {label === 'کارکردگی' && <ReportIcon2White style={{ width: 25, height: 25 }} />}
        </>
        : <>
            {label === 'ڈیش بورڈ' && <HomeIconBlack style={{ width: 25, height: 25 }} />}
            {label === 'ارکان' && <ArkanIconBlack style={{ width: 25, height: 25 }} />}
            {label === 'سرگرمیاں' && <ActivitiesIconBlack style={{ width: 25, height: 25 }} />}
            {label === 'کارکردگی' && <ReportIcon2Black style={{ width: 25, height: 25 }} />}
        </>
    );
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, {paddingBottom: insets.bottom}]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const label = options.tabBarLabel as string;
        const icon = getIcon(label, isFocused)

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity onPress={onPress} key={index}>
            <View style={ isFocused ? styles.tabBarButtonFocused : styles.tabBarButton }>
              {icon}
              {isFocused && <Text style={styles.textStyle}>{label}</Text>}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 100,
    padding: 5,
  },
  tabBarButtonFocused: {
      flexDirection: "row",
      alignItems: 'center',
      justifyContent: 'space-evenly',
      backgroundColor: "#246BF8",
      paddingTop: 8,
      paddingBottom: 8,
      paddingRight: 22,
      paddingLeft: 22,
      borderRadius: 40,
      width: 175,
    },
    tabBarButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
      paddingBottom: 8,
      paddingRight: 22,
      paddingLeft: 22,
      borderRadius: 40,
    },
    textStyle: {
      color: "#ffffff",
      fontSize: 20,
      fontFamily: "JameelNooriNastaleeq",
    }
})
