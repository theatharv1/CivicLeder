import { api, apiConfigured } from "./apiClient";
import { storageGetItem, storageSetItem } from "./safeStorage";
import { normalizeTrackingUrl } from "./trackingUrls";

const LOCAL_CASES_KEY = "my_delhi_local_cases_v1";

export type LocalCaseRecord = {
  caseId: string;
  reportDbId: string | null;
  categorySlug: string | null;
  issueTypeSlug: string | null;
  authoritySlug: string | null;
  authorityName: string | null;
  officialReference: string | null;
  filedAt: string | null;
  userStatus: string;
  trackingUrl: string | null;
  phone: string | null;
  statusSourceType: "user";
  updatedAt: string;
  /** The user's own answer to "Is it fixed?" (kept on this phone). */
  followUp?: CaseFollowUp | null;
};

/** Status / track URL only — never a create-complaint / escalation filing page. */
export function caseTrackingUrl(c: LocalCaseRecord): string | null {
  return normalizeTrackingUrl(c.trackingUrl);
}

export type CaseFollowUp = {
  status: "fixed" | "not_fixed";
  answeredAt: string;
  /** How many times the user said "not yet"; picks the next office. */
  notFixedCount: number;
};

/** Ask "Is it fixed?" this many days after filing, and again after each "not yet". */
export const FOLLOW_UP_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / DAY_MS) : 0;
}

function isFiled(c: LocalCaseRecord): boolean {
  return Boolean(c.officialReference?.trim() || c.filedAt);
}

/** Filed, not marked fixed, and it's been FOLLOW_UP_DAYS since filing or the last answer. */
export function needsFollowUp(c: LocalCaseRecord): boolean {
  if (!isFiled(c) || c.followUp?.status === "fixed") return false;
  const since = c.followUp?.answeredAt ?? c.filedAt ?? c.updatedAt;
  return daysSince(since) >= FOLLOW_UP_DAYS;
}

export function daysSinceFiled(c: LocalCaseRecord): number {
  return daysSince(c.filedAt ?? c.updatedAt);
}

export type NextStepKind = "remind_office" | "escalate_pgms" | "escalate_cpgrams";

export type NextStep = {
  kind: NextStepKind;
  /** Short status line: issue still unresolved. */
  statusLine: string;
  title: string;
  body: string;
  /** Human name of where to go next. */
  whereName: string;
  actionLabel: string;
  url: string | null;
  phone: string | null;
};

const PGMS_URL = "https://pgms.delhi.gov.in/";
const CPGRAMS_URL = "https://pgportal.gov.in/";

/**
 * After each "not yet":
 * 1) Reminder / status check on the office tracking site (not a new filing page)
 * 2) Escalate to Delhi PGMS
 * 3) Escalate to CPGRAMS
 */
export function nextStepFor(c: LocalCaseRecord): NextStep {
  const office =
    c.authorityName ?? c.authoritySlug?.replace(/_/g, " ") ?? "the office";
  const n = c.followUp?.notFixedCount ?? 1;
  const days = daysSinceFiled(c);
  const track = caseTrackingUrl(c);
  const statusLine = `Still not resolved after ${days} day${days === 1 ? "" : "s"}.`;

  if (n <= 1 && (track || c.phone)) {
    return {
      kind: "remind_office",
      statusLine,
      title: "Follow up with the same office",
      body: track
        ? `Open their official status / tracking page. Enter your government complaint number and ask for an update from ${office}.`
        : `Call ${office} on ${c.phone}. Quote your complaint number and ask for the status.`,
      whereName: track
        ? `${office} status page`
        : `${office} phone ${c.phone}`,
      actionLabel: track ? "Open status / tracking page" : `Call ${c.phone}`,
      url: track,
      phone: track ? null : c.phone,
    };
  }
  if (n <= 2) {
    return {
      kind: "escalate_pgms",
      statusLine,
      title: "Escalate: Delhi PGMS",
      body: `The office has not fixed it. Raise a grievance on the Delhi government's Public Grievance Management System (PGMS). Paste the text below and include your tracking ID.`,
      whereName: "Delhi PGMS (pgms.delhi.gov.in)",
      actionLabel: "Open Delhi PGMS",
      url: PGMS_URL,
      phone: null,
    };
  }
  return {
    kind: "escalate_cpgrams",
    statusLine,
    title: "Escalate: CPGRAMS (central)",
    body: `Still unresolved after Delhi PGMS. File on the central government's CPGRAMS portal. Paste the text below and include your tracking ID.`,
    whereName: "CPGRAMS (pgportal.gov.in)",
    actionLabel: "Open CPGRAMS",
    url: CPGRAMS_URL,
    phone: null,
  };
}

