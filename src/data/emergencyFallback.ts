export type EmergencyContact = {
  number: string;
  label: string;
  description: string | null;
  sort_order: number;
  source_name: string | null;
  source_url: string | null;
};

export type AssessmentQuestion = {
  question_key: string;
  question_text: string;
  sort_order: number;
  explanation: string | null;
};

export type IssueTypeRow = {
  slug: string;
  name: string;
  short_description: string | null;
  sort_order: number;
};

/** Local fallback if Supabase tables are not applied yet (same verified Delhi numbers). */
export const FALLBACK_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    number: "112",
    label: "All Emergencies",
    description: "National emergency response support system",
    sort_order: 1,
    source_name: "112 India",
    source_url: "https://112.gov.in/",
  },
  {
    number: "101",
    label: "Fire",
    description: "Delhi Fire Service / Fire Control Room",
    sort_order: 2,
    source_name: "Delhi Fire Service",
    source_url: "https://dfs.delhi.gov.in/",
  },
  {
    number: "102",
    label: "Ambulance",
    description: "Ambulance emergency service",
    sort_order: 3,
    source_name: "District Magistrate New Delhi — Helpline",
    source_url: "https://dmnewdelhi.delhi.gov.in/helpline/",
  },
];

export const FALLBACK_FIRE_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "anyone_trapped",
    question_text: "Is anyone trapped or unable to get out safely?",
    sort_order: 1,
    explanation: null,
  },
  {
    question_key: "active_fire_smoke_gas",
    question_text: "Is there active fire, smoke, or a gas leak?",
    sort_order: 2,
    explanation: null,
  },
  {
    question_key: "immediate_danger_people",
    question_text: "Is there an immediate danger to people?",
    sort_order: 3,
    explanation: null,
  },
  {
    question_key: "serious_injury_now",
    question_text: "Could the situation cause serious injury right now?",
    sort_order: 4,
    explanation: null,
  },
  {
    question_key: "collapse_or_structural",
    question_text:
      "Is there a risk of building collapse or major structural failure?",
    sort_order: 5,
    explanation: null,
  },
];

export const FALLBACK_BUILDING_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "anyone_trapped",
    question_text: "Is anyone trapped or unable to get out safely?",
    sort_order: 1,
    explanation:
      "People unable to exit safely may need immediate emergency response (112 / 101).",
  },
  {
    question_key: "immediate_danger_people",
    question_text: "Is there an immediate danger to people?",
    sort_order: 2,
    explanation:
      "Immediate danger to people requires emergency services before any civic complaint.",
  },
  {
    question_key: "collapse_or_structural",
    question_text:
      "Is there a risk of building collapse or major structural failure?",
    sort_order: 3,
    explanation:
      "Collapse risk requires calling emergency services first — do not enter an unsafe building.",
  },
  {
    question_key: "serious_injury_now",
    question_text: "Could the situation cause serious injury right now?",
    sort_order: 4,
    explanation: "Risk of serious injury right now is an emergency signal.",
  },
];

