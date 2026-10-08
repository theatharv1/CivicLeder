/**
 * Keep filing / create URLs out of My Cases "tracking" fields.
 * When a known filing URL was saved by mistake, map it to the status page.
 */

import {
  MCD311_TRACK,
  NGMS_HOME,
  NGMS_TRACK,
  PWD_SEWA_TRACK,
  TPDDL_TRACK,
} from "../data/mcd311Urls";

function lower(url: string): string {
  return url.trim().toLowerCase();
}

/** True if URL is a known "file new complaint" page, not status tracking. */
export function isFilingOnlyUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const u = lower(url);
  if (u.includes("mcd.everythingcivic.com") && u.includes("createissue")) {
    return true;
  }
  if (u.includes("pwdsewa.pwddelhi.gov.in") && u.includes("submitcomplaint")) {
    return true;
  }
  if (u.includes("tatapower-ddl.com") && u.includes("online-complaint")) {
    return true;
  }
  const home = lower(NGMS_HOME).replace(/\/$/, "");
  if (u.replace(/\/$/, "") === home) return true;
  return false;
}

/**
 * Prefer a real tracking/status URL. Maps known filing URLs → track pages.
 */
export function normalizeTrackingUrl(
  url: string | null | undefined
): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  const u = lower(raw);

  if (u.includes("mcd.everythingcivic.com") && u.includes("createissue")) {
    return MCD311_TRACK;
  }
  if (u.includes("mcd.everythingcivic.com") && u.includes("issuedetail")) {
    return MCD311_TRACK;
  }
  if (u.includes("pwdsewa.pwddelhi.gov.in") && u.includes("submitcomplaint")) {
    return PWD_SEWA_TRACK;
  }
  if (
    u.includes("pwdsewa.pwddelhi.gov.in") &&
    u.includes("checkcomplaintstatus")
  ) {
    return PWD_SEWA_TRACK;
  }
  if (u.includes("tatapower-ddl.com") && u.includes("online-complaint")) {
    return TPDDL_TRACK;
  }
  if (u.includes("tatapower-ddl.com") && u.includes("view-current-status")) {
    return TPDDL_TRACK;
  }
  const ngmsHome = lower(NGMS_HOME).replace(/\/$/, "");
  if (u.replace(/\/$/, "") === ngmsHome) {
    return NGMS_TRACK;
  }

  return raw;
}
