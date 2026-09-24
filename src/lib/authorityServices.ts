import {
  DFS_COMPLAINT_SERVICE_FALLBACK,
  DFS_COMPLAINT_URL,
  DFS_EMERGENCY_SERVICE_FALLBACK,
  type FallbackAuthorityService,
} from "../data/dfsEmergencyFieldsFallback";
import { FALLBACK_ELECTRICITY_SERVICES } from "../data/electricityFallback";
import { FALLBACK_WATER_DRAINAGE_SERVICES } from "../data/waterDrainageFallback";
import { FALLBACK_WASTE_GARBAGE_SERVICES } from "../data/wasteGarbageFallback";
import { FALLBACK_ROADS_PUBLIC_SPACES_SERVICES } from "../data/roadsPublicSpacesFallback";
import { FALLBACK_ENVIRONMENT_SERVICES } from "../data/environmentFallback";
import { api, apiConfigured } from "./apiClient";

function dfsFallbacks(preferEmergency?: boolean): AuthorityService[] {
  if (preferEmergency) {
    return [
      fromFallback(DFS_EMERGENCY_SERVICE_FALLBACK),
      fromFallback(DFS_COMPLAINT_SERVICE_FALLBACK),
    ];
  }
  return [
    fromFallback(DFS_COMPLAINT_SERVICE_FALLBACK),
    fromFallback(DFS_EMERGENCY_SERVICE_FALLBACK),
  ];
}

function electricityFallbacks(
  authoritySlug: string,
  preferEmergency?: boolean
): AuthorityService[] {
  const list = FALLBACK_ELECTRICITY_SERVICES[authoritySlug] ?? [];
  const mapped = list.map(fromFallback);
  if (!preferEmergency) return mapped;
  return [
    ...mapped.filter((s) => s.service_type === "emergency"),
    ...mapped.filter((s) => s.service_type !== "emergency"),
  ];
}

function waterDrainageFallbacks(
  authoritySlug: string,
  preferEmergency?: boolean
): AuthorityService[] {
  const list = FALLBACK_WATER_DRAINAGE_SERVICES[authoritySlug] ?? [];
  const mapped = list.map(fromFallback);
  if (!preferEmergency) return mapped;
  return [
    ...mapped.filter((s) => s.service_type === "emergency"),
    ...mapped.filter((s) => s.service_type !== "emergency"),
  ];
}

function wasteGarbageFallbacks(
  authoritySlug: string,
  preferEmergency?: boolean
): AuthorityService[] {
  const list = FALLBACK_WASTE_GARBAGE_SERVICES[authoritySlug] ?? [];
  const mapped = list.map(fromFallback);
  if (!preferEmergency) return mapped;
  return [
    ...mapped.filter((s) => s.service_type === "emergency"),
    ...mapped.filter((s) => s.service_type !== "emergency"),
  ];
}

function roadsPublicSpacesFallbacks(
  authoritySlug: string,
  preferEmergency?: boolean
): AuthorityService[] {
  const list = FALLBACK_ROADS_PUBLIC_SPACES_SERVICES[authoritySlug] ?? [];
  const mapped = list.map(fromFallback);
  if (!preferEmergency) return mapped;
  return [
    ...mapped.filter((s) => s.service_type === "emergency"),
    ...mapped.filter((s) => s.service_type !== "emergency"),
  ];
}

function environmentFallbacks(
  authoritySlug: string,
  preferEmergency?: boolean
): AuthorityService[] {
  const list = FALLBACK_ENVIRONMENT_SERVICES[authoritySlug] ?? [];
  const mapped = list.map(fromFallback);
  if (!preferEmergency) return mapped;
  return [
    ...mapped.filter((s) => s.service_type === "emergency"),
    ...mapped.filter((s) => s.service_type !== "emergency"),
  ];
}