/** Offline Building issue types (citizen-friendly names). */
export const FALLBACK_BUILDING_ISSUE_TYPES: IssueTypeRow[] = [
  {
    slug: "building_structural_damage",
    name: "Building looks damaged",
    short_description: "Walls, beams or floors look broken or weak",
    sort_order: 1,
  },
  {
    slug: "building_serious_cracks",
    name: "Big cracks on walls / floors",
    short_description: "Deep or growing cracks you can see clearly",
    sort_order: 2,
  },
  {
    slug: "building_dangerous_condition",
    name: "Building looks unsafe",
    short_description: "Feels risky to stand near or live in",
    sort_order: 3,
  },
  {
    slug: "building_dilapidated_structure",
    name: "Old / neglected building",
    short_description: "Long-abandoned or poorly kept structure",
    sort_order: 4,
  },
  {
    slug: "building_collapse",
    name: "Building falling / collapsed",
    short_description: "Call 112 / 101 first if people may be hurt",
    sort_order: 5,
  },
  {
    slug: "building_collapse_risk",
    name: "May fall soon (tilting / shaking)",
    short_description: "Looks ready to fail — report early, before it falls",
    sort_order: 6,
  },
  {
    slug: "building_unauthorized_construction_concern",
    name: "Building without clear permission",
    short_description: "Work that may not have municipal approval",
    sort_order: 7,
  },
  {
    slug: "building_deviation_from_sanctioned_plan",
    name: "Built differently from allowed plan",
    short_description: "Looks bigger or different than what was approved",
    sort_order: 8,
  },
  {
    slug: "building_unauthorized_addition",
    name: "Extra room / floor added",
    short_description: "New part stuck onto an older building",
    sort_order: 9,
  },
  {
    slug: "building_unauthorized_alteration",
    name: "Major change inside / outside",
    short_description: "Walls cut, floors changed without clear approval",
    sort_order: 10,
  },
  {
    slug: "building_extra_floor_concern",
    name: "Extra floor / too tall",
    short_description:
      "More floors or height than neighbours’ usual limit — ask for inspection early",
    sort_order: 11,
  },
  {
    slug: "building_building_plan_concern",
    name: "I need a building permit (owner)",
    short_description: "You want plan approval — not a danger complaint",
    sort_order: 12,
  },
  {
    slug: "building_completion_occupancy_concern",
    name: "Completion / occupancy papers",
    short_description: "Certificate or paperwork for finished building",
    sort_order: 13,
  },
  {
    slug: "building_use_misuse_concern",
    name: "Wrong use of the building",
    short_description: "e.g. house used as factory / PG beyond permission",
    sort_order: 14,
  },
  {
    slug: "building_boundary_structure_concern",
    name: "Blocking road / public space",
    short_description: "Wall or structure pushing into footpath or road",
    sort_order: 15,
  },
  {
    slug: "building_abandoned_structure",
    name: "Empty / abandoned building",
    short_description: "Vacant shell that may be unsafe",
    sort_order: 16,
  },
  {
    slug: "building_heritage_damage",
    name: "Heritage / old protected building",
    short_description: "Damage or risk to a known heritage structure",
    sort_order: 17,
  },
  {
    slug: "building_public_safety_concern",
    name: "Danger for people nearby",
    short_description: "Loose pieces, open edges, risk to passers-by",
    sort_order: 18,
  },
  {
    slug: "building_other",
    name: "Something else (building)",
    short_description: "Other building concern",
    sort_order: 19,
  },
];

export const FALLBACK_CONSTRUCTION_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "anyone_trapped",
    question_text:
      "Is anyone trapped in an excavation, under material, or unable to get out safely?",
    sort_order: 1,
    explanation:
      "People trapped or unable to exit safely need emergency response (112 / 101).",
  },
  {
    question_key: "immediate_danger_people",
    question_text: "Is there an immediate danger to workers or the public?",
    sort_order: 2,
    explanation:
      "Immediate danger requires emergency services first. Do not enter an active construction site.",
  },
  {
    question_key: "excavation_collapse_risk",
    question_text:
      "Is there a risk of excavation collapse or falling material right now?",
    sort_order: 3,
    explanation:
      "Collapse / falling-material risk: call 112 / 101. Stay clear of the site.",
  },
  {
    question_key: "fire_or_smoke_now",
    question_text:
      "Is there fire, smoke, or an immediate fire risk on the site right now?",
    sort_order: 4,
    explanation: "Fire or immediate fire risk: call 101 / 112. Do not enter the site.",
  },
  {
    question_key: "serious_injury_now",
    question_text: "Could the situation cause serious injury right now?",
    sort_order: 5,
    explanation: "Risk of serious injury right now is an emergency signal.",
  },
];

