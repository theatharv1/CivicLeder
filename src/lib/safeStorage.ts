/**
 * Safe AsyncStorage wrapper for Expo Go.
 * AsyncStorage v3 throws "Native module is null" in Expo Go — use v2.2.0.
 * This wrapper also falls back to memory if native storage is unavailable.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const memory = new Map<string, string>();
let nativeOk: boolean | null = null;

async function probeNative(): Promise<boolean> {
  if (nativeOk != null) return nativeOk;
  try {
    const probeKey = "__mydelhi_storage_probe__";
    await AsyncStorage.setItem(probeKey, "1");
    await AsyncStorage.removeItem(probeKey);
    nativeOk = true;
  } catch {
    nativeOk = false;
  }
  return nativeOk;
}

export async function storageGetItem(key: string): Promise<string | null> {
  if (await probeNative()) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      nativeOk = false;
    }
  }
  return memory.has(key) ? memory.get(key)! : null;
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  if (await probeNative()) {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch {
      nativeOk = false;
    }
  }
  memory.set(key, value);
}

export async function storageRemoveItem(key: string): Promise<void> {
  if (await probeNative()) {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      nativeOk = false;
    }
  }
  memory.delete(key);
}
