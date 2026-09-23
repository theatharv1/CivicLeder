/**
 * Water & Drainage knowledge + jurisdiction hint chips.
 * Official concepts only — not legal advice. GPS never proves authority.
 */

export type WaterJurisdictionHint =
  | "djb"
  | "mcd"
  | "ndmc"
  | "ifc_flood"
  | "unknown"
  | null;

export type WaterDrainageKnowledgeCard = {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type WaterDrainageGroup = {
  id: string;
  label: string;
  description: string;
  /** Representative DB issue_types.slug for routing / purpose */
  representativeSlug: string;
};

export const WATER_DRAINAGE_RIGHTS_SOURCE = {
  title: "Official water / drainage channels (Delhi)",
  url: "https://djb.gov.in/",
  djbContactPdf: "https://djb.gov.in/StaticContent/ContactUs.pdf",
  ifcFloodRooms: "https://ifc.delhi.gov.in/ifc/flood-control-rooms",
  note: "Authority depends on issue and location. Timelines: see the current official service standard — not invented here.",
} as const;

/** Step 2 groups — keep descriptions extremely simple (spec Part 18). */
export const WATER_DRAINAGE_GROUPS: WaterDrainageGroup[] = [
  {
    id: "open_danger",
    label: "Open drain / uncovered hole",
    description: "Missing cover or open drain — report early",
    representativeSlug: "dangerous_open_manhole",
  },
  {
    id: "waterlogging",
    label: "Waterlogging",
    description: "Water collecting on road or public area",
    representativeSlug: "waterlogging",
  },
  {
    id: "flooding",
    label: "Flooding",
    description: "Rapidly rising or dangerous water",
    representativeSlug: "flooding",
  },
  {
    id: "water_supply",
    label: "No / low water supply",
    description: "No water, low pressure or irregular supply",
    representativeSlug: "water_no_supply",
  },
  {
    id: "sewerage",
    label: "Sewer blocked / overflow",
    description: "Blocked sewer or overflow",
    representativeSlug: "sewer_choked",
  },
  {
    id: "billing",
    label: "Water bill problem",
    description: "Wrong, high or disputed water bill",
    representativeSlug: "water_wrong_bill",
  },
  {
    id: "other",
    label: "Something else (water)",
    description: "Other water or drainage concern",
    representativeSlug: "water_drainage_other",
  },
];

export const WATER_DRAINAGE_KNOWLEDGE_CARDS: WaterDrainageKnowledgeCard[] = [
  {
    id: "authority",
    title: "Who handles water & drainage?",
    body: "Not every water issue goes to DJB. Supply, sewer and billing often involve DJB or NDMC. Drains and road waterlogging may involve MCD, PWD or I&FC. GPS alone does not prove jurisdiction.",
    sourceLabel: "DJB / MCD / NDMC / I&FC",
    sourceUrl: WATER_DRAINAGE_RIGHTS_SOURCE.url,
  },
  {
    id: "djb_zro",
    title: "Find your DJB area / ZRO",
    body: "Official DJB ContactUs.pdf lists area ZRO contacts. Prefer 1916 for water/sewer (option 1) and billing (option 3). We do not list every ZRO in the app.",
    sourceLabel: "DJB ContactUs.pdf",
    sourceUrl: WATER_DRAINAGE_RIGHTS_SOURCE.djbContactPdf,
  },
  {
    id: "flood",
    title: "When waterlogging is an emergency",
    body: "Rapid rise, people trapped, water near electricity, or open manholes under water: call 112 / 101 / 102 first. Then I&FC waterlogging helpline 1800-11-0093 when safe.",
    sourceLabel: "I&FC flood control",
    sourceUrl: WATER_DRAINAGE_RIGHTS_SOURCE.ifcFloodRooms,
  },
  {
    id: "quality",
    title: "Contaminated water concern",
    body: "If you suspect a water-quality problem, avoid drinking it until you obtain appropriate guidance from the relevant official/qualified source. We do not make medical claims.",
    sourceLabel: "DJB / NDMC water channels",
    sourceUrl: WATER_DRAINAGE_RIGHTS_SOURCE.url,
  },
];

export const WATER_JURISDICTION_OPTIONS: {
  id: NonNullable<WaterJurisdictionHint>;
  label: string;
  authoritySlug: string | null;
}[] = [
  { id: "djb", label: "DJB", authoritySlug: "delhi_jal_board" },
  { id: "mcd", label: "MCD", authoritySlug: "mcd" },
  { id: "ndmc", label: "NDMC", authoritySlug: "ndmc" },
  {
    id: "ifc_flood",
    label: "I&FC flood",
    authoritySlug: "irrigation_flood_control",
  },
  { id: "unknown", label: "Not sure", authoritySlug: null },
];

export function authoritySlugForWaterJurisdiction(
  hint: WaterJurisdictionHint
): string | null {
  if (!hint || hint === "unknown") return null;
  return (
    WATER_JURISDICTION_OPTIONS.find((o) => o.id === hint)?.authoritySlug ??
    null
  );
}

export function waterGroupForIssueSlug(
  slug: string | null
): WaterDrainageGroup | null {
  if (!slug) return null;
  const direct = WATER_DRAINAGE_GROUPS.find(
    (g) => g.representativeSlug === slug || g.id === slug
  );
  if (direct) return direct;
  if (
    slug === "dangerous_open_manhole" ||
    slug === "sewer_open_manhole" ||
    slug.includes("open_manhole") ||
    slug.includes("uncovered")
  ) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "open_danger") ?? null;
  }
  if (
    slug.startsWith("water_") &&
    (slug.includes("bill") ||
      slug === "water_wrong_bill" ||
      slug === "water_high_bill" ||
      slug === "water_payment_not_reflected" ||
      slug === "water_billing_dispute" ||
      slug === "water_bill_other")
  ) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "billing") ?? null;
  }
  if (
    slug.startsWith("water_meter") ||
    slug.startsWith("water_new_connection") ||
    slug.startsWith("water_connection") ||
    slug === "water_disconnection" ||
    slug === "water_reconnection" ||
    slug === "water_name_change"
  ) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "other") ?? null;
  }
  if (
    slug === "water_contaminated" ||
    slug === "water_bad_smell_or_taste" ||
    slug === "water_discolored"
  ) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "other") ?? null;
  }
  if (slug.startsWith("water_")) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "water_supply") ?? null;
  }
  if (slug.startsWith("sewer_")) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "sewerage") ?? null;
  }
  if (slug.startsWith("drain_")) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "open_danger") ?? null;
  }
  if (slug.startsWith("waterlogging") || slug === "storm_water_drain_issue") {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "waterlogging") ?? null;
  }
  if (
    slug === "flooding" ||
    slug === "flash_flood_or_rapid_water_rise" ||
    slug === "sewer_exposure_hazard"
  ) {
    return WATER_DRAINAGE_GROUPS.find((g) => g.id === "flooding") ?? null;
  }
  return WATER_DRAINAGE_GROUPS.find((g) => g.id === "other") ?? null;
}

