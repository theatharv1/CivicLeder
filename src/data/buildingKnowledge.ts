/**
 * Building citizen tips — plain language first.
 * Official links only under “Where is this written?” when the user expands a tip.
 * Not legal advice; not a verdict on any property.
 */

export type CitizenTip = {
  id: string;
  /** Short line on the closed row */
  title: string;
  /** What this means in everyday words */
  plain: string;
  /** When a citizen should act (preventive) */
  whenToAct: string;
  /** Human label for the official source */
  whereLabel: string;
  /** Official .gov.in / DDA / municipal URL — open only on request */
  whereUrl: string;
};

export type BuildingGroup = {
  id: string;
  label: string;
  description: string;
  representativeSlug: string;
};

/** Step 2 — few groups instead of ~19 issue rows. */
export const BUILDING_GROUPS: BuildingGroup[] = [
  {
    id: "danger",
    label: "Looks unsafe / may fall",
    description: "Cracks, tilt, collapse risk — act early",
    representativeSlug: "building_collapse_risk",
  },
  {
    id: "extra_floor",
    label: "Extra floor / too tall",
    description: "More floors or height than usual for the plot",
    representativeSlug: "building_extra_floor_concern",
  },
  {
    id: "no_permission",
    label: "Work without clear permission",
    description: "New build or addition that may lack approval",
    representativeSlug: "building_unauthorized_construction_concern",
  },
  {
    id: "wrong_use",
    label: "Wrong use of the building",
    description: "House used as factory / PG beyond permission",
    representativeSlug: "building_use_misuse_concern",
  },
  {
    id: "blocking",
    label: "Blocking road / public space",
    description: "Wall or structure into footpath or road",
    representativeSlug: "building_boundary_structure_concern",
  },
  {
    id: "permit",
    label: "I need a building permit (owner)",
    description: "You want plan approval — not a danger complaint",
    representativeSlug: "building_building_plan_concern",
  },
  {
    id: "other",
    label: "Something else (building)",
    description: "Other building concern",
    representativeSlug: "building_other",
  },
];

export function buildingGroupForIssueSlug(
  slug: string | null
): BuildingGroup | null {
  if (!slug) return null;
  const direct = BUILDING_GROUPS.find(
    (g) => g.representativeSlug === slug || g.id === slug
  );
  if (direct) return direct;
  if (
    slug.includes("collapse") ||
    slug.includes("dangerous") ||
    slug.includes("crack") ||
    slug.includes("structural") ||
    slug.includes("dilapidated") ||
    slug.includes("abandoned") ||
    slug.includes("public_safety") ||
    slug.includes("heritage")
  ) {
    return BUILDING_GROUPS.find((g) => g.id === "danger") ?? null;
  }
  if (slug.includes("extra_floor") || slug.includes("height")) {
    return BUILDING_GROUPS.find((g) => g.id === "extra_floor") ?? null;
  }
  if (
    slug.includes("unauthorized") ||
    slug.includes("sanctioned") ||
    slug.includes("addition") ||
    slug.includes("alteration") ||
    slug.includes("deviation")
  ) {
    return BUILDING_GROUPS.find((g) => g.id === "no_permission") ?? null;
  }
  if (slug.includes("misuse") || slug.includes("use_")) {
    return BUILDING_GROUPS.find((g) => g.id === "wrong_use") ?? null;
  }
  if (slug.includes("boundary") || slug.includes("encroach")) {
    return BUILDING_GROUPS.find((g) => g.id === "blocking") ?? null;
  }
  if (
    slug.includes("building_plan") ||
    slug.includes("completion") ||
    slug.includes("occupancy")
  ) {
    return BUILDING_GROUPS.find((g) => g.id === "permit") ?? null;
  }
  return BUILDING_GROUPS.find((g) => g.id === "other") ?? null;
}

/** Official DDA page for UBBL / building bye-laws. */
export const UBBL_2016_SOURCE = {
  title: "Unified Building Bye-Laws (UBBL) 2016",
  url: "https://dda.gov.in/building-laws",
  pdfUrl: "https://dda.gov.in/sites/default/files/2022-01/UBBL_2016_Notified.pdf",
  note: "Official DDA source. We do not give legal advice.",
} as const;

/** DDA circular / OBPS note aligning residential height with stilt to 17.5 m. */
export const HEIGHT_STILT_SOURCE = {
  title: "Residential height with stilt (DDA / MCD line)",
  url: "https://dda.gov.in/sites/default/files/public-notice/building23012023.pdf",
} as const;

/**
 * Preventive, layman tips for Building.
 * Cross-checked against: DDA building-laws / UBBL 2016, DDA FAQ (non-compoundable
 * height/floors), DDA circular on 17.5 m with stilt, MCD complaint practice.
 */
