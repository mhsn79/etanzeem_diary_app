import { useState } from "react";
import { Redirect } from "expo-router";
import { StatusBar } from "react-native";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent"/>
      { isLoggedIn ? <Redirect href={'/screens/Dashboard'} /> : <Redirect href={'/screens/LoginScreen'} /> }
    </>
  );
}
