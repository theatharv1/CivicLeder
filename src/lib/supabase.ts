import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

type ExpoPublicEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

const env = (globalThis as { process?: { env?: ExpoPublicEnv } }).process
  ?.env;

const url = env?.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = env?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigured = Boolean(url && key);

export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
