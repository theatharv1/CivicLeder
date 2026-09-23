/**
 * Waste & Garbage knowledge + jurisdiction hint chips.
 * Official concepts only — not legal advice. GPS never proves authority.
 */

export type WasteJurisdictionHint =
  | "mcd"
  | "ndmc"
  | "cantonment"
  | "dpcc_env"
  | "unknown"
  | null;

export type WasteGarbageKnowledgeCard = {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type WasteGarbageGroup = {
  id: string;
  label: string;
  description: string;
  /** Representative DB issue_types.slug for routing / purpose */
  representativeSlug: string;
};

export const WASTE_GARBAGE_RIGHTS_SOURCE = {
  title: "Official waste / sanitation channels (Delhi)",
  url: "https://mcdonline.nic.in/portal/feedback",
  ndmcComplaints: "https://www.ndmc.gov.in/complaints.aspx",
  greenDelhi: "https://greendelhi.nic.in/",
  cpcbRules: "https://cpcb.nic.in/rules-7/",
  note: "Authority depends on issue and location. Never all waste → MCD or all → DPCC. Timelines: see current official service standard — not invented here.",
} as const;

/** Step 2 groups — keep descriptions extremely simple. */
export const WASTE_GARBAGE_GROUPS: WasteGarbageGroup[] = [
  {
    id: "garbage_collection",
    label: "Garbage Collection",
    description: "Missed, irregular or overflowing collection",
    representativeSlug: "missed_garbage_collection",
  },
  {
    id: "dumping_littering",
    label: "Dumping & Littering",
    description: "Open dump, littering or unclean spot",
    representativeSlug: "garbage_dumping",
  },
  {
    id: "waste_burning",
    label: "Waste Burning",
    description: "Leaf, garbage or open burning",
    representativeSlug: "garbage_burning",
  },
  {
    id: "segregation",
    label: "Segregation",
    description: "Mixed waste or segregation concern",
    representativeSlug: "waste_segregation_not_followed",
  },
  {
    id: "construction_waste",
    label: "Construction Waste",
    description: "Malba or C&D waste dumping",
    representativeSlug: "malba_dumping",
  },
  {
    id: "plastic",
    label: "Plastic",
    description: "Plastic dumping, littering or compliance",
    representativeSlug: "plastic_waste_dumping",
  },
  {
    id: "e_waste",
    label: "E-Waste",
    description: "Electronic waste dumping or disposal",
    representativeSlug: "e_waste_dumping",
  },
  {
    id: "hazardous_medical",
    label: "Hazardous / Medical",
    description: "Hazardous, biomedical or sharps concern",
    representativeSlug: "hazardous_waste_concern",
  },
  {
    id: "other",
    label: "Other",
    description: "Something else",
    representativeSlug: "waste_garbage_other",
  },
];

export const WASTE_GARBAGE_KNOWLEDGE_CARDS: WasteGarbageKnowledgeCard[] = [
  {
    id: "authority",
    title: "Who handles waste & garbage?",
    body: "Not every waste issue goes to MCD. Collection and dumping often involve MCD, NDMC or Cantonment by area. Burning, plastic compliance, hazardous and biomedical may involve DPCC. GPS alone does not prove jurisdiction.",
    sourceLabel: "MCD / NDMC / DPCC",
    sourceUrl: WASTE_GARBAGE_RIGHTS_SOURCE.url,
  },
  {
    id: "burning",
    title: "Burning is not missed collection",
    body: "Active fire: call 112 / 101 first. Then Green Delhi or DPCC burning WhatsApp (leaf/garbage burning only — not a universal waste number). Municipal helplines may also apply.",
    sourceLabel: "Green Delhi / DPCC",
    sourceUrl: WASTE_GARBAGE_RIGHTS_SOURCE.greenDelhi,
  },
  {
    id: "cd_ewaste",
    title: "C&D and e-waste are different streams",
    body: "Malba / C&D dumping may use municipal dumping channels plus DPCC regulatory alternatives. E-waste, hazardous and biomedical are not auto MCD collection.",
    sourceLabel: "MCD / DPCC",
    sourceUrl: WASTE_GARBAGE_RIGHTS_SOURCE.url,
  },
  {
    id: "segregation",
    title: "Segregation at source",
    body: "SWM Rules, 2026 (in force from 1 April 2026) emphasize segregation. Local practice varies. No invented fines here — follow official local guidance.",
    sourceLabel: "CPCB waste rules",
    sourceUrl: WASTE_GARBAGE_RIGHTS_SOURCE.cpcbRules,
  },
];

export const WASTE_JURISDICTION_OPTIONS: {
  id: NonNullable<WasteJurisdictionHint>;
  label: string;
  authoritySlug: string | null;
}[] = [
  { id: "mcd", label: "MCD", authoritySlug: "mcd" },
  { id: "ndmc", label: "NDMC", authoritySlug: "ndmc" },
  {
    id: "cantonment",
    label: "Cantonment",
    authoritySlug: "delhi_cantonment",
  },
  { id: "dpcc_env", label: "DPCC env", authoritySlug: "dpcc" },
  { id: "unknown", label: "Not sure", authoritySlug: null },
];

export function authoritySlugForWasteJurisdiction(
  hint: WasteJurisdictionHint
): string | null {
  if (!hint || hint === "unknown") return null;
  return (
    WASTE_JURISDICTION_OPTIONS.find((o) => o.id === hint)?.authoritySlug ?? null
  );
}

export function wasteGroupForIssueSlug(
  slug: string | null
): WasteGarbageGroup | null {
  if (!slug) return null;
  const direct = WASTE_GARBAGE_GROUPS.find(
    (g) => g.representativeSlug === slug || g.id === slug
  );
  if (direct) return direct;

  if (
    slug.startsWith("missed_") ||
    slug.startsWith("irregular_garbage") ||
    slug === "overflowing_bin" ||
    slug === "garbage_not_collected" ||
    slug === "community_bin_issue" ||
    slug === "door_to_door_collection_issue" ||
    slug.startsWith("bulk_waste") ||
    slug === "dhalao_facility_concern" ||
    slug === "dead_animal_removal"
  ) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "garbage_collection") ?? null;
  }
  if (
    slug === "garbage_dumping" ||
    slug === "open_garbage_dump" ||
    slug === "littering_public_place" ||
    slug === "stagnant_waste_odour_concern" ||
    slug === "sanitation_public_health_concern"
  ) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "dumping_littering") ?? null;
  }
  if (
    slug.includes("burning") ||
    slug === "waste_fire_hazard" ||
    slug === "large_waste_burning_fire"
  ) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "waste_burning") ?? null;
  }
  if (
    slug.includes("segregation") ||
    slug === "mixed_waste_concern" ||
    slug === "wet_dry_segregation_concern"
  ) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "segregation") ?? null;
  }
  if (
    slug.startsWith("malba_") ||
    slug.startsWith("cd_waste") ||
    slug === "waste_processing_facility_concern"
  ) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "construction_waste") ?? null;
  }
  if (slug.startsWith("plastic_")) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "plastic") ?? null;
  }
  if (slug.startsWith("e_waste")) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "e_waste") ?? null;
  }
  if (
    slug.startsWith("hazardous_") ||
    slug.startsWith("biomedical_") ||
    slug === "sharps_exposure_hazard"
  ) {
    return WASTE_GARBAGE_GROUPS.find((g) => g.id === "hazardous_medical") ?? null;
  }
  return WASTE_GARBAGE_GROUPS.find((g) => g.id === "other") ?? null;
}

