import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { storageMultiRemove } from "./safeStorage";

/**
 * SafeWalk was removed. Testers who update from an older build may still have
 * its background location task registered with the OS. The task must stay
 * defined (as a no-op) so the OS can deliver a final update without a crash,
 * and cleanupLegacySafeWalk() stops it and deletes what it stored.
 */
const SAFEWALK_LOCATION_TASK = "civicleder_safewalk_location_v1";

const SAFEWALK_KEYS = [
  "civicleder_safewalk_last_fix_v1",
  "civicleder_safewalk_tracking_error_v1",
  "civicleder_safewalk_places_v1",
  "civicleder_safewalk_setup_v1",
  "civicleder_safewalk_session_v1",
  "civicleder_circle_notifications_pref_v1",
];

TaskManager.defineTask(SAFEWALK_LOCATION_TASK, async () => {
  // Intentionally empty: location is no longer used in the background.
});

export async function cleanupLegacySafeWalk(): Promise<void> {
  try {
    if (await TaskManager.isTaskRegisteredAsync(SAFEWALK_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(SAFEWALK_LOCATION_TASK);
    }
  } catch {
    // Not running, or not supported here (e.g. Expo Go). Nothing to stop.
  }
  await storageMultiRemove(SAFEWALK_KEYS);
}
