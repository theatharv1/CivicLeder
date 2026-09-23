import { storageGetItem, storageSetItem } from "./safeStorage";
import { supabase, supabaseConfigured } from "./supabase";

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

type ComplaintRow = {
  report_id: string;
  authority_slug: string | null;
  official_reference: string | null;
  filed_by_user_at: string | null;
  official_filed_on: string | null;
  official_tracking_url: string | null;
  channel_value: string | null;
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
  if (!supabaseConfigured || !supabase || !local.length) {
    return local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const ids = local.map((c) => c.caseId);
  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, case_id, category_slug, issue_type_slug, selected_authority_slug, user_status, updated_at"
    )
    .in("case_id", ids);

  const reportIds = (reports ?? []).map((r) => r.id as string);
  let complaints: ComplaintRow[] = [];
  if (reportIds.length) {
    const { data } = await supabase
      .from("official_complaints")
      .select(
        "report_id, authority_slug, official_reference, filed_by_user_at, official_filed_on, official_tracking_url, channel_value"
      )
      .in("report_id", reportIds)
      .order("created_at", { ascending: false });
    complaints = (data as ComplaintRow[] | null) ?? [];
  }

  const complaintByReport = new Map<string, ComplaintRow>();
  for (const c of complaints) {
    if (!complaintByReport.has(c.report_id)) {
      complaintByReport.set(c.report_id, c);
    }
  }

  const byCase = new Map(local.map((c) => [c.caseId, c]));
  for (const r of reports ?? []) {
    const caseId = r.case_id as string;
    const prev = byCase.get(caseId);
    const oc = complaintByReport.get(r.id as string);
    const channel = oc?.channel_value ?? null;
    byCase.set(caseId, {
      caseId,
      reportDbId: (r.id as string) ?? prev?.reportDbId ?? null,
      categorySlug: (r.category_slug as string) ?? prev?.categorySlug ?? null,
      issueTypeSlug:
        (r.issue_type_slug as string) ?? prev?.issueTypeSlug ?? null,
      authoritySlug:
        (r.selected_authority_slug as string) ??
        oc?.authority_slug ??
        prev?.authoritySlug ??
        null,
      authorityName: prev?.authorityName ?? null,
      officialReference:
        oc?.official_reference ?? prev?.officialReference ?? null,
      filedAt:
        oc?.official_filed_on ??
        oc?.filed_by_user_at ??
        prev?.filedAt ??
        null,
      userStatus: (r.user_status as string) ?? prev?.userStatus ?? "guided",
      trackingUrl: oc?.official_tracking_url ?? prev?.trackingUrl ?? null,
      phone:
        channel && /^\d/.test(channel) ? channel : (prev?.phone ?? null),
      statusSourceType: "user",
      updatedAt:
        (r.updated_at as string) ??
        prev?.updatedAt ??
        new Date().toISOString(),
    });
  }

  return Array.from(byCase.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}
