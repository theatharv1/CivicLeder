/**
 * Environment knowledge + jurisdiction hint chips.
 * Official concepts only — not legal advice. GPS never proves authority.
 * Noise → NGMS (not DPCC homepage). Trees/wildlife → Forest. Air → Green Delhi.
 */

export type EnvironmentJurisdictionHint =
  | "dpcc"
  | "green_delhi"
  | "forest"
  | "municipal"
  | "unknown"
  | null;

export type EnvironmentKnowledgeCard = {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type EnvironmentGroup = {
  id: string;
  label: string;
  description: string;
  /** Representative DB issue_types.slug for routing / purpose */
  representativeSlug: string;
};

export const ENVIRONMENT_RIGHTS_SOURCE = {
  title: "Official environment channels (Delhi)",
  ngms: "https://ngms.delhi.gov.in/",
  ngmsTrack: "https://ngms.delhi.gov.in/AuPages/CitizenStatus.aspx",
  forestGrievance: "https://grievance.eforest.delhi.gov.in/",
  forestStatus: "https://ghl.eforest.delhi.gov.in/Status.aspx",
  forestDept: "https://forest.delhi.gov.in/",
  greenDelhi: "https://greendelhi.nic.in/",
  environmentDept: "https://environment.delhi.gov.in/",
  dpcc: "https://www.dpcc.delhigovt.nic.in/",
  cmJanSunwai: "https://cmjansunwai.delhi.gov.in/",
  greenDelhiPlay:
    "https://play.google.com/store/apps/details?id=com.green_delhi_teste",
  greenDelhiIos: "https://apps.apple.com/app/id1586987377",
  note: "Not every environment issue goes to DPCC. Noise uses NGMS / 155271. Trees and wildlife use Forest channels. GPS alone does not prove jurisdiction.",
} as const;

/** Step 2 groups — keep descriptions extremely simple. */
export const ENVIRONMENT_GROUPS: EnvironmentGroup[] = [
  {
    id: "air_pollution",
    label: "Air Pollution",
    description: "Smoke, dust or air-quality concern",
    representativeSlug: "air_pollution_concern",
  },
  {
    id: "noise_pollution",
    label: "Noise Pollution",
    description: "Loud music, DJ, generator or noise",
    representativeSlug: "noise_pollution_concern",
  },
  {
    id: "water_pollution_env",
    label: "Water Pollution",
    description: "Polluted water body or industrial discharge (env)",
    representativeSlug: "water_pollution_env_concern",
  },
  {
    id: "soil_pollution",
    label: "Soil / Land",
    description: "Soil contamination or polluted land concern",
    representativeSlug: "soil_pollution_concern",
  },
  {
    id: "trees_forest",
    label: "Trees / Forest",
    description: "Tree cutting, damage or forest concern",
    representativeSlug: "tree_cutting_damage",
  },
  {
    id: "wildlife",
    label: "Wildlife",
    description: "Wildlife sighting, conflict or offence concern",
    representativeSlug: "wildlife_concern",
  },
  {
    id: "hazards",
    label: "Env. Hazards",
    description: "Chemical spill, fire, falling tree or similar hazard",
    representativeSlug: "chemical_spill_hazard",
  },
  {
    id: "other",
    label: "Other",
    description: "Something else in this category",
    representativeSlug: "environment_other",
  },
];

export const ENVIRONMENT_KNOWLEDGE_CARDS: EnvironmentKnowledgeCard[] = [
  {
    id: "authority",
    title: "Who handles environment issues?",
    body: "Not every environment issue goes to DPCC. Noise often uses the NGMS portal and 155271. Trees and wildlife use Forest Department channels. Air / general pollution often uses Green Delhi. Municipal bodies may apply for some land or asset cases. GPS alone does not prove jurisdiction.",
    sourceLabel: "NGMS / Forest / Green Delhi / DPCC",
    sourceUrl: ENVIRONMENT_RIGHTS_SOURCE.ngms,
  },
  {
    id: "noise",
    title: "Noise is not a DPCC homepage complaint",
    body: "For noise pollution, use NGMS (ngms.delhi.gov.in) or call 155271. Do not start with the DPCC or Environment Department homepage when NGMS is available.",
    sourceLabel: "NGMS Delhi",
    sourceUrl: ENVIRONMENT_RIGHTS_SOURCE.ngms,
  },
  {
    id: "trees",
    title: "Trees and wildlife → Forest",
    body: "Tree cutting / damage and wildlife concerns use the Forest grievance portal and Green Helpline 1800-11-8600. Not every park issue is a Forest case — some parks are municipal.",
    sourceLabel: "Forest Department Delhi",
    sourceUrl: ENVIRONMENT_RIGHTS_SOURCE.forestGrievance,
  },
  {
    id: "escalation",
    title: "CM Jan Sunwai is a fallback",
    body: "When a specialized channel exists (NGMS, Forest, Green Delhi), use it first. CM Jan Sunwai is a general grievance portal — not the first step for noise, trees, or pollution when a direct channel is available.",
    sourceLabel: "CM Jan Sunwai",
    sourceUrl: ENVIRONMENT_RIGHTS_SOURCE.cmJanSunwai,
  },
];

export const ENVIRONMENT_JURISDICTION_OPTIONS: {
  id: NonNullable<EnvironmentJurisdictionHint>;
  label: string;
  authoritySlug: string | null;
}[] = [
  { id: "dpcc", label: "DPCC", authoritySlug: "dpcc" },
  { id: "green_delhi", label: "Green Delhi", authoritySlug: "dpcc" },
  { id: "forest", label: "Forest", authoritySlug: "delhi_forest" },
  { id: "municipal", label: "Municipal", authoritySlug: "mcd" },
  { id: "unknown", label: "Not sure", authoritySlug: null },
];

export function authoritySlugForEnvironmentJurisdiction(
  hint: EnvironmentJurisdictionHint
): string | null {
  if (!hint || hint === "unknown") return null;
  return (
    ENVIRONMENT_JURISDICTION_OPTIONS.find((o) => o.id === hint)?.authoritySlug ??
    null
  );
}

export function environmentGroupForIssueSlug(
  slug: string | null
): EnvironmentGroup | null {
  if (!slug) return null;
  const direct = ENVIRONMENT_GROUPS.find(
    (g) => g.representativeSlug === slug || g.id === slug
  );
  if (direct) return direct;

  if (
    slug.startsWith("air_") ||
    slug.includes("air_pollution") ||
    slug === "dust_pollution_concern" ||
    slug === "smoke_emission_concern"
  ) {
    return ENVIRONMENT_GROUPS.find((g) => g.id === "air_pollution") ?? null;
  }
  if (slug.includes("noise")) {
    return ENVIRONMENT_GROUPS.find((g) => g.id === "noise_pollution") ?? null;
  }
  if (
    slug.includes("water_pollution") ||
    slug === "industrial_discharge_water" ||
    slug === "polluted_water_body"
  ) {
    return (
      ENVIRONMENT_GROUPS.find((g) => g.id === "water_pollution_env") ?? null
    );
  }
  if (slug.includes("soil") || slug.includes("land_contamination")) {
    return ENVIRONMENT_GROUPS.find((g) => g.id === "soil_pollution") ?? null;
  }
  if (
    slug.includes("tree") ||
    slug.includes("forest") ||
    slug === "falling_tree_hazard"
  ) {
    return ENVIRONMENT_GROUPS.find((g) => g.id === "trees_forest") ?? null;
  }
  if (slug.includes("wildlife") || slug.includes("animal_conflict")) {
    return ENVIRONMENT_GROUPS.find((g) => g.id === "wildlife") ?? null;
  }
  if (
    slug.includes("chemical") ||
    slug.includes("hazard") ||
    slug.includes("env_fire")
  ) {
    return ENVIRONMENT_GROUPS.find((g) => g.id === "hazards") ?? null;
  }
  return ENVIRONMENT_GROUPS.find((g) => g.id === "other") ?? null;
}

export const ENVIRONMENT_EMERGENCY_ISSUE_SLUGS = new Set([
  "chemical_spill_hazard",
  "env_fire_hazard",
  "falling_tree_hazard",
  "wildlife_danger",
]);

export function isEnvironmentEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return ENVIRONMENT_EMERGENCY_ISSUE_SLUGS.has(slug);
}

