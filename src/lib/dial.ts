import { Alert, Linking } from "react-native";

/**
 * Open the phone dialer with the number filled in.
 *
 * We call openURL directly instead of checking canOpenURL first: on Android 11+
 * canOpenURL("tel:") returns false unless the manifest declares a <queries>
 * entry, which would block every emergency button. openURL itself works.
 */
export async function dialNumber(number: string, label?: string): Promise<void> {
  const digits = number.replace(/[^\d+]/g, "");
  try {
    await Linking.openURL(`tel:${digits}`);
  } catch {
    Alert.alert(
      label ? `Call ${label}` : "Call",
      `Unable to open the dialer. Please dial ${number} manually.`,
      [{ text: "OK" }]
    );
  }
}