/** Offline Construction issue types (citizen-friendly names). */
export const FALLBACK_CONSTRUCTION_ISSUE_TYPES: IssueTypeRow[] = [
  {
    slug: "construction_site_safety_concern",
    name: "Possible site safety concern",
    short_description:
      "Reported concern about overall safety at a construction site — not a legal finding",
    sort_order: 1,
  },
  {
    slug: "construction_dangerous_activity",
    name: "Possible dangerous activity on site",
    short_description:
      "Reported concern about activity that may put people at risk",
    sort_order: 2,
  },
  {
    slug: "construction_falling_material_risk",
    name: "Possible falling-material risk",
    short_description:
      "Reported concern that material may fall from a site onto a public area",
    sort_order: 3,
  },
  {
    slug: "construction_unsafe_barrier",
    name: "Possible unsafe barrier or fencing",
    short_description:
      "Reported concern about site fencing / barriers that may not protect the public",
    sort_order: 4,
  },
  {
    slug: "construction_open_excavation",
    name: "Possible open excavation hazard",
    short_description:
      "Reported concern about an open excavation that may pose collapse or fall risk",
    sort_order: 5,
  },
  {
    slug: "construction_excavation_hazard",
    name: "Possible excavation collapse risk",
    short_description:
      "Reported concern about excavation walls or trench safety",
    sort_order: 6,
  },
  {
    slug: "construction_material_blocking_road",
    name: "Construction material may be blocking a road",
    short_description:
      "Reported concern that construction material may obstruct a roadway",
    sort_order: 7,
  },
  {
    slug: "construction_material_blocking_footpath",
    name: "Construction material may be blocking a footpath",
    short_description:
      "Reported concern that construction material may obstruct a footpath",
    sort_order: 8,
  },
  {
    slug: "construction_public_access_blocked",
    name: "Possible blocked public access",
    short_description:
      "Reported concern that public access near a site may be blocked",
    sort_order: 9,
  },
  {
    slug: "construction_dust",
    name: "Possible construction dust concern",
    short_description:
      "Reported concern about dust from a construction site",
    sort_order: 10,
  },
  {
    slug: "construction_air_pollution",
    name: "Possible construction air-pollution concern",
    short_description:
      "Reported concern about air pollution linked to construction activity",
    sort_order: 11,
  },
  {
    slug: "construction_c_and_d_waste",
    name: "Possible C&D / construction waste concern",
    short_description:
      "Reported concern about construction and demolition (C&D) waste handling",
    sort_order: 12,
  },
  {
    slug: "construction_debris_dumping",
    name: "Possible debris / malba dumping",
    short_description:
      "Reported concern about debris or malba dumping near a construction site",
    sort_order: 13,
  },
  {
    slug: "construction_noise",
    name: "Possible construction noise concern",
    short_description: "Reported concern about noise from construction activity",
    sort_order: 14,
  },
  {
    slug: "construction_fire_risk",
    name: "Possible fire risk at a construction site",
    short_description:
      "Reported fire-risk concern at a construction site — call 101 / 112 if fire or immediate danger",
    sort_order: 15,
  },
  {
    slug: "construction_water_drainage_impact",
    name: "Possible water / drainage impact from construction",
    short_description:
      "Reported concern that construction may affect water or drainage",
    sort_order: 16,
  },
  {
    slug: "construction_worker_safety",
    name: "Possible worker safety concern",
    short_description:
      "Reported concern about worker safety on a construction site",
    sort_order: 17,
  },
  {
    slug: "construction_approval_concern",
    name: "Possible construction approval / permit concern",
    short_description:
      "Reported concern about whether construction has required approvals — not a legal finding",
    sort_order: 18,
  },
  {
    slug: "construction_plan_deviation_concern",
    name: "Possible deviation from sanctioned plan",
    short_description:
      "Reported concern that work may differ from an approved plan — not a legal finding",
    sort_order: 19,
  },
  {
    slug: "construction_other",
    name: "Something else (construction)",
    short_description:
      "Other reported construction-site concern — jurisdiction still needs confirmation",
    sort_order: 20,
  },
];

export const EMERGENCY_EXAMPLES = [
  "fire",
  "building collapse risk",
  "construction excavation / falling material risk",
  "gas leak",
  "serious accident",
  "exposed high-voltage wires",
  "major water flooding",
  "immediate danger to people",
] as const;
