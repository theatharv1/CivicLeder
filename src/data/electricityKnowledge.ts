/**
 * Electricity knowledge + DISCOM hint chips.
 * Official concepts only — not legal advice. GPS never proves DISCOM.
 */

export type ElectricityProviderHint =
  | "brpl"
  | "bypl"
  | "tpddl"
  | "ndmc"
  | "unknown"
  | null;

export type ElectricityKnowledgeCard = {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const ELECTRICITY_RIGHTS_SOURCE = {
  title: "Electricity (Rights of Consumers) Rules, 2020 (as amended 2024)",
  url: "https://powermin.gov.in/en/content/acts-and-notifications",
  dercUrl: "https://www.derc.gov.in/",
  note: "Central Rules prescribe maximums subject to conditions. Delhi SOP/DERC application may refine timelines — not an unconditional promise.",
} as const;

export const ELECTRICITY_KNOWLEDGE_CARDS: ElectricityKnowledgeCard[] = [
  {
    id: "rights",
    title: "Know your electricity consumer rights",
    body: "Consumers have defined rights on connection, metering, billing, reliability and grievance redressal under the Electricity (Rights of Consumers) Rules (as amended). Soft guidance only — not legal advice.",
    sourceLabel: "Ministry of Power / DERC",
    sourceUrl: ELECTRICITY_RIGHTS_SOURCE.url,
  },
  {
    id: "discom",
    title: "Who is my electricity provider?",
    body: "Delhi has BRPL, BYPL, TPDDL and NDMC electricity areas. Confirm from your bill or CA number. GPS alone does not prove your DISCOM.",
    sourceLabel: "DERC — Delhi distribution licensees",
    sourceUrl: ELECTRICITY_RIGHTS_SOURCE.dercUrl,
  },
  {
    id: "compensation",
    title: "Compensation when standards are missed",
    body: "You may be eligible for compensation where an applicable standard of performance was violated — not automatic for every complaint. Keep your official reference number.",
    sourceLabel: "Rights of Consumers Rules + DERC SoP",
    sourceUrl: ELECTRICITY_RIGHTS_SOURCE.dercUrl,
  },
  {
    id: "safety",
    title: "Dangerous electrical situations",
    body: "Live wire, electrical fire, electrocution risk or sparking with immediate danger: stay away, call 112 / 101, then DISCOM emergency only if verified for your provider.",
    sourceLabel: "Emergency 112 / Fire 101",
    sourceUrl: "https://112.gov.in/",
  },
];

export const ELECTRICITY_PROVIDER_OPTIONS: {
  id: NonNullable<ElectricityProviderHint>;
  label: string;
  authoritySlug: string | null;
}[] = [
  { id: "brpl", label: "BRPL", authoritySlug: "brpl" },
  { id: "bypl", label: "BYPL", authoritySlug: "bypl" },
  { id: "tpddl", label: "TPDDL", authoritySlug: "tpddl" },
  { id: "ndmc", label: "NDMC", authoritySlug: "ndmc" },
  { id: "unknown", label: "Not sure", authoritySlug: null },
];

export function authoritySlugForElectricityProvider(
  hint: ElectricityProviderHint
): string | null {
  if (!hint || hint === "unknown") return null;
  return (
    ELECTRICITY_PROVIDER_OPTIONS.find((o) => o.id === hint)?.authoritySlug ??
    null
  );
}

export const ELECTRICITY_EMERGENCY_ISSUE_SLUGS = new Set([
  "electricity_live_wire",
  "electricity_fire",
  "electricity_meter_sparking",
  "electricity_meter_burnt",
  "electricity_safety_hazard",
  "electricity_high_voltage",
  "electricity_transformer_issue",
]);

export const ELECTRICITY_THEFT_ISSUE_SLUGS = new Set([
  "electricity_power_theft_report",
]);

export const ELECTRICITY_BILLING_ISSUE_SLUGS = new Set([
  "electricity_wrong_bill",
  "electricity_high_bill",
  "electricity_payment_not_reflected",
  "electricity_duplicate_payment",
  "electricity_billing_dispute",
]);

export const ELECTRICITY_NO_SUPPLY_ISSUE_SLUGS = new Set([
  "electricity_no_supply",
  "electricity_area_outage",
  "electricity_scheduled_outage",
  "electricity_unscheduled_outage",
]);

export const ELECTRICITY_NEW_CONNECTION_ISSUE_SLUGS = new Set([
  "electricity_new_connection",
  "electricity_connection_delay",
  "electricity_load_change",
  "electricity_name_change",
]);

export function isElectricityEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return ELECTRICITY_EMERGENCY_ISSUE_SLUGS.has(slug);
}

/** Map issue slug → preferred channel purpose for Step 7 filtering. */
export function electricityChannelPurpose(
  issueSlug: string | null
): string {
  if (!issueSlug) return "general_customer_care";
  if (isElectricityEmergencyIssue(issueSlug)) {
    if (issueSlug === "electricity_streetlight") return "streetlight";
    return "fire_shock";
  }
  if (ELECTRICITY_THEFT_ISSUE_SLUGS.has(issueSlug)) return "power_theft";
  if (ELECTRICITY_BILLING_ISSUE_SLUGS.has(issueSlug)) return "billing";
  if (ELECTRICITY_NO_SUPPLY_ISSUE_SLUGS.has(issueSlug)) return "no_supply";
  if (ELECTRICITY_NEW_CONNECTION_ISSUE_SLUGS.has(issueSlug)) {
    return "new_connection";
  }
  if (issueSlug === "electricity_streetlight") return "streetlight";
  if (
    issueSlug.startsWith("electricity_meter_") ||
    issueSlug === "electricity_meter_reading_dispute"
  ) {
    return "metering";
  }
  if (issueSlug === "electricity_solar_rooftop") return "web_portal";
  return "general_customer_care";
}

export const ELECTRICITY_HIDDEN_KNOWLEDGE = [
  {
    id: "compensation",
    title: "YOU MAY NOT KNOW THIS",
    body: "Electricity consumers may have access to compensation mechanisms when applicable service standards are not met — not automatic for every complaint.",
    actionHint: "Keep your official reference and check DISCOM / DERC SoP.",
  },
  {
    id: "channels",
    title: "USEFUL TO KNOW",
    body: "Do not call the same general number for every electricity problem. Some providers have separate channels for theft, fire/safety, no-supply, streetlights or billing.",
    actionHint: "Use the reason-specific BEST action below.",
  },
  {
    id: "escalation",
    title: "YOU MAY NOT KNOW THIS",
    body: "If the appropriate complaint mechanism does not resolve an eligible grievance, a formal escalation structure may be available. CGRF is not the first step for ordinary outages.",
    actionHint: "See escalation only when unresolved / escalating.",
  },
] as const;
