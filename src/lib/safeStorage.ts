/**
 * Safe AsyncStorage wrapper for Expo Go.
 * AsyncStorage v3 throws "Native module is null" in Expo Go — use v2.2.0.
 * This wrapper also falls back to memory if native storage is unavailable.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const memory = new Map<string, string>();
let nativeOk: boolean | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("storage_timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function probeNative(): Promise<boolean> {
  if (nativeOk != null) return nativeOk;
  try {
    const probeKey = "__civicleader_storage_probe__";
    // Never hang boot if native storage stalls (seen on some Android builds).
    await withTimeout(AsyncStorage.setItem(probeKey, "1"), 1500);
    await withTimeout(AsyncStorage.removeItem(probeKey), 1500);
    nativeOk = true;
  } catch {
    nativeOk = false;
  }
  return nativeOk;
}

export async function storageGetItem(key: string): Promise<string | null> {
  if (await probeNative()) {
    try {
      return await withTimeout(AsyncStorage.getItem(key), 2000);
    } catch {
      nativeOk = false;
    }
  }
  return memory.has(key) ? memory.get(key)! : null;
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  if (await probeNative()) {
    try {
      await withTimeout(AsyncStorage.setItem(key, value), 2000);
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
      await withTimeout(AsyncStorage.removeItem(key), 2000);
      return;
    } catch {
      nativeOk = false;
    }
  }
  memory.delete(key);
}

export async function storageMultiRemove(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  if (await probeNative()) {
    try {
      await withTimeout(AsyncStorage.multiRemove(keys), 3000);
      for (const key of keys) memory.delete(key);
      return;
    } catch {
      nativeOk = false;
    }
  }
  for (const key of keys) memory.delete(key);
}
