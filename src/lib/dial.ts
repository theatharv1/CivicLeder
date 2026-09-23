import { Alert, Linking, Platform } from "react-native";

/** Dial an emergency number safely (simulators/web often cannot open tel:). */
export async function dialNumber(number: string, label?: string): Promise<void> {
  const url = Platform.select({
    ios: `telprompt:${number}`,
    default: `tel:${number}`,
  }) as string;

  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert(
        label ? `Call ${label}` : "Call",
        `This device cannot place calls. Dial ${number} from your phone.`,
        [{ text: "OK" }]
      );
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      label ? `Call ${label}` : "Call",
      `Unable to open the dialer. Please dial ${number} manually.`,
      [{ text: "OK" }]
    );
  }
}