/** Map issue slug → preferred channel purpose for Step 7 filtering. */
export function environmentChannelPurpose(issueSlug: string | null): string {
  if (!issueSlug) return "grievance";
  if (isEnvironmentEmergencyIssue(issueSlug)) return "emergency";
  if (issueSlug.includes("noise")) return "noise_pollution";
  if (
    issueSlug.includes("tree") ||
    issueSlug.includes("forest") ||
    issueSlug === "falling_tree_hazard"
  ) {
    return "trees_forest";
  }
  if (issueSlug.includes("wildlife")) return "wildlife";
  if (
    issueSlug.includes("air_") ||
    issueSlug.includes("dust_") ||
    issueSlug.includes("smoke_")
  ) {
    return "air_pollution";
  }
  if (
    issueSlug.includes("water_pollution") ||
    issueSlug.includes("industrial_discharge") ||
    issueSlug.includes("polluted_water")
  ) {
    return "water_pollution";
  }
  if (issueSlug.includes("soil") || issueSlug.includes("land_contamination")) {
    return "soil_pollution";
  }
  if (issueSlug.includes("burning")) return "burning";
  return "grievance";
}

export const ENVIRONMENT_HIDDEN_KNOWLEDGE = [
  {
    id: "authority",
    title: "YOU MAY NOT KNOW THIS",
    body: "Not every environment issue goes to DPCC. Noise uses NGMS / 155271. Trees and wildlife use Forest channels. Confirm jurisdiction before filing.",
    actionHint: "Use the jurisdiction chips and purpose-specific BEST action.",
  },
  {
    id: "noise",
    title: "USEFUL TO KNOW",
    body: "NGMS lets you file and track noise complaints. Helpline 155271 is for noise. Do not open the DPCC homepage first for ordinary noise.",
    actionHint: "Open NGMS or call 155271.",
  },
  {
    id: "reference",
    title: "YOU MAY NOT KNOW THIS",
    body: "MD-###### is only your CivicLeder ID. Save the official reference the authority gives you. Status is “recorded by you” unless an official API exists.",
    actionHint: "Track via NGMS Citizen Status or Forest Status when applicable.",
  },
] as const;