export const WASTE_EMERGENCY_ISSUE_SLUGS = new Set([
  "large_waste_burning_fire",
  "waste_fire_hazard",
  "sharps_exposure_hazard",
]);

export const WASTE_COLLECTION_ISSUE_SLUGS = new Set([
  "missed_garbage_collection",
  "irregular_garbage_collection",
  "overflowing_bin",
  "garbage_not_collected",
  "community_bin_issue",
  "door_to_door_collection_issue",
  "bulk_waste_not_collected",
  "bulk_waste_dumping",
  "dhalao_facility_concern",
  "dead_animal_removal",
]);

export const WASTE_DUMPING_ISSUE_SLUGS = new Set([
  "garbage_dumping",
  "open_garbage_dump",
  "littering_public_place",
  "sanitation_public_health_concern",
  "stagnant_waste_odour_concern",
]);

export const WASTE_BURNING_ISSUE_SLUGS = new Set([
  "garbage_burning",
  "leaf_burning",
  "large_waste_burning_fire",
  "waste_fire_hazard",
]);

export const WASTE_SEGREGATION_ISSUE_SLUGS = new Set([
  "waste_segregation_not_followed",
  "mixed_waste_concern",
  "wet_dry_segregation_concern",
]);

export const WASTE_CD_ISSUE_SLUGS = new Set([
  "malba_dumping",
  "cd_waste_dumping",
  "cd_waste_roadside",
  "waste_processing_facility_concern",
]);

