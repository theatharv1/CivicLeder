import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";

export async function copyText(label: string, text: string): Promise<void> {
  const value = text.trim();
  if (!value) {
    Alert.alert("Nothing to copy", `${label} is empty.`);
    return;
  }
  try {
    await Clipboard.setStringAsync(value);
    Alert.alert("Copied", `${label} copied.`);
  } catch {
    Alert.alert("Unable to copy", value);
  }
}
