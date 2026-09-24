import { rememberLocalCase } from "./myCases";
import { api, apiConfigured } from "./apiClient";

/** Generate internal CivicLeder case ID (NOT a government complaint ID). */
export async function generateCivicLederCaseId(): Promise<string> {
  if (apiConfigured) {
    const result = await api.nextCaseId();
    if (result.ok && result.data.caseId?.startsWith("MD-")) {
      return result.data.caseId;
    }
  }
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
  if (!apiConfigured) return null;
  const result = await api.upsertReport({
    caseId: input.caseId,
    categorySlug: input.categorySlug,
    issueTypeSlug: input.issueTypeSlug,
    emergencyResult: input.emergencyResult,
    selectedAuthoritySlug: input.selectedAuthoritySlug,
    userStatus: input.userStatus,
    statusSourceType: "user",
  });
  if (!result.ok) return null;
  return result.data.id;
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
  if (!apiConfigured || !input.reportId) return false;
  const result = await api.createComplaint({
    reportId: input.reportId,
    authoritySlug: input.authoritySlug,
    serviceId: input.serviceId,
    channelType: input.channelType,
    channelValue: input.channelValue,
    hasOfficialReference: input.hasOfficialReference,
    officialReference: input.officialReference,
    userConfirmedFiled: input.userConfirmedFiled,
    officialSubmissionUrl: input.officialSubmissionUrl,
    officialTrackingUrl: input.officialTrackingUrl,
    officialFiledOn: input.officialFiledOn,
  });
  return result.ok;
}

export async function persistCaseUpdate(input: {
  reportId: string | null;
  status: string;
  message: string;
}): Promise<void> {
  if (!apiConfigured || !input.reportId) return;
  await api.createCaseUpdate({
    reportId: input.reportId,
    status: input.status,
    message: input.message,
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