/** Ready-to-paste text for the next complaint. */
export function escalationText(c: LocalCaseRecord): string {
  const office =
    c.authorityName ?? c.authoritySlug?.replace(/_/g, " ") ?? "the concerned office";
  const what = c.issueTypeSlug?.replace(/_/g, " ") ?? c.categorySlug?.replace(/_/g, " ") ?? "a civic problem";
  const parts = [
    `I reported ${what} to ${office}`,
    c.filedAt ? ` on ${c.filedAt}` : "",
    c.officialReference ? ` (complaint number ${c.officialReference})` : "",
    `. It has still not been fixed after ${daysSinceFiled(c)} days. Please take action and share the status.`,
  ];
  return parts.join("");
}

function normalizeCaseRow(row: LocalCaseRecord): LocalCaseRecord {
  const trackingUrl = normalizeTrackingUrl(row.trackingUrl);
  if (trackingUrl === row.trackingUrl) return row;
  return { ...row, trackingUrl };
}

async function readLocal(): Promise<LocalCaseRecord[]> {
  try {
    const raw = await storageGetItem(LOCAL_CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalCaseRecord[];
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map(normalizeCaseRow);
    const changed = normalized.some(
      (row, i) => row.trackingUrl !== parsed[i]?.trackingUrl
    );
    if (changed) await writeLocal(normalized);
    return normalized;
  } catch {
    return [];
  }
}

async function writeLocal(rows: LocalCaseRecord[]): Promise<void> {
  await storageSetItem(LOCAL_CASES_KEY, JSON.stringify(rows));
}

export async function rememberLocalCase(row: LocalCaseRecord): Promise<void> {
  const prev = await readLocal();
  const normalized = normalizeCaseRow(row);
  const next = [normalized, ...prev.filter((r) => r.caseId !== row.caseId)];
  await writeLocal(next.slice(0, 100));
}

/** Update official government complaint reference for future tracking. */
export async function updateLocalCaseReference(
  caseId: string,
  officialReference: string
): Promise<LocalCaseRecord | null> {
  return updateLocalCaseDetails(caseId, { officialReference });
}

/** Save / edit tracking ID and website where the user filed. */
export async function updateLocalCaseDetails(
  caseId: string,
  patch: {
    officialReference?: string | null;
    trackingUrl?: string | null;
  }
): Promise<LocalCaseRecord | null> {
  const prev = await readLocal();
  const idx = prev.findIndex((c) => c.caseId === caseId);
  if (idx < 0) return null;
  const cur = prev[idx]!;
  const ref =
    patch.officialReference !== undefined
      ? (patch.officialReference?.trim() || null)
      : cur.officialReference;
  const trackingUrl =
    patch.trackingUrl !== undefined
      ? normalizeTrackingUrl(patch.trackingUrl)
      : normalizeTrackingUrl(cur.trackingUrl);
  const updated: LocalCaseRecord = {
    ...cur,
    officialReference: ref,
    trackingUrl,
    filedAt: ref
      ? cur.filedAt ?? new Date().toISOString().slice(0, 10)
      : cur.filedAt,
    userStatus: ref
      ? cur.userStatus === "draft_only" || cur.userStatus === "recorded"
        ? "filed_with_authority"
        : cur.userStatus
      : cur.userStatus,
    updatedAt: new Date().toISOString(),
  };
  const next = [...prev];
  next[idx] = updated;
  await writeLocal(next);
  return updated;
}

export async function listLocalCases(): Promise<LocalCaseRecord[]> {
  const local = await readLocal();
  if (!apiConfigured || !local.length) {
    return local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const ids = local.map((c) => c.caseId);
  const result = await api.getReportsByCaseIds(ids);
  if (!result.ok) {
    return local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const byCase = new Map(local.map((c) => [c.caseId, c]));
  for (const r of result.data) {
    const caseId = String(r.caseId ?? r.case_id ?? "");
    if (!caseId) continue;
    const prev = byCase.get(caseId);
    const complaints =
      (r.complaints as Record<string, unknown>[] | undefined) ?? [];
    const oc = complaints[0];
    const channel =
      (oc?.channelValue as string | null) ??
      (oc?.channel_value as string | null) ??
      null;
    byCase.set(caseId, {
      caseId,
      reportDbId:
        String(r.id ?? prev?.reportDbId ?? "") || prev?.reportDbId || null,
      categorySlug:
        (r.categorySlug as string | null) ??
        (r.category_slug as string | null) ??
        prev?.categorySlug ??
        null,
      issueTypeSlug:
        (r.issueTypeSlug as string | null) ??
        (r.issue_type_slug as string | null) ??
        prev?.issueTypeSlug ??
        null,
      authoritySlug:
        (r.selectedAuthoritySlug as string | null) ??
        (r.selected_authority_slug as string | null) ??
        (oc?.authoritySlug as string | null) ??
        (oc?.authority_slug as string | null) ??
        prev?.authoritySlug ??
        null,
      authorityName: prev?.authorityName ?? null,
      officialReference:
        (oc?.officialReference as string | null) ??
        (oc?.official_reference as string | null) ??
        prev?.officialReference ??
        null,
      filedAt:
        (oc?.officialFiledOn as string | null) ??
        (oc?.official_filed_on as string | null) ??
        (oc?.filedByUserAt as string | null) ??
        (oc?.filed_by_user_at as string | null) ??
        prev?.filedAt ??
        null,
      userStatus:
        (r.userStatus as string | null) ??
        (r.user_status as string | null) ??
        prev?.userStatus ??
        "guided",
      trackingUrl: normalizeTrackingUrl(
        (oc?.officialTrackingUrl as string | null) ??
          (oc?.official_tracking_url as string | null) ??
          prev?.trackingUrl ??
          null
      ),
      phone: channel && /^\d/.test(channel) ? channel : (prev?.phone ?? null),
      statusSourceType: "user",
      updatedAt:
        (r.updatedAt as string | null) ??
        (r.updated_at as string | null) ??
        prev?.updatedAt ??
        new Date().toISOString(),
      followUp: prev?.followUp ?? null,
    });
  }

  return Array.from(byCase.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

/** Record the user's answer to "Is it fixed?". */
export async function answerFollowUp(
  caseId: string,
  fixed: boolean
): Promise<LocalCaseRecord | null> {
  const prev = await readLocal();
  const idx = prev.findIndex((c) => c.caseId === caseId);
  if (idx < 0) return null;
  const cur = prev[idx]!;
  const now = new Date().toISOString();
  const updated: LocalCaseRecord = {
    ...cur,
    followUp: {
      status: fixed ? "fixed" : "not_fixed",
      answeredAt: now,
      notFixedCount: (cur.followUp?.notFixedCount ?? 0) + (fixed ? 0 : 1),
    },
    updatedAt: now,
  };
  const next = [...prev];
  next[idx] = updated;
  await writeLocal(next);
  if (apiConfigured && cur.reportDbId) {
    void api.createCaseUpdate({
      reportId: cur.reportDbId,
      status: fixed ? "fixed_confirmed_by_user" : "not_fixed_reported_by_user",
      message: fixed ? "User confirmed the problem is fixed." : "User says the problem is not fixed yet.",
    });
  }
  return updated;
}

/** Cases waiting for a "Is it fixed?" answer (local only, no network). */
export async function countCasesNeedingFollowUp(): Promise<number> {
  const local = await readLocal();
  return local.filter(needsFollowUp).length;
}
