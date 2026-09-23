/**
 * Roads & Public Spaces knowledge + jurisdiction / asset hint chips.
 * Official concepts only — not legal advice. GPS never proves authority.
 * Never all roads → PWD or MCD. Traffic Police is not for every pothole.
 */

export type RoadsJurisdictionHint =
  | "mcd"
  | "pwd"
  | "ndmc"
  | "dda"
  | "traffic_police"
  | "unknown"
  | null;

export type RoadsAssetHint =
  | "road"
  | "footpath"
  | "park"
  | "bridge"
  | "other"
  | null;

export type RoadsPublicSpacesKnowledgeCard = {
  id: string;
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type RoadsPublicSpacesGroup = {
  id: string;
  label: string;
  description: string;
  /** Representative DB issue_types.slug for routing / purpose */
  representativeSlug: string;
};

export const ROADS_PUBLIC_SPACES_RIGHTS_SOURCE = {
  title: "Official roads / public-space channels (Delhi)",
  url: "https://mcdonline.nic.in/portal/feedback",
  pwdSewa: "https://www.pwddelhi.gov.in/sewa",
  ndmcComplaints: "https://www.ndmc.gov.in/complaints.aspx",
  ndmcCivil: "https://www.ndmc.gov.in/departments/civil_i.aspx",
  trafficContact: "https://traffic.delhipolice.gov.in/en/contact-us",
  ddaGrievance: "https://dda.gov.in/grievance",
  note: "Authority depends on road/park ownership and issue type. Never all roads → PWD or MCD. Traffic Police is not for every pothole. This app does not file for you.",
} as const;

/** Step 2 groups — keep descriptions extremely simple. */
export const ROADS_PUBLIC_SPACES_GROUPS: RoadsPublicSpacesGroup[] = [
  {
    id: "open_hole",
    label: "Open manhole / uncovered pit",
    description: "Hole in road or footpath — report early",
    representativeSlug: "open_manhole_in_traffic",
  },
  {
    id: "road_damage",
    label: "Pothole / broken road",
    description: "Deep hole or broken surface",
    representativeSlug: "pothole",
  },
  {
    id: "streetlights",
    label: "Streetlight out",
    description: "Dark road — often DISCOM or municipal",
    representativeSlug: "roads_streetlight_outage",
  },
  {
    id: "footpath",
    label: "Footpath problem",
    description: "Damaged, missing or blocked footpath",
    representativeSlug: "footpath_damage",
  },
  {
    id: "signs_signals",
    label: "Signal / sign problem",
    description: "Broken signal or missing sign",
    representativeSlug: "traffic_signal_not_working",
  },
  {
    id: "other",
    label: "Something else (roads)",
    description: "Other road or public-space concern",
    representativeSlug: "roads_other",
  },
];

export const ROADS_PUBLIC_SPACES_KNOWLEDGE_CARDS: RoadsPublicSpacesKnowledgeCard[] =
  [
    {
      id: "authority",
      title: "A pothole is not always MCD",
      body: "Road ownership varies: MCD, PWD, NDMC, DDA or Cantonment may apply. GPS alone does not prove who maintains the road. Confirmation is usually required.",
      sourceLabel: "MCD / PWD / NDMC",
      sourceUrl: ROADS_PUBLIC_SPACES_RIGHTS_SOURCE.url,
    },
    {
      id: "traffic_vs_maintenance",
      title: "Traffic Police ≠ road repair",
      body: "Traffic Police (1095) handles traffic management, signals and obstruction context — not every pothole or footpath repair. Civic owners handle maintenance.",
      sourceLabel: "Delhi Traffic Police",
      sourceUrl: ROADS_PUBLIC_SPACES_RIGHTS_SOURCE.trafficContact,
    },
    {
      id: "waterlogging",
      title: "Water on the road is often drainage",
      body: "Road waterlogging often involves municipal drainage or I&FC channels — not automatic PWD. Prefer Water & Drainage routing when flooding/drainage is the main issue.",
      sourceLabel: "I&FC / municipal",
      sourceUrl: "https://ifc.delhi.gov.in/ifc/organizational-setup",
    },
    {
      id: "streetlight",
      title: "Streetlights often follow electricity",
      body: "Many streetlights are handled by DISCOM streetlight channels (Electricity category). Some are civic/PWD assets. Confirm the asset owner — do not invent a universal streetlight number.",
      sourceLabel: "DISCOM / PWD / civic",
      sourceUrl: ROADS_PUBLIC_SPACES_RIGHTS_SOURCE.pwdSewa,
    },
  ];

export const ROADS_JURISDICTION_OPTIONS: {
  id: NonNullable<RoadsJurisdictionHint>;
  label: string;
  authoritySlug: string | null;
}[] = [
  { id: "mcd", label: "MCD", authoritySlug: "mcd" },
  { id: "pwd", label: "PWD", authoritySlug: "pwd_delhi" },
  { id: "ndmc", label: "NDMC", authoritySlug: "ndmc" },
  { id: "dda", label: "DDA", authoritySlug: "dda" },
  {
    id: "traffic_police",
    label: "Traffic Police",
    authoritySlug: "delhi_traffic_police",
  },
  { id: "unknown", label: "Not sure", authoritySlug: null },
];

export const ROADS_ASSET_OPTIONS: {
  id: NonNullable<RoadsAssetHint>;
  label: string;
}[] = [
  { id: "road", label: "Road" },
  { id: "footpath", label: "Footpath" },
  { id: "park", label: "Park" },
  { id: "bridge", label: "Bridge" },
  { id: "other", label: "Other" },
];

export function authoritySlugForRoadsJurisdiction(
  hint: RoadsJurisdictionHint
): string | null {
  if (!hint || hint === "unknown") return null;
  return (
    ROADS_JURISDICTION_OPTIONS.find((o) => o.id === hint)?.authoritySlug ?? null
  );
}

export function roadsGroupForIssueSlug(
  slug: string | null
): RoadsPublicSpacesGroup | null {
  if (!slug) return null;
  const direct = ROADS_PUBLIC_SPACES_GROUPS.find(
    (g) => g.representativeSlug === slug || g.id === slug
  );
  if (direct) return direct;

  if (
    slug.includes("manhole") ||
    slug.includes("open_pit") ||
    slug.includes("uncovered")
  ) {
    return ROADS_PUBLIC_SPACES_GROUPS.find((g) => g.id === "open_hole") ?? null;
  }
  if (
    slug === "pothole" ||
    slug === "road_damage" ||
    slug === "road_crack" ||
    slug === "road_collapse" ||
    slug === "road_uneven_surface" ||
    slug === "road_shoulder_damage"
  ) {
    return ROADS_PUBLIC_SPACES_GROUPS.find((g) => g.id === "road_damage") ?? null;
  }
  if (slug.startsWith("footpath_")) {
    return ROADS_PUBLIC_SPACES_GROUPS.find((g) => g.id === "footpath") ?? null;
  }
  if (
    slug.startsWith("road_sign") ||
    slug.startsWith("traffic_signal") ||
    slug === "road_marking_faded"
  ) {
    return (
      ROADS_PUBLIC_SPACES_GROUPS.find((g) => g.id === "signs_signals") ?? null
    );
  }
  if (slug.includes("streetlight")) {
    return (
      ROADS_PUBLIC_SPACES_GROUPS.find((g) => g.id === "streetlights") ?? null
    );
  }
  return ROADS_PUBLIC_SPACES_GROUPS.find((g) => g.id === "other") ?? null;
}

export const ROADS_EMERGENCY_ISSUE_SLUGS = new Set([
  "road_collapse",
  "open_manhole_in_traffic",
  "bridge_structural_danger",
  "traffic_signal_dangerous_failure",
  "live_wire_on_road",
  "road_flood_hazard",
]);

export const ROADS_POTHOLE_ISSUE_SLUGS = new Set([
  "pothole",
  "road_damage",
  "road_crack",
  "road_uneven_surface",
  "road_shoulder_damage",
]);

export const ROADS_FOOTPATH_ISSUE_SLUGS = new Set([
  "footpath_damage",
  "footpath_missing",
  "footpath_encroachment",
  "footpath_accessibility_barrier",
]);

export const ROADS_SIGNAL_ISSUE_SLUGS = new Set([
  "traffic_signal_not_working",
  "traffic_signal_dangerous_failure",
  "traffic_signal_timing_concern",
  "road_sign_missing",
  "road_sign_damaged",
  "road_marking_faded",
]);

export const ROADS_TRAFFIC_ISSUE_SLUGS = new Set([
  "illegal_parking",
  "traffic_obstruction",
  "unauthorized_encroachment_road",
  "vendor_encroachment_road",
]);

export const ROADS_PARK_ISSUE_SLUGS = new Set([
  "park_maintenance_concern",
  "park_damage",
  "public_space_unclean",
  "playground_equipment_concern",
  "street_furniture_damaged",
  "bench_damaged",
  "bus_shelter_damage",
]);

export const ROADS_BRIDGE_ISSUE_SLUGS = new Set([
  "bridge_damage",
  "bridge_structural_danger",
  "underpass_damage",
  "fob_damage",
  "subway_damage",
]);

export const ROADS_WORK_ISSUE_SLUGS = new Set([
  "road_cut_not_restored",
  "ongoing_road_work_hazard",
  "incomplete_road_repair",
]);

export function isRoadsEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return ROADS_EMERGENCY_ISSUE_SLUGS.has(slug);
}