/** Verified noise helpline — not a DPCC number. */
export const NOISE_HELPLINE = {
  number: "155271",
  label: "Noise pollution helpline",
  sourceUrl: ENVIRONMENT_RIGHTS_SOURCE.ngms,
  note: "Delhi Police / NGMS-linked noise helpline. Prefer NGMS portal when you can file online.",
} as const;

/** Forest Green Helpline. */
export const FOREST_GREEN_HELPLINE = {
  number: "1800118600",
  display: "1800-11-8600",
  label: "Forest Green Helpline",
  sourceUrl: ENVIRONMENT_RIGHTS_SOURCE.forestGrievance,
  note: "Tree / wildlife / forest grievances. Not every municipal park → Forest.",
} as const;

/** Cross-route: garbage collection / dumping belong in Waste — not Environment. */
export const ENVIRONMENT_CROSS_ROUTE_HINTS = [
  {
    id: "waste",
    title: "Garbage / dumping?",
    body: "Missed collection, dumping, or municipal garbage usually belongs under Waste & Garbage — not Environment.",
  },
  {
    id: "water",
    title: "Supply / sewer / drain?",
    body: "Household water supply, sewer blockage, or drainage waterlogging usually belongs under Water & Drainage.",
  },
  {
    id: "construction",
    title: "Construction dust / site?",
    body: "Active construction-site dust or unsafe sites may fit Construction; air pollution from other sources may stay here.",
  },
] as const;