function offlineAuthorityServices(
  authoritySlug: string,
  opts?: {
    preferEmergency?: boolean;
    preferWaterSupply?: boolean;
    preferWaterlogging?: boolean;
    preferBilling?: boolean;
    preferWaste?: boolean;
    preferRoads?: boolean;
    preferEnvironment?: boolean;
  }
): AuthorityService[] {
  const ELEC_AUTH_SLUGS = new Set(["brpl", "bypl", "tpddl", "ndmc"]);
  if (authoritySlug === "delhi_fire_service") {
    return dfsFallbacks(opts?.preferEmergency);
  }
  if (
    authoritySlug === "ngms_noise" ||
    authoritySlug === "delhi_forest" ||
    authoritySlug === "environment_dept_delhi"
  ) {
    return environmentFallbacks(authoritySlug, opts?.preferEmergency);
  }
  if (
    authoritySlug === "delhi_jal_board" ||
    authoritySlug === "irrigation_flood_control"
  ) {
    const water = waterDrainageFallbacks(authoritySlug, opts?.preferEmergency);
    const roads = roadsPublicSpacesFallbacks(
      authoritySlug,
      opts?.preferEmergency
    );
    if (opts?.preferRoads) return [...roads, ...water];
    return [...water, ...roads];
  }
  if (authoritySlug === "dpcc") {
    const waste = wasteGarbageFallbacks(authoritySlug, opts?.preferEmergency);
    const env = environmentFallbacks(authoritySlug, opts?.preferEmergency);
    if (opts?.preferEnvironment) return [...env, ...waste];
    if (opts?.preferWaste) return [...waste, ...env];
    return [...env, ...waste];
  }
  if (authoritySlug === "delhi_cantonment") {
    const waste = wasteGarbageFallbacks(authoritySlug, opts?.preferEmergency);
    const roads = roadsPublicSpacesFallbacks(
      authoritySlug,
      opts?.preferEmergency
    );
    if (opts?.preferRoads) return [...roads, ...waste];
    if (opts?.preferWaste) return [...waste, ...roads];
    return [...waste, ...roads];
  }
  if (
    authoritySlug === "pwd_delhi" ||
    authoritySlug === "delhi_traffic_police"
  ) {
    const roads = roadsPublicSpacesFallbacks(authoritySlug, opts?.preferEmergency);
    const env = environmentFallbacks(authoritySlug, opts?.preferEmergency);
    if (opts?.preferEnvironment) return [...env, ...roads];
    return [...roads, ...env];
  }
  if (authoritySlug === "dda") {
    const roads = roadsPublicSpacesFallbacks(authoritySlug, opts?.preferEmergency);
    const env = environmentFallbacks(authoritySlug, opts?.preferEmergency);
    if (opts?.preferEnvironment) return [...env, ...roads];
    return [...roads, ...env];
  }
  if (authoritySlug === "mcd") {
    const water = waterDrainageFallbacks("mcd", opts?.preferEmergency);
    const waste = wasteGarbageFallbacks("mcd", opts?.preferEmergency);
    const roads = roadsPublicSpacesFallbacks("mcd", opts?.preferEmergency);
    const env = environmentFallbacks("mcd", opts?.preferEmergency);
    if (opts?.preferEnvironment) return [...env, ...waste, ...water, ...roads];
    if (opts?.preferRoads) return [...roads, ...waste, ...water, ...env];
    if (opts?.preferWaste) return [...waste, ...water, ...roads, ...env];
    const preferWater =
      Boolean(opts?.preferWaterSupply) ||
      Boolean(opts?.preferWaterlogging) ||
      Boolean(opts?.preferBilling);
    if (preferWater) return [...water, ...waste, ...roads, ...env];
    return [...waste, ...water, ...roads, ...env].length
      ? [...waste, ...water, ...roads, ...env]
      : [];
  }
  if (authoritySlug === "ndmc") {
    const water = waterDrainageFallbacks("ndmc", opts?.preferEmergency);
    const waste = wasteGarbageFallbacks("ndmc", opts?.preferEmergency);
    const elec = electricityFallbacks("ndmc", opts?.preferEmergency);
    const roads = roadsPublicSpacesFallbacks("ndmc", opts?.preferEmergency);
    const env = environmentFallbacks("ndmc", opts?.preferEmergency);
    if (opts?.preferEnvironment) return [...env, ...roads, ...waste, ...water, ...elec];
    if (opts?.preferRoads) return [...roads, ...waste, ...water, ...elec, ...env];
    if (opts?.preferWaste) return [...waste, ...water, ...elec, ...roads, ...env];
    const preferWater =
      Boolean(opts?.preferWaterSupply) ||
      Boolean(opts?.preferWaterlogging) ||
      Boolean(opts?.preferBilling);
    if (preferWater) return [...water, ...waste, ...elec, ...roads, ...env];
    return [...elec, ...water, ...waste, ...roads, ...env];
  }
  if (ELEC_AUTH_SLUGS.has(authoritySlug)) {
    return electricityFallbacks(authoritySlug, opts?.preferEmergency);
  }
  return [];
}

