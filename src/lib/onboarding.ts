import { storageGetItem, storageSetItem } from "./safeStorage";

const ONBOARDING_KEY = "civicleder_onboarding_done_v1";
const ENTRY_KEY = "civicleder_entry_choice_v1";

export async function hasCompletedOnboarding(): Promise<boolean> {
  const v = await storageGetItem(ONBOARDING_KEY);
  return v === "1";
}

export async function markOnboardingDone(): Promise<void> {
  await storageSetItem(ONBOARDING_KEY, "1");
}

export async function hasEntryChoice(): Promise<boolean> {
  const v = await storageGetItem(ENTRY_KEY);
  return v === "guest" || v === "profile";
}

export async function markEntryChoice(
  choice: "guest" | "profile"
): Promise<void> {
  await storageSetItem(ENTRY_KEY, choice);
}
