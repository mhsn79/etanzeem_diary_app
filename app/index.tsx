import { useState } from "react";
import React from "react";
import TabNavigator from "./components/TabNavigator";
import LoginScreen from "./screens/LoginScreen";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    isLoggedIn ? <TabNavigator /> : <LoginScreen />
  );
}