export type AuthorityServiceField = {
  field_key: string;
  label: string;
  description: string | null;
  field_type: string;
  requiredness: "required" | "recommended" | "may_be_requested";
  sort_order: number;
};

export type AuthorityService = {
  id: string | null;
  slug: string;
  service_name: string;
  description: string | null;
  service_type: string;
  official_url: string | null;
  filing_url: string | null;
  tracking_url: string | null;
  phone: string | null;
  integration_type: string;
  authority_slug: string;
  fields: AuthorityServiceField[];
};

function fromFallback(fb: FallbackAuthorityService): AuthorityService {
  return {
    id: null,
    slug: fb.slug,
    service_name: fb.service_name,
    description: fb.description,
    service_type: fb.service_type,
    official_url: fb.official_url,
    filing_url: fb.filing_url,
    tracking_url: fb.tracking_url,
    phone: fb.phone,
    integration_type: fb.integration_type,
    authority_slug: fb.authority_slug,
    fields: fb.fields,
  };
}

/**
 * Prefer emergency service when draft is an emergency.
 * For Building: prefer complaint (MCD311 etc.) over contact info; approval
 * services only when the issue is plan/approval related.
 */
export function pickPreferredService(
  services: AuthorityService[],
  isEmergency: boolean,
  opts?: {
    preferBuildingContact?: boolean;
    preferApproval?: boolean;
    preferTheft?: boolean;
    preferNoSupply?: boolean;
    preferBilling?: boolean;
    preferWaterSupply?: boolean;
    preferWaterlogging?: boolean;
    preferWaste?: boolean;
    preferRoads?: boolean;
    preferEnvironment?: boolean;
  }
): AuthorityService | null {
  if (!services.length) return null;
  if (isEmergency) {
    const emergency =
      services.find((s) => s.service_type === "emergency") ??
      services.find((s) => s.phone === "101" || s.phone === "112");
    if (emergency) return emergency;
  }
  if (opts?.preferTheft) {
    const theft = services.find(
      (s) =>
        s.slug.includes("power_theft") || s.slug.includes("theft")
    );
    if (theft) return theft;
  }
  if (opts?.preferNoSupply) {
    const noSupply = services.find(
      (s) =>
        s.slug.includes("no_supply") ||
        s.slug.includes("no_current") ||
        s.slug.includes("sampark")
    );
    if (noSupply) return noSupply;
  }
  if (opts?.preferBilling) {
    const billing = services.find(
      (s) =>
        s.slug.includes("billing") ||
        (s.service_type === "complaint" && Boolean(s.phone))
    );
    if (billing) return billing;
  }
  if (opts?.preferWaterSupply) {
    const water = services.find(
      (s) =>
        s.slug.includes("water_supply") ||
        s.slug.includes("water_sewer") ||
        s.slug.includes("kali_bari")
    );
    if (water) return water;
  }
  if (opts?.preferWaterlogging) {
    const wl = services.find(
      (s) =>
        s.slug.includes("waterlogging") ||
        s.slug.includes("flood") ||
        s.slug.includes("ifc_")
    );
    if (wl) return wl;
  }
  if (opts?.preferWaste) {
    const waste = services.find(
      (s) =>
        s.slug.includes("waste") ||
        s.slug.includes("mcd311_waste") ||
        s.slug.includes("green_delhi") ||
        s.slug.includes("burning")
    );
    if (waste) return waste;
  }
  if (opts?.preferRoads) {
    const roads = services.find(
      (s) =>
        s.slug.includes("roads") ||
        s.slug.includes("pwd_sewa") ||
        s.slug.includes("traffic_citizen") ||
        s.slug.includes("mcd311_roads")
    );
    if (roads) return roads;
  }
  if (opts?.preferEnvironment) {
    const env = services.find(
      (s) =>
        s.slug.includes("ngms") ||
        s.slug.includes("forest") ||
        s.slug.includes("green_delhi") ||
        s.slug.includes("_env")
    );
    if (env) return env;
  }
  if (opts?.preferApproval) {
    const approval =
      services.find((s) => s.service_type === "approval") ??
      services.find((s) => s.slug.endsWith("_building_plan_approval"));
    if (approval) return approval;
  }
  // Prefer verified complaint / grievance filing over generic contact
  const complaintWithFiling = services.find(
    (s) =>
      Boolean(s.filing_url) &&
      (s.service_type === "complaint" || s.service_type === "grievance")
  );
  if (complaintWithFiling && !opts?.preferApproval) return complaintWithFiling;

  if (opts?.preferBuildingContact) {
    const buildingContact = services.find((s) =>
      s.slug.endsWith("_building_contact")
    );
    if (buildingContact) return buildingContact;
  }
  const withFiling = services.find(
    (s) =>
      Boolean(s.filing_url) &&
      s.service_type !== "emergency" &&
      s.service_type !== "approval"
  );
  if (withFiling) return withFiling;
  const complaint = services.find(
    (s) =>
      s.service_type === "complaint" ||
      s.service_type === "grievance"
  );
  if (complaint) return complaint;
  const nonEmergencyPhone = services.find(
    (s) => Boolean(s.phone) && s.service_type !== "emergency"
  );
  return nonEmergencyPhone ?? services[0] ?? null;
}