export const WATER_EMERGENCY_ISSUE_SLUGS = new Set([
  "flooding",
  "flash_flood_or_rapid_water_rise",
  "waterlogging_with_traffic_hazard",
  "dangerous_open_manhole",
  "sewer_open_manhole",
  "sewer_exposure_hazard",
]);

export const WATER_SUPPLY_ISSUE_SLUGS = new Set([
  "water_no_supply",
  "water_low_pressure",
  "water_irregular_supply",
  "water_supply_timing",
  "water_leakage",
  "water_main_line_leakage",
  "water_pipe_damage",
  "water_valve_issue",
  "water_booster_pump_issue",
]);

export const WATER_SEWER_ISSUE_SLUGS = new Set([
  "sewer_choked",
  "sewer_overflow",
  "sewer_blockage",
  "sewer_line_damage",
  "sewer_manhole_overflow",
  "sewer_manhole_damaged",
  "sewer_open_manhole",
  "sewer_bad_odour",
  "sewer_backflow",
  "sewer_connection_issue",
  "sewer_exposure_hazard",
]);

export const WATER_DRAINAGE_ISSUE_SLUGS = new Set([
  "drain_choked",
  "drain_overflow",
  "drain_blocked",
  "drain_damaged",
  "drain_desilting_concern",
  "drain_missing",
  "drain_cover_missing",
  "drain_open",
  "roadside_drain_issue",
  "storm_water_drain_issue",
]);