export const WASTE_PLASTIC_ISSUE_SLUGS = new Set([
  "plastic_waste_dumping",
  "plastic_littering",
  "plastic_waste_compliance_concern",
]);

export const WASTE_EWASTE_ISSUE_SLUGS = new Set([
  "e_waste_dumping",
  "e_waste_disposal_concern",
]);

export const WASTE_HAZMAT_ISSUE_SLUGS = new Set([
  "hazardous_waste_concern",
  "biomedical_waste_concern",
  "sharps_exposure_hazard",
]);

export function isWasteEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return WASTE_EMERGENCY_ISSUE_SLUGS.has(slug);
}

export function isWasteBurningIssue(slug: string | null): boolean {
  if (!slug) return false;
  return WASTE_BURNING_ISSUE_SLUGS.has(slug);
}

/** Map issue slug → preferred channel purpose for Step 7 filtering. */
export function wasteChannelPurpose(issueSlug: string | null): string {
  if (!issueSlug) return "grievance";
  if (isWasteEmergencyIssue(issueSlug)) {
    if (issueSlug === "sharps_exposure_hazard") return "emergency";
    return "emergency";
  }
  if (WASTE_BURNING_ISSUE_SLUGS.has(issueSlug)) return "burning";
  if (WASTE_PLASTIC_ISSUE_SLUGS.has(issueSlug)) {
    if (issueSlug === "plastic_waste_compliance_concern") return "plastic_waste";
    return "plastic_waste";
  }
  if (WASTE_CD_ISSUE_SLUGS.has(issueSlug)) return "cd_waste";
  if (WASTE_EWASTE_ISSUE_SLUGS.has(issueSlug)) return "e_waste";
  if (WASTE_HAZMAT_ISSUE_SLUGS.has(issueSlug)) {
    if (issueSlug === "biomedical_waste_concern") return "biomedical_waste";
    return "hazardous_waste";
  }
  if (
    issueSlug === "missed_garbage_collection" ||
    issueSlug === "irregular_garbage_collection" ||
    issueSlug === "garbage_not_collected"
  ) {
    return "missed_collection";
  }
  if (WASTE_COLLECTION_ISSUE_SLUGS.has(issueSlug)) return "garbage_collection";
  if (WASTE_DUMPING_ISSUE_SLUGS.has(issueSlug)) {
    if (issueSlug === "littering_public_place") return "littering";
    if (
      issueSlug === "sanitation_public_health_concern" ||
      issueSlug === "stagnant_waste_odour_concern"
    ) {
      return "public_health";
    }
    return "dumping";
  }
  if (WASTE_SEGREGATION_ISSUE_SLUGS.has(issueSlug)) return "garbage_collection";
  return "grievance";
}

export const WASTE_HIDDEN_KNOWLEDGE = [
  {
    id: "authority",
    title: "YOU MAY NOT KNOW THIS",
    body: "Not every waste issue goes to MCD. Burning and specialized waste often involve DPCC channels — confirmation may be required.",
    actionHint: "Use the jurisdiction chips and purpose-specific BEST action.",
  },
  {
    id: "burning",
    title: "USEFUL TO KNOW",
    body: "Active fire → 112 / 101 first. DPCC WhatsApp 9717593574 is for leaf/garbage burning only — not a universal waste number. Green Delhi tracks pollution complaints after login.",
    actionHint: "Open Green Delhi or use the purpose-specific channel below.",
  },
  {
    id: "reference",
    title: "YOU MAY NOT KNOW THIS",
    body: "MD-###### is only your CivicLeder ID. Save the official reference the authority gives you. Status is “recorded by you” unless an official API exists.",
    actionHint: "Track via MCD311 issuedetail or Green Delhi after login.",
  },
] as const;

/** Verified DPCC burning WhatsApp — show on burning emergency override (after 112/101). */
export const DPCC_BURNING_WHATSAPP = {
  number: "9717593574",
  label: "DPCC burning WhatsApp",
  sourceUrl: "https://www.dpcc.delhigovt.nic.in/",
  note: "Leaf/garbage burning only — not universal waste. Fire → 112/101 first.",
} as const;
