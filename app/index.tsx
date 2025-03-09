import { useState } from "react";
import { Redirect } from "expo-router";

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    isLoggedIn ? <Redirect href={'/screens/Dashboard'}/> : <Redirect href={'/screens/LoginScreen'}/>
  );
}
