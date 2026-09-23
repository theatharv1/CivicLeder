import { rememberLocalCase } from "./myCases";
import { supabase, supabaseConfigured } from "./supabase";

/** Generate internal CivicLeder case ID (NOT a government complaint ID). */
export async function generateCivicLederCaseId(): Promise<string> {
  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc("next_my_delhi_case_id");
    if (!error && typeof data === "string" && data.startsWith("MD-")) {
      return data;
    }
  }
  // Local fallback — still MD-###### style; not an official reference
  const n = Date.now() % 1_000_000;
  return `MD-${String(n).padStart(6, "0")}`;
}

/** @deprecated Prefer generateCivicLederCaseId — alias kept for existing imports. */
export const generateMyDelhiCaseId = generateCivicLederCaseId;

export type PersistReportInput = {
  caseId: string;
  categorySlug: string | null;
  issueTypeSlug: string | null;
  emergencyResult: string | null;
  selectedAuthoritySlug: string | null;
  userStatus: string;
};

export async function persistReport(
  input: PersistReportInput
): Promise<string | null> {
  if (!supabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("reports")
    .upsert(
      {
        case_id: input.caseId,
        category_slug: input.categorySlug,
        issue_type_slug: input.issueTypeSlug,
        emergency_result: input.emergencyResult,
        selected_authority_slug: input.selectedAuthoritySlug,
        user_status: input.userStatus,
        status_source_type: "user",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "case_id" }
    )
    .select("id")
    .maybeSingle();

  if (error || !data?.id) return null;
  return data.id as string;
}

export async function persistOfficialComplaint(input: {
  reportId: string | null;
  authoritySlug: string | null;
  serviceId: string | null;
  channelType: string | null;
  channelValue: string | null;
  officialSubmissionUrl: string | null;
  officialTrackingUrl: string | null;
  hasOfficialReference: boolean;
  officialReference: string | null;
  userConfirmedFiled: boolean;
  officialFiledOn: string | null;
}): Promise<boolean> {
  if (!supabaseConfigured || !supabase || !input.reportId) return false;

  const row: Record<string, unknown> = {
    report_id: input.reportId,
    authority_slug: input.authoritySlug,
    channel_type: input.channelType,
    channel_value: input.channelValue,
    has_official_reference: input.hasOfficialReference,
    official_reference: input.officialReference,
    filed_by_user_at: new Date().toISOString(),
    recorded_by: "user",
    user_confirmed_filed: input.userConfirmedFiled,
    official_submission_url: input.officialSubmissionUrl,
    official_tracking_url: input.officialTrackingUrl,
    official_filed_on: input.officialFiledOn,
  };
  if (input.serviceId) {
    row.service_id = input.serviceId;
  }

  const { error } = await supabase.from("official_complaints").insert(row);
  return !error;
}

export async function persistCaseUpdate(input: {
  reportId: string | null;
  status: string;
  message: string;
}): Promise<void> {
  if (!supabaseConfigured || !supabase || !input.reportId) return;
  await supabase.from("case_updates").insert({
    report_id: input.reportId,
    status: input.status,
    message: input.message,
    recorded_by: "user",
    status_source_type: "user",
  });
}

export async function saveUserFiledCase(input: {
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
}): Promise<void> {
  await rememberLocalCase({
    caseId: input.caseId,
    reportDbId: input.reportDbId,
    categorySlug: input.categorySlug,
    issueTypeSlug: input.issueTypeSlug,
    authoritySlug: input.authoritySlug,
    authorityName: input.authorityName,
    officialReference: input.officialReference,
    filedAt: input.filedAt,
    userStatus: input.userStatus,
    trackingUrl: input.trackingUrl,
    phone: input.phone,
    statusSourceType: "user",
    updatedAt: new Date().toISOString(),
  });
}