/** Map issue slug → preferred channel purpose for Step 7 filtering. */
export function roadsChannelPurpose(issueSlug: string | null): string {
  if (!issueSlug) return "grievance";
  if (isRoadsEmergencyIssue(issueSlug)) {
    if (issueSlug === "traffic_signal_dangerous_failure") return "traffic_signal";
    if (issueSlug === "open_manhole_in_traffic") return "emergency";
    if (issueSlug === "road_flood_hazard") return "waterlogging";
    if (issueSlug === "live_wire_on_road") return "emergency";
    return "emergency";
  }
  if (issueSlug === "pothole") return "pothole";
  if (ROADS_POTHOLE_ISSUE_SLUGS.has(issueSlug) || issueSlug === "road_collapse") {
    return "road_damage";
  }
  if (ROADS_FOOTPATH_ISSUE_SLUGS.has(issueSlug)) return "footpath";
  if (
    issueSlug === "traffic_signal_not_working" ||
    issueSlug === "traffic_signal_timing_concern" ||
    issueSlug === "traffic_signal_dangerous_failure"
  ) {
    return "traffic_signal";
  }
  if (issueSlug.startsWith("road_sign") || issueSlug === "road_marking_faded") {
    return "road_signage";
  }
  if (issueSlug === "illegal_parking" || issueSlug === "traffic_obstruction") {
    return "traffic_obstruction";
  }
  if (issueSlug.includes("encroachment")) return "encroachment";
  if (issueSlug.includes("streetlight")) return "streetlight";
  if (issueSlug.startsWith("park_") || issueSlug.startsWith("playground_")) {
    return "park";
  }
  if (issueSlug.startsWith("public_space")) return "public_space";
  if (
    issueSlug.startsWith("street_furniture") ||
    issueSlug === "bench_damaged"
  ) {
    return "street_furniture";
  }
  if (issueSlug === "bus_shelter_damage") return "bus_shelter";
  if (issueSlug.startsWith("bridge_") || issueSlug === "bridge_structural_danger") {
    return "bridge";
  }
  if (issueSlug.startsWith("underpass_")) return "underpass";
  if (issueSlug.startsWith("fob_") || issueSlug.startsWith("subway_")) {
    return "bridge";
  }
  if (issueSlug === "road_cut_not_restored") return "road_cut";
  if (ROADS_WORK_ISSUE_SLUGS.has(issueSlug)) return "road_damage";
  if (issueSlug === "road_waterlogging") return "waterlogging";
  if (issueSlug.startsWith("accessibility_")) return "public_space";
  return "grievance";
}

export const ROADS_HIDDEN_KNOWLEDGE = [
  {
    id: "authority",
    title: "YOU MAY NOT KNOW THIS",
    body: "A pothole is not always MCD. Road ownership may be MCD, PWD, NDMC, DDA or Cantonment. Confirmation is usually required.",
    actionHint: "Use the jurisdiction chips and purpose-specific BEST action.",
  },
  {
    id: "traffic",
    title: "USEFUL TO KNOW",
    body: "Traffic Police (1095) is for traffic management, signals and obstruction — not every pothole. Road waterlogging often belongs with drainage / I&FC channels, not automatic PWD.",
    actionHint: "Pick Traffic Police only when the issue is traffic/signal related.",
  },
  {
    id: "reference",
    title: "YOU MAY NOT KNOW THIS",
    body: "MD-###### is only your CivicLeder ID. Save the official reference the authority gives you. Status is “recorded by you” unless an official API exists.",
    actionHint: "Track via MCD311 issuedetail or PWD Sewa status when you have an official number.",
  },
] as const;