export const WATER_WATERLOGGING_ISSUE_SLUGS = new Set([
  "waterlogging",
  "waterlogging_after_rain",
  "repeated_waterlogging",
  "waterlogging_entering_property",
  "drain_overflow_entering_property",
  "waterlogging_with_traffic_hazard",
]);

export const WATER_FLOOD_ISSUE_SLUGS = new Set([
  "flooding",
  "flash_flood_or_rapid_water_rise",
]);

export const WATER_BILLING_ISSUE_SLUGS = new Set([
  "water_wrong_bill",
  "water_high_bill",
  "water_payment_not_reflected",
  "water_billing_dispute",
  "water_bill_other",
]);

export const WATER_METER_ISSUE_SLUGS = new Set([
  "water_meter_not_working",
  "water_meter_damaged",
  "water_meter_leakage",
  "water_meter_reading_issue",
  "water_meter_testing",
  "water_new_connection",
  "water_connection_delay",
  "water_disconnection",
  "water_reconnection",
  "water_name_change",
  "water_connection_service_issue",
]);

export const WATER_QUALITY_ISSUE_SLUGS = new Set([
  "water_contaminated",
  "water_bad_smell_or_taste",
  "water_discolored",
]);

export function isWaterEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return WATER_EMERGENCY_ISSUE_SLUGS.has(slug);
}

/** Map issue slug → preferred channel purpose for Step 7 filtering. */
export function waterChannelPurpose(issueSlug: string | null): string {
  if (!issueSlug) return "general_customer_care";
  if (WATER_FLOOD_ISSUE_SLUGS.has(issueSlug)) return "flood_control";
  if (isWaterEmergencyIssue(issueSlug)) {
    if (
      issueSlug === "dangerous_open_manhole" ||
      issueSlug === "sewer_open_manhole"
    ) {
      return "emergency";
    }
    return "flood_control";
  }
  if (WATER_WATERLOGGING_ISSUE_SLUGS.has(issueSlug)) return "waterlogging";
  if (WATER_BILLING_ISSUE_SLUGS.has(issueSlug)) return "billing";
  if (WATER_METER_ISSUE_SLUGS.has(issueSlug)) return "meter";
  if (WATER_QUALITY_ISSUE_SLUGS.has(issueSlug)) return "water_quality";
  if (WATER_SEWER_ISSUE_SLUGS.has(issueSlug)) return "sewerage";
  if (WATER_DRAINAGE_ISSUE_SLUGS.has(issueSlug)) return "waterlogging";
  if (WATER_SUPPLY_ISSUE_SLUGS.has(issueSlug)) return "water_supply";
  return "general_customer_care";
}

export const WATER_HIDDEN_KNOWLEDGE = [
  {
    id: "authority",
    title: "YOU MAY NOT KNOW THIS",
    body: "Not every water issue goes to DJB. Road waterlogging often involves municipal or I&FC channels — confirmation may be required.",
    actionHint: "Use the jurisdiction chips and reason-specific BEST action.",
  },
  {
    id: "channels",
    title: "USEFUL TO KNOW",
    body: "DJB uses 1916 (water/sewer option 1; billing option 3). NDMC sewerage contacts are area-specific — there is no single universal NDMC sewer number.",
    actionHint: "Open the official FAQ or call the purpose-specific number below.",
  },
  {
    id: "reference",
    title: "YOU MAY NOT KNOW THIS",
    body: "MD-###### is only your CivicLeder ID. Save the official reference the authority gives you. Status is “recorded by you” unless an official API exists.",
    actionHint: "Track through the official channel (e.g. 1916 + SMS ref for DJB).",
  },
] as const;

/** Verified I&FC waterlogging helpline — show on water emergency override. */
export const IFC_WATERLOGGING_HELPLINE = {
  number: "1800-11-0093",
  label: "I&FC waterlogging",
  sourceUrl: "https://ifc.delhi.gov.in/ifc/organizational-setup",
} as const;