export const BUILDING_CITIZEN_TIPS: CitizenTip[] = [
  {
    id: "floors_height",
    title: "How many floors are usually allowed?",
    plain:
      "For a normal house plot in Delhi, rules often allow about four floors plus a ground-level parking “stilt” (not a living floor), within a height of about 15 metres without stilt or about 17.5 metres with stilt. Your plot size, road, and the plan already approved for that building decide the exact limit — there is no one rule for every house.",
    whenToAct:
      "If you see floors or height that look far beyond the neighbours’ sanctioned look, or work continuing after people flagged risk — ask the municipal office to inspect before anyone gets hurt. Do not wait for a collapse.",
    whereLabel: "Where written: Master Plan Delhi (15m / 17.5m) + DDA circular",
    whereUrl: HEIGHT_STILT_SOURCE.url,
  },
  {
    id: "sanctioned_plan",
    title: "What does “approved plan” mean?",
    plain:
      "Before major building work, the owner is supposed to get a building plan stamped by the local body (MCD, NDMC, DDA or Cantonment — depending on the area). Building more than that plan allows — extra floor, covering the setback, changing use — is a common reason officials issue notices.",
    whenToAct:
      "Report early if work looks bigger than the usual house next door, or if workers keep going after neighbours raise a safety fear. Early inspection is safer than filing after an accident.",
    whereLabel: "Where written: DDA Building FAQs / UBBL procedures",
    whereUrl: "https://www.dda.gov.in/faqs-building",
  },
  {
    id: "complaint_vs_approval",
    title: "Complaint vs asking for a building permit",
    plain:
      "A complaint asks the office to check something that may be unsafe or without permission. A building-plan portal is where an owner applies for permission to build. They are different doors — do not use the permit website to report a danger next door.",
    whenToAct:
      "Use a complaint / 311-style channel for danger or possible illegal work. Use the approval portal only if you yourself need a plan service.",
    whereLabel: "Where written: MCD online / NDMC building approval pages",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "danger_signs",
    title: "Warning signs to report early",
    plain:
      "Fresh serious cracks, a wall or floor that looks tilted, sudden settling, heavy vibration from digging next door, or people living in a clearly abandoned/unsafe shell. These are signals to get help before something fails.",
    whenToAct:
      "If life is at risk right now — call 112 or 101. If it looks unsafe but people are not trapped — report to the municipal app/helpline the same day and keep photos with date. Leave the building if you feel it is unsafe.",
    whereLabel: "Where written: Emergency 112 + MCD complaint channels",
    whereUrl: "https://112.gov.in/",
  },
  {
    id: "who_handles",
    title: "Who looks after building problems?",
    plain:
      "Most of Delhi: Municipal Corporation of Delhi (MCD). Lutyens / central NDMC pockets: NDMC. Some DDA colonies / DDA land: DDA. Cantonment areas: Delhi Cantonment Board. Your pin code alone is not enough — area decides the office.",
    whenToAct:
      "If unsure, start with MCD 311 / 155305 for most neighbourhoods, or NDMC 1533 inside NDMC. We suggest the most likely office next — you confirm.",
    whereLabel: "Where written: MCD / NDMC official sites",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "ubbl_simple",
    title: "What is UBBL 2016 in simple words?",
    plain:
      "UBBL means Unified Building Bye-Laws — Delhi’s shared rulebook for how buildings should be planned and checked for safety. Officers and architects use it. You do not need to read the full PDF to raise a concern; ask the local body to check against the sanctioned plan and bye-laws.",
    whenToAct:
      "Open the official page only if you want the full text. For day-to-day action, pick your issue above and continue — we guide you to the right contact.",
    whereLabel: "Where written: DDA Building Bye-Laws page",
    whereUrl: UBBL_2016_SOURCE.url,
  },
];

/** @deprecated Prefer BUILDING_CITIZEN_TIPS — kept for any older imports. */
export type BuildingKnowledgeCard = {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const BUILDING_KNOWLEDGE_CARDS: BuildingKnowledgeCard[] =
  BUILDING_CITIZEN_TIPS.map((t) => ({
    id: t.id,
    title: t.title,
    body: t.plain,
    sourceLabel: t.whereLabel,
    sourceUrl: t.whereUrl,
  }));

/** Issue types treated as building-plan / approval related (not dangerous-building complaint). */
export const BUILDING_APPROVAL_ISSUE_SLUGS = new Set([
  "building_building_plan_concern",
  "building_completion_occupancy_concern",
]);

/** Issue types that should bias toward emergency override messaging. */
export const BUILDING_EMERGENCY_ISSUE_SLUGS = new Set([
  "building_collapse",
  "building_collapse_risk",
  "building_dangerous_condition",
  "building_public_safety_concern",
]);

/** Shared citizen hint for Building / Construction jurisdiction chips (not GPS proof). */
export type PropertyContext =
  | "mcd"
  | "ndmc"
  | "dda_land"
  | "cantonment"
  | "pwd_road"
  | "unknown"
  | null;

export const PROPERTY_CONTEXT_OPTIONS: {
  id: NonNullable<PropertyContext>;
  label: string;
  authoritySlug: string | null;
}[] = [
  { id: "mcd", label: "MCD area", authoritySlug: "mcd" },
  { id: "ndmc", label: "NDMC", authoritySlug: "ndmc" },
  { id: "dda_land", label: "DDA-related", authoritySlug: "dda" },
  { id: "cantonment", label: "Cantonment", authoritySlug: "delhi_cantonment" },
  { id: "unknown", label: "Not sure", authoritySlug: null },
];

export function authoritySlugForPropertyContext(
  ctx: PropertyContext
): string | null {
  if (!ctx || ctx === "unknown") return null;
  if (ctx === "pwd_road") return "pwd_delhi";
  return (
    PROPERTY_CONTEXT_OPTIONS.find((o) => o.id === ctx)?.authoritySlug ?? null
  );
}

export function isBuildingApprovalIssue(slug: string | null): boolean {
  if (!slug) return false;
  return BUILDING_APPROVAL_ISSUE_SLUGS.has(slug);
}

export function isBuildingEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return BUILDING_EMERGENCY_ISSUE_SLUGS.has(slug);
}
