import { Alert } from "react-native";

type AuthNav = {
  navigate: (
    name: "Auth",
    params?: { mode?: "create" | "signin" }
  ) => void;
};

/** Prompt guest to create a profile for gated features. */
export function requireAccount(
  navigation: AuthNav,
  reason: string,
  loggedIn: boolean
): boolean {
  if (loggedIn) return true;
  Alert.alert("Profile needed", reason, [
    { text: "Not now", style: "cancel" },
    {
      text: "Sign in",
      onPress: () => navigation.navigate("Auth", { mode: "signin" }),
    },
    {
      text: "Create profile",
      onPress: () => navigation.navigate("Auth", { mode: "create" }),
    },
  ]);
  return false;
}
