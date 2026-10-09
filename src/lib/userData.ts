import { storageMultiRemove } from "./safeStorage";

/** All keys this app writes for user-generated / identity data on this phone. */
export const LOCAL_USER_DATA_KEYS = [
  "civicleader.public_alerts.v1",
  "civicleader.public_alert_votes.v1",
  "my_delhi_local_cases_v1",
  "mydelhi.community_tips.v1",
  "mydelhi.community_votes.v1",
  "mydelhi.community_my_tips.v1",
  "mydelhi.device_id.v1",
  "civicleder.device_id.v1",
  "civicleader.auth.accounts.v1",
  "civicleader.auth.session.v1",
] as const;

/**
 * Removes alerts, cases, tips, votes, device id, and local accounts from this phone.
 * Does not touch any government system. Public posts were already anonymous.
 */
export async function deleteAllLocalUserData(): Promise<void> {
  await storageMultiRemove([...LOCAL_USER_DATA_KEYS]);
}
