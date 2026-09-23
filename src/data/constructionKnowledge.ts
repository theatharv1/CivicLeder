/**
 * Construction citizen tips — plain language, preventive.
 * Official links only when the user expands “Where is this written?”
 */

import type { CitizenTip } from "./buildingKnowledge";

export type ConstructionKnowledgeCard = {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type ConstructionGroup = {
  id: string;
  label: string;
  description: string;
  representativeSlug: string;
};

/** Step 2 — few groups instead of ~20 issue rows. */
export const CONSTRUCTION_GROUPS: ConstructionGroup[] = [
  {
    id: "danger",
    label: "Danger on the site",
    description: "Falling material, open dig, trapped risk",
    representativeSlug: "construction_dangerous_activity",
  },
  {
    id: "blocking",
    label: "Blocking road / footpath",
    description: "Material or fencing in public way",
    representativeSlug: "construction_material_blocking_footpath",
  },
  {
    id: "dust_noise",
    label: "Dust / air / noise",
    description: "Pollution from active construction",
    representativeSlug: "construction_dust",
  },
  {
    id: "workers",
    label: "Worker safety",
    description: "Unsafe work conditions for labourers",
    representativeSlug: "construction_worker_safety",
  },
  {
    id: "permission",
    label: "Work may lack permission",
    description: "Site work that may not match approval",
    representativeSlug: "construction_approval_concern",
  },
  {
    id: "other",
    label: "Something else (construction)",
    description: "Other construction-site concern",
    representativeSlug: "construction_site_safety_concern",
  },
];

export function constructionGroupForIssueSlug(
  slug: string | null
): ConstructionGroup | null {
  if (!slug) return null;
  const direct = CONSTRUCTION_GROUPS.find(
    (g) => g.representativeSlug === slug || g.id === slug
  );
  if (direct) return direct;
  if (
    slug.includes("dangerous") ||
    slug.includes("falling") ||
    slug.includes("excavation") ||
    slug.includes("fire") ||
    slug.includes("unsafe_barrier")
  ) {
    return CONSTRUCTION_GROUPS.find((g) => g.id === "danger") ?? null;
  }
  if (
    slug.includes("blocking") ||
    slug.includes("footpath") ||
    slug.includes("road") ||
    slug.includes("public_access")
  ) {
    return CONSTRUCTION_GROUPS.find((g) => g.id === "blocking") ?? null;
  }
  if (
    slug.includes("dust") ||
    slug.includes("air") ||
    slug.includes("noise") ||
    slug.includes("waste") ||
    slug.includes("c_and_d")
  ) {
    return CONSTRUCTION_GROUPS.find((g) => g.id === "dust_noise") ?? null;
  }
  if (slug.includes("worker") || slug.includes("labour")) {
    return CONSTRUCTION_GROUPS.find((g) => g.id === "workers") ?? null;
  }
  if (
    slug.includes("approval") ||
    slug.includes("plan") ||
    slug.includes("deviation")
  ) {
    return CONSTRUCTION_GROUPS.find((g) => g.id === "permission") ?? null;
  }
  return CONSTRUCTION_GROUPS.find((g) => g.id === "other") ?? null;
}

export const CONSTRUCTION_CITIZEN_TIPS: CitizenTip[] = [
  {
    id: "what_is_site",
    title: "What counts as a construction-site problem?",
    plain:
      "Active building work: digging, scaffolding, dust clouds, night noise, material falling toward the road, blocked footpath, or workers in unsafe conditions. This is about the work site — not only the finished building.",
    whenToAct:
      "Report while work is ongoing if neighbours or passers-by are at risk. Waiting until after an injury is too late — the point is to act early.",
    whereLabel: "Where written: MCD / Green Delhi / Labour channels",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "dust_noise",
    title: "Dust and loud construction noise",
    plain:
      "Sites are expected to control dust (screens, water spray) and follow noise timing rules. Heavy dust or late-night drilling that makes people choke or lose sleep can be raised with Green Delhi / environment channels — separate from a structural complaint.",
    whenToAct:
      "If dust or noise is constant and harming health, use the pollution channel. If scaffolding looks ready to fall — treat it as danger (112 / 101) first.",
    whereLabel: "Where written: Green Delhi portal",
    whereUrl: "https://greendelhi.nic.in/",
  },
  {
    id: "falling_digging",
    title: "Falling material or open digging",
    plain:
      "Bricks tipping over the footpath, open pits without barriers, or weak plywood covers over holes are everyday risks. Children and elders are often the first hurt.",
    whenToAct:
      "If someone may fall in or be hit — call 112. If the site is careless but not an emergency — ask the municipal / PWD office (for road work) to inspect the same day.",
    whereLabel: "Where written: Emergency 112",
    whereUrl: "https://112.gov.in/",
  },
  {
    id: "workers",
    title: "Worker safety (simple)",
    plain:
      "Workers without helmets at height, no safe ladder, or children on site are labour-safety concerns. You can flag this without being a lawyer — the Labour helpline exists for that.",
    whenToAct:
      "If a worker is trapped or injured — 112 first. For ongoing unsafe practices — Labour Shramik Helpline 155214.",
    whereLabel: "Where written: Labour Department Delhi",
    whereUrl: "https://labour.delhi.gov.in/",
  },
  {
    id: "who_handles",
    title: "Who handles construction complaints?",
    plain:
      "Municipal body for most neighbourhood sites; PWD if it is a public road job; Green Delhi / DPCC for dust–air–noise; Labour for worker safety; Fire Service if there is fire risk. One site can need more than one office — we still start with the most likely one.",
    whenToAct:
      "Pick what you saw (dust, dig, danger, workers). Next screens point to one main contact; more offices stay optional.",
    whereLabel: "Where written: MCD / Green Delhi / Labour sites",
    whereUrl: "https://mcdonline.nic.in/",
  },
];

export const CONSTRUCTION_KNOWLEDGE_CARDS: ConstructionKnowledgeCard[] =
  CONSTRUCTION_CITIZEN_TIPS.map((t) => ({
    id: t.id,
    title: t.title,
    body: t.plain,
    sourceLabel: t.whereLabel,
    sourceUrl: t.whereUrl,
  }));

export const CONSTRUCTION_EMERGENCY_ISSUE_SLUGS = new Set([
  "construction_dangerous_activity",
  "construction_falling_material_risk",
  "construction_open_excavation",
  "construction_excavation_hazard",
  "construction_fire_risk",
]);

export const CONSTRUCTION_FIRE_ISSUE_SLUGS = new Set([
  "construction_fire_risk",
]);

export const CONSTRUCTION_LABOUR_ISSUE_SLUGS = new Set([
  "construction_worker_safety",
]);

export const CONSTRUCTION_APPROVAL_ISSUE_SLUGS = new Set([
  "construction_approval_concern",
  "construction_plan_deviation_concern",
]);

/** Site / road context chips — citizen hint only, not GIS proof. */
export type ConstructionSiteContext =
  | "mcd"
  | "ndmc"
  | "dda_land"
  | "pwd_road"
  | "unknown"
  | null;

export const CONSTRUCTION_CONTEXT_OPTIONS: {
  id: NonNullable<ConstructionSiteContext>;
  label: string;
  authoritySlug: string | null;
}[] = [
  { id: "mcd", label: "MCD area", authoritySlug: "mcd" },
  { id: "ndmc", label: "NDMC", authoritySlug: "ndmc" },
  { id: "dda_land", label: "DDA-related", authoritySlug: "dda" },
  { id: "pwd_road", label: "PWD road / work", authoritySlug: "pwd_delhi" },
  { id: "unknown", label: "Not sure", authoritySlug: null },
];

export function authoritySlugForConstructionContext(
  ctx: ConstructionSiteContext
): string | null {
  if (!ctx || ctx === "unknown") return null;
  return (
    CONSTRUCTION_CONTEXT_OPTIONS.find((o) => o.id === ctx)?.authoritySlug ??
    null
  );
}

export function isConstructionEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return CONSTRUCTION_EMERGENCY_ISSUE_SLUGS.has(slug);
}

export function isConstructionFireIssue(slug: string | null): boolean {
  if (!slug) return false;
  return CONSTRUCTION_FIRE_ISSUE_SLUGS.has(slug);
}

export function isConstructionLabourIssue(slug: string | null): boolean {
  if (!slug) return false;
  return CONSTRUCTION_LABOUR_ISSUE_SLUGS.has(slug);
}

export function isConstructionApprovalIssue(slug: string | null): boolean {
  if (!slug) return false;
  return CONSTRUCTION_APPROVAL_ISSUE_SLUGS.has(slug);
}
