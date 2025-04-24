import { useEffect, useRef, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Uncomment if you want to forward every push into Redux inbox
// import { useAppDispatch } from "./useAppDispatch";
// import { receiveNotification } from "@/app/features/notifications/notificationsSlice";

// -----------------------------------------------------------------------------
// Hook signature
// -----------------------------------------------------------------------------
// 1.  Returns the current token (string | null). Handy in components that need
//     to show / copy it.
// 2.  Accepts an **optional** callback that runs the first time we fetch a token.
//     Use it to POST the token to your backend without pulling in Redux.
// -----------------------------------------------------------------------------
export function usePushNotifications(onToken?: (token: string) => void) {
  // const dispatch = useAppDispatch();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    /** ------------------------------------------------------------------
     * 1 | Android channel (must be before any notifications fire)
     * ------------------------------------------------------------------ */
    if (Platform.OS === "android") {
      console.log("[Push] Setting Android notification channel ➜ default");
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    /** ------------------------------------------------------------------
     * 2 | Permission + token
     * ------------------------------------------------------------------ */
    (async () => {
      if (!Device.isDevice) {
        console.warn("[Push] Not a physical device – skipping token registration");
        return;
      }

      console.log("[Push] Requesting permissions…");
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      console.log(`[Push] Permission status ➜ ${finalStatus}`);
      if (finalStatus !== "granted") {
        console.warn("[Push] Permission not granted – aborting token fetch");
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        console.error("[Push] No EAS projectId found – cannot fetch token");
        return;
      }

      try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log(`[Push] Expo push token acquired ➜ ${token}`);
        setExpoPushToken(token);
        onToken?.(token);
      } catch (err) {
        console.error("[Push] Error fetching Expo push token", err);
      }
    })();

    /** ------------------------------------------------------------------
     * 3 | Foreground listener – app is open
     * ------------------------------------------------------------------ */
    console.log("[Push] Subscribing to foreground notifications");
    const foregroundSub = Notifications.addNotificationReceivedListener((n) => {
      console.log("[Push] ⟶ Foreground notification", JSON.stringify(n.request.content));
      // dispatch(receiveNotification(n));
    });

    /** ------------------------------------------------------------------
     * 4 | Background / tapped listener – user interacts when app closed
     * ------------------------------------------------------------------ */
    console.log("[Push] Subscribing to background/tap responses");
    responseListener.current = Notifications.addNotificationResponseReceivedListener((r) => {
      console.log("[Push] ⟶ Background notification response", JSON.stringify(r, null, 2));
      // Deep‑link handling can go here
    });

    /** ------------------------------------------------------------------
     * Cleanup on unmount
     * ------------------------------------------------------------------ */
    return () => {
      console.log("[Push] Removing notification listeners");
      foregroundSub.remove();
      responseListener.current?.remove();
    };
  }, [onToken]);

  return expoPushToken;
}
