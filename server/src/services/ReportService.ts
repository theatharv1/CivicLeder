import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { nextCaseId } from "./CaseService.js";

export { nextCaseId };

export async function upsertReport(input: {
  caseId: string;
  categorySlug?: string | null;
  issueTypeSlug?: string | null;
  emergencyResult?: string | null;
  selectedAuthoritySlug?: string | null;
  userStatus: string;
  statusSourceType?: string | null;
}) {
  return prisma.report.upsert({
    where: { caseId: input.caseId },
    create: {
      caseId: input.caseId,
      categorySlug: input.categorySlug ?? null,
      issueTypeSlug: input.issueTypeSlug ?? null,
      emergencyResult: input.emergencyResult ?? null,
      selectedAuthoritySlug: input.selectedAuthoritySlug ?? null,
      userStatus: input.userStatus,
      statusSourceType: input.statusSourceType ?? "user",
    },
    update: {
      categorySlug: input.categorySlug ?? null,
      issueTypeSlug: input.issueTypeSlug ?? null,
      emergencyResult: input.emergencyResult ?? null,
      selectedAuthoritySlug: input.selectedAuthoritySlug ?? null,
      userStatus: input.userStatus,
      statusSourceType: input.statusSourceType ?? "user",
    },
  });
}

export async function createOfficialComplaint(input: {
  reportId: string;
  authoritySlug?: string | null;
  serviceId?: string | null;
  channelType?: string | null;
  channelValue?: string | null;
  officialSubmissionUrl?: string | null;
  officialTrackingUrl?: string | null;
  hasOfficialReference?: boolean;
  officialReference?: string | null;
  userConfirmedFiled?: boolean;
  officialFiledOn?: string | null;
}) {
  if (!input.reportId) {
    throw new AppError("VALIDATION_ERROR", "reportId is required");
  }
  return prisma.officialComplaint.create({
    data: {
      reportId: input.reportId,
      authoritySlug: input.authoritySlug ?? null,
      serviceId: input.serviceId ?? null,
      channelType: input.channelType ?? null,
      channelValue: input.channelValue ?? null,
      officialSubmissionUrl: input.officialSubmissionUrl ?? null,
      officialTrackingUrl: input.officialTrackingUrl ?? null,
      hasOfficialReference: input.hasOfficialReference ?? null,
      officialReference: input.officialReference ?? null,
      userConfirmedFiled: input.userConfirmedFiled ?? null,
      officialFiledOn: input.officialFiledOn
        ? new Date(input.officialFiledOn)
        : null,
      filedByUserAt: new Date(),
      recordedBy: "user",
    },
  });
}

export async function createCaseUpdate(input: {
  reportId: string;
  status: string;
  message: string;
}) {
  return prisma.caseUpdate.create({
    data: {
      reportId: input.reportId,
      status: input.status,
      message: input.message,
      recordedBy: "user",
      statusSourceType: "user",
    },
  });
}

export async function createReportLocation(input: {
  reportId?: string | null;
  draftKey?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  addressText?: string | null;
  landmark?: string | null;
  accuracyMeters?: number | null;
  jurisdictionStatus?: string | null;
  jurisdictionId?: string | null;
  addLocationOnPhoto?: boolean | null;
  source?: string | null;
}) {
  return prisma.reportLocation.create({
    data: {
      reportId: input.reportId ?? null,
      draftKey: input.draftKey ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      addressText: input.addressText ?? null,
      landmark: input.landmark ?? null,
      accuracyMeters: input.accuracyMeters ?? null,
      jurisdictionStatus: input.jurisdictionStatus ?? "unknown",
      jurisdictionId: input.jurisdictionId ?? null,
      addLocationOnPhoto: input.addLocationOnPhoto ?? true,
      source: input.source ?? "user",
    },
  });
}

export async function getReportsByCaseIds(caseIds: string[]) {
  if (!caseIds.length) return [];
  return prisma.report.findMany({
    where: { caseId: { in: caseIds } },
    include: {
      complaints: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function recordEvidenceMeta(input: {
  draftKey: string;
  storagePath: string;
  mediaType: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}) {
  return prisma.reportEvidence.create({
    data: {
      draftKey: input.draftKey,
      storagePath: input.storagePath,
      mediaType: input.mediaType,
      mimeType: input.mimeType ?? null,
      fileSizeBytes:
        input.fileSizeBytes != null ? BigInt(input.fileSizeBytes) : null,
      durationSeconds: input.durationSeconds ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
    },
  });
}