export async function fetchAuthorityServices(
  authoritySlug: string | null,
  opts?: {
    preferEmergency?: boolean;
    preferWaterSupply?: boolean;
    preferWaterlogging?: boolean;
    preferBilling?: boolean;
    preferWaste?: boolean;
    preferRoads?: boolean;
    preferEnvironment?: boolean;
  }
): Promise<AuthorityService[]> {
  if (!authoritySlug) {
    return opts?.preferEmergency ? dfsFallbacks(true) : [];
  }

  if (!apiConfigured) {
    return offlineAuthorityServices(authoritySlug, opts);
  }

  const result = await api.getAuthorityServices(authoritySlug);
  if (!result.ok) {
    return offlineAuthorityServices(authoritySlug, opts);
  }

  const services = (result.data.services ?? []) as Record<string, unknown>[];
  if (!services.length) {
    return offlineAuthorityServices(authoritySlug, opts);
  }

  return services.map((s) => {
    const fieldsRaw = (s.fields as Record<string, unknown>[] | undefined) ?? [];
    const serviceKey = String(s.serviceKey ?? s.slug ?? "");
    const isDfsComplaint = serviceKey === "dfs_complaint_grievances_info";
    const filingUrl =
      (s.actionUrl as string | null) ??
      (s.filing_url as string | null) ??
      (isDfsComplaint ? DFS_COMPLAINT_URL : null);
    return {
      id: String(s.id),
      slug: serviceKey,
      service_name: String(s.title ?? s.service_name ?? ""),
      description: (s.description as string | null) ?? null,
      service_type: String(s.channelType ?? s.service_type ?? "information"),
      official_url:
        (s.actionUrl as string | null) ??
        (s.official_url as string | null) ??
        (isDfsComplaint ? DFS_COMPLAINT_URL : null),
      filing_url: filingUrl,
      tracking_url:
        (s.trackingUrl as string | null) ??
        (s.tracking_url as string | null) ??
        null,
      phone:
        (s.channelValue as string | null) ?? (s.phone as string | null) ?? null,
      integration_type: "" as string,
      authority_slug: authoritySlug,
      fields:
        fieldsRaw.length > 0
          ? fieldsRaw.map((f) => ({
              field_key: String(f.fieldKey ?? f.field_key ?? ""),
              label: String(f.label ?? ""),
              description:
                (f.helpText as string | null) ??
                (f.description as string | null) ??
                null,
              field_type: String(f.fieldType ?? f.field_type ?? "text"),
              requiredness: (f.required
                ? "required"
                : ((f.requiredness as AuthorityServiceField["requiredness"]) ??
                  "recommended")) as AuthorityServiceField["requiredness"],
              sort_order: Number(f.sortOrder ?? f.sort_order ?? 0),
            }))
          : isDfsComplaint
            ? DFS_COMPLAINT_SERVICE_FALLBACK.fields
            : [],
    };
  });
}
