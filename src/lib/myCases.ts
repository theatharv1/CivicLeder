import { api, apiConfigured } from "./apiClient";
import { storageGetItem, storageSetItem } from "./safeStorage";

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
};

async function readLocal(): Promise<LocalCaseRecord[]> {
  try {
    const raw = await storageGetItem(LOCAL_CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalCaseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(rows: LocalCaseRecord[]): Promise<void> {
  await storageSetItem(LOCAL_CASES_KEY, JSON.stringify(rows));
}

export async function rememberLocalCase(row: LocalCaseRecord): Promise<void> {
  const prev = await readLocal();
  const next = [row, ...prev.filter((r) => r.caseId !== row.caseId)];
  await writeLocal(next.slice(0, 100));
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
      trackingUrl:
        (oc?.officialTrackingUrl as string | null) ??
        (oc?.official_tracking_url as string | null) ??
        prev?.trackingUrl ??
        null,
      phone: channel && /^\d/.test(channel) ? channel : (prev?.phone ?? null),
      statusSourceType: "user",
      updatedAt:
        (r.updatedAt as string | null) ??
        (r.updated_at as string | null) ??
        prev?.updatedAt ??
        new Date().toISOString(),
    });
  }

  return Array.from(byCase.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}
