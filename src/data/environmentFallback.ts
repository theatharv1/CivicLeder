/**
 * Offline Environment fallback — verified contacts only (mirrors DB seeds).
 * Noise → NGMS + 155271 (not DPCC homepage). Trees → Forest. Air → Green Delhi App.
 */

import type { AuthorityChannel, RoutedAuthority } from "./routingFallback";
import type { IssueTypeRow, AssessmentQuestion } from "./emergencyFallback";
import type { FallbackAuthorityService } from "./dfsEmergencyFieldsFallback";
import {
  ENVIRONMENT_GROUPS,
  ENVIRONMENT_RIGHTS_SOURCE,
} from "./environmentKnowledge";

const NGMS = ENVIRONMENT_RIGHTS_SOURCE.ngms;
const NGMS_TRACK = ENVIRONMENT_RIGHTS_SOURCE.ngmsTrack;
const FOREST_GRIEVANCE = ENVIRONMENT_RIGHTS_SOURCE.forestGrievance;
const FOREST_STATUS = ENVIRONMENT_RIGHTS_SOURCE.forestStatus;
const GREEN_DELHI = ENVIRONMENT_RIGHTS_SOURCE.greenDelhi;
const GREEN_PLAY = ENVIRONMENT_RIGHTS_SOURCE.greenDelhiPlay;
const GREEN_IOS = ENVIRONMENT_RIGHTS_SOURCE.greenDelhiIos;
const CM_JAN = ENVIRONMENT_RIGHTS_SOURCE.cmJanSunwai;
const ENV_DEPT = ENVIRONMENT_RIGHTS_SOURCE.environmentDept;
const DPCC = ENVIRONMENT_RIGHTS_SOURCE.dpcc;

/** Offline Step 2 list uses groups as selectable “issue types”. */
export const FALLBACK_ENVIRONMENT_ISSUE_TYPES: IssueTypeRow[] =
  ENVIRONMENT_GROUPS.map((g, i) => ({
    slug: g.representativeSlug,
    name: g.label,
    short_description: g.description,
    sort_order: i + 1,
  }));

export const FALLBACK_ENVIRONMENT_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "chemical_or_toxic_release",
    question_text:
      "Is there a chemical spill, toxic release, or strong chemical smell with people at immediate risk right now?",
    sort_order: 1,
    explanation:
      "Call 112 / 101 first. Stay upwind and clear of the area. Environment complaint portals are secondary after emergency response.",
  },
  {
    question_key: "env_fire_or_smoke_danger",
    question_text:
      "Is there an active fire, spreading flames, or heavy toxic smoke from an environmental source right now?",
    sort_order: 2,
    explanation: "Call 112 / 101 first. Do not approach the fire or smoke.",
  },
  {
    question_key: "falling_tree_or_wildlife_danger",
    question_text:
      "Is a tree falling / about to fall onto people or traffic, or is wildlife posing immediate danger to people?",
    sort_order: 3,
    explanation:
      "Call 112 if people are at risk. Then Forest Green Helpline for tree/wildlife follow-up where applicable.",
  },
  {
    question_key: "immediate_env_danger",
    question_text:
      "Is there any other immediate danger to people from this environmental situation?",
    sort_order: 4,
    explanation:
      "Immediate danger requires emergency services before any normal environment complaint.",
  },
];

function ch(
  partial: AuthorityChannel & { purpose?: string }
): AuthorityChannel & { purpose?: string } {
  return partial;
}

export const FALLBACK_ENVIRONMENT_ROUTING: RoutedAuthority[] = [
  {
    slug: "ngms_noise",
    name: "NGMS — Noise Pollution Grievance",
    short_description:
      "Primary channel for noise pollution complaints in Delhi. Portal + 155271. Not DPCC homepage.",
    official_website: NGMS,
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Noise only — needs confirmation. Do not substitute DPCC homepage.",
    channels: [
      ch({
        channel_type: "portal",
        label: "NGMS noise complaint",
        value: NGMS,
        action_url: NGMS,
        tracking_url: NGMS_TRACK,
        purpose: "noise_pollution",
      }),
      ch({
        channel_type: "phone",
        label: "Noise pollution helpline 155271",
        value: "155271",
        phone: "155271",
        purpose: "noise_pollution",
      }),
      ch({
        channel_type: "portal",
        label: "NGMS complaint status",
        value: NGMS_TRACK,
        action_url: NGMS_TRACK,
        tracking_url: NGMS_TRACK,
        purpose: "tracking",
      }),
      ch({
        channel_type: "phone",
        label: "Noise helpline (after emergency)",
        value: "155271",
        phone: "155271",
        purpose: "emergency",
      }),
    ],
  },
  {
    slug: "dpcc",
    name: "Delhi Pollution Control Committee (DPCC)",
    short_description:
      "Candidate for air / industrial pollution / some water-pollution env cases. NOT first for ordinary noise. Not all environment → DPCC.",
    official_website: DPCC,
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Needs confirmation. Never all environment → DPCC. Noise → NGMS.",
    channels: [
      ch({
        channel_type: "portal",
        label: "Green Delhi (air / pollution)",
        value: GREEN_DELHI,
        action_url: GREEN_DELHI,
        purpose: "air_pollution",
      }),
      ch({
        channel_type: "portal",
        label: "Green Delhi (water pollution env)",
        value: GREEN_DELHI,
        action_url: GREEN_DELHI,
        purpose: "water_pollution",
      }),
      ch({
        channel_type: "portal",
        label: "Green Delhi (soil / land)",
        value: GREEN_DELHI,
        action_url: GREEN_DELHI,
        purpose: "soil_pollution",
      }),
      ch({
        channel_type: "portal",
        label: "Green Delhi (burning — after 112/101 if fire)",
        value: GREEN_DELHI,
        action_url: GREEN_DELHI,
        purpose: "burning",
      }),
      ch({
        channel_type: "whatsapp",
        label: "DPCC leave/garbage burning WhatsApp",
        value: "9717593574",
        whatsapp: "9717593574",
        purpose: "burning",
      }),
      ch({
        channel_type: "app",
        label: "Green Delhi App",
        value: "Green Delhi App",
        action_url: GREEN_PLAY,
        purpose: "app",
      }),
      ch({
        channel_type: "website",
        label: "DPCC official website",
        value: DPCC,
        action_url: DPCC,
        purpose: "web_portal",
      }),
      ch({
        channel_type: "portal",
        label: "Green Delhi (after emergency)",
        value: GREEN_DELHI,
        action_url: GREEN_DELHI,
        purpose: "emergency",
      }),
      ch({
        channel_type: "portal",
        label: "Green Delhi (general env grievance)",
        value: GREEN_DELHI,
        action_url: GREEN_DELHI,
        purpose: "grievance",
      }),
    ],
  },
  {
    slug: "environment_dept_delhi",
    name: "Department of Environment (GNCTD)",
    short_description:
      "Environment Department reference / policy information. Prefer specialized action channels (NGMS, Green Delhi, Forest) for filing.",
    official_website: ENV_DEPT,
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Reference / escalation context — not first for noise or trees.",
    channels: [
      ch({
        channel_type: "website",
        label: "Environment Department website",
        value: ENV_DEPT,
        action_url: ENV_DEPT,
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "delhi_forest",
    name: "Forest & Wildlife Department (Delhi)",
    short_description:
      "Trees, forest offences, wildlife. Not every municipal park → Forest.",
    official_website: ENVIRONMENT_RIGHTS_SOURCE.forestDept,
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Needs confirmation. Park asset may be municipal.",
    channels: [
      ch({
        channel_type: "portal",
        label: "e-Forest grievance (trees / wildlife)",
        value: FOREST_GRIEVANCE,
        action_url: FOREST_GRIEVANCE,
        tracking_url: FOREST_STATUS,
        purpose: "trees_forest",
      }),
      ch({
        channel_type: "portal",
        label: "e-Forest grievance (wildlife)",
        value: FOREST_GRIEVANCE,
        action_url: FOREST_GRIEVANCE,
        tracking_url: FOREST_STATUS,
        purpose: "wildlife",
      }),
      ch({
        channel_type: "phone",
        label: "Forest Green Helpline",
        value: "1800118600",
        phone: "1800118600",
        purpose: "trees_forest",
      }),
      ch({
        channel_type: "phone",
        label: "Forest Green Helpline (wildlife)",
        value: "1800118600",
        phone: "1800118600",
        purpose: "wildlife",
      }),
      ch({
        channel_type: "portal",
        label: "Green Helpline status",
        value: FOREST_STATUS,
        action_url: FOREST_STATUS,
        tracking_url: FOREST_STATUS,
        purpose: "tracking",
      }),
      ch({
        channel_type: "portal",
        label: "Forest grievance (after emergency)",
        value: FOREST_GRIEVANCE,
        action_url: FOREST_GRIEVANCE,
        purpose: "emergency",
      }),
      ch({
        channel_type: "website",
        label: "Forest Department website",
        value: ENVIRONMENT_RIGHTS_SOURCE.forestDept,
        action_url: ENVIRONMENT_RIGHTS_SOURCE.forestDept,
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "delhi_traffic_police",
    name: "Delhi Traffic Police",
    short_description:
      "Conditional alternative for vehicle / traffic-related noise only — not every noise complaint.",
    official_website: "https://traffic.delhipolice.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Noise from vehicles/traffic only — prefer NGMS / 155271 first.",
    channels: [
      ch({
        channel_type: "phone",
        label: "Traffic helpline 1095 (vehicle noise alternative)",
        value: "1095",
        phone: "1095",
        purpose: "noise_pollution",
      }),
    ],
  },
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "Alternative for some municipal land / park / asset cases — not auto for pollution. Confirm MCD area.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Municipal alternative — needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center",
        value: "155305",
        phone: "155305",
        purpose: "grievance",
      }),
      ch({
        channel_type: "website",
        label: "MCD Online feedback",
        value: "https://mcdonline.nic.in/portal/feedback",
        action_url: "https://mcdonline.nic.in/portal/feedback",
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "ndmc",
    name: "New Delhi Municipal Council (NDMC)",
    short_description:
      "Alternative in NDMC area for some land / park cases — not auto for pollution.",
    official_website: "https://www.ndmc.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "NDMC area only — needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533",
        value: "1533",
        phone: "1533",
        purpose: "grievance",
      }),
      ch({
        channel_type: "portal",
        label: "NDMC complaints hub",
        value: "https://www.ndmc.gov.in/complaints.aspx",
        action_url: "https://www.ndmc.gov.in/complaints.aspx",
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "dda",
    name: "Delhi Development Authority (DDA)",
    short_description:
      "Alternative for some DDA land / park asset cases — not auto for pollution or every tree.",
    official_website: "https://dda.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "DDA land/park alternative — needs confirmation.",
    channels: [
      ch({
        channel_type: "portal",
        label: "DDA grievance hub",
        value: "https://dda.gov.in/grievance",
        action_url: "https://dda.gov.in/grievance",
        purpose: "grievance",
      }),
    ],
  },
];

export const FALLBACK_ENVIRONMENT_SERVICES: Record<
  string,
  FallbackAuthorityService[]
> = {
  ngms_noise: [
    {
      slug: "ngms_noise_complaint",
      service_name: "NGMS — Noise Pollution Complaint",
      description:
        "Official Delhi noise grievance portal. Prefer this over DPCC homepage for noise. Track via Citizen Status.",
      service_type: "complaint",
      official_url: NGMS,
      filing_url: NGMS,
      tracking_url: NGMS_TRACK,
      phone: "155271",
      integration_type: "deep_link",
      authority_slug: "ngms_noise",
      fields: [],
    },
  ],
  dpcc: [
    {
      slug: "green_delhi_app_env",
      service_name: "Green Delhi App",
      description:
        "Official Green Delhi App (DPCC) for pollution complaints. Play package com.green_delhi_teste; iOS id 1586987377. In-app tracking after login.",
      service_type: "complaint",
      official_url: GREEN_DELHI,
      filing_url: GREEN_PLAY,
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "dpcc",
      fields: [],
    },
    {
      slug: "green_delhi_portal_env",
      service_name: "Green Delhi portal",
      description:
        "greendelhi.nic.in for pollution complaints. Tracking inside portal after login — no separate public tracking_url.",
      service_type: "complaint",
      official_url: GREEN_DELHI,
      filing_url: GREEN_DELHI,
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "dpcc",
      fields: [],
    },
  ],
  delhi_forest: [
    {
      slug: "forest_grievance_env",
      service_name: "e-Forest grievance / Green Helpline",
      description:
        "grievance.eforest.delhi.gov.in for tree/wildlife. Helpline 1800-11-8600. Status: ghl.eforest.delhi.gov.in/Status.aspx.",
      service_type: "complaint",
      official_url: FOREST_GRIEVANCE,
      filing_url: FOREST_GRIEVANCE,
      tracking_url: FOREST_STATUS,
      phone: "1800118600",
      integration_type: "deep_link",
      authority_slug: "delhi_forest",
      fields: [],
    },
  ],
  environment_dept_delhi: [
    {
      slug: "environment_dept_info",
      service_name: "Environment Department (information)",
      description:
        "environment.delhi.gov.in — reference. Prefer NGMS / Green Delhi / Forest for filing.",
      service_type: "information",
      official_url: ENV_DEPT,
      filing_url: null,
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "environment_dept_delhi",
      fields: [],
    },
  ],
  mcd: [
    {
      slug: "mcd_env_municipal_alternative",
      service_name: "MCD (municipal alternative)",
      description:
        "155305 / MCD feedback — only where municipal land/asset may apply. Not auto for pollution.",
      service_type: "complaint",
      official_url: "https://mcdonline.nic.in/portal/feedback",
      filing_url: "https://mcdonline.nic.in/portal/feedback",
      tracking_url: null,
      phone: "155305",
      integration_type: "phone",
      authority_slug: "mcd",
      fields: [],
    },
  ],
  ndmc: [
    {
      slug: "ndmc_env_municipal_alternative",
      service_name: "NDMC (municipal alternative)",
      description:
        "1533 / complaints.aspx — NDMC area land/asset alternative. Not auto for pollution.",
      service_type: "complaint",
      official_url: "https://www.ndmc.gov.in/complaints.aspx",
      filing_url: "https://www.ndmc.gov.in/complaints.aspx",
      tracking_url: null,
      phone: "1533",
      integration_type: "phone",
      authority_slug: "ndmc",
      fields: [],
    },
  ],
  dda: [
    {
      slug: "dda_env_land_alternative",
      service_name: "DDA grievance (land / park alternative)",
      description:
        "dda.gov.in/grievance — DDA land/park alternative. Not auto for pollution or every tree.",
      service_type: "grievance",
      official_url: "https://dda.gov.in/grievance",
      filing_url: "https://dda.gov.in/grievance",
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "dda",
      fields: [],
    },
  ],
};

/** Known offline official services for recovery / global search. */
export const FALLBACK_OFFICIAL_SERVICES_CATALOG: {
  slug: string;
  name: string;
  purpose: string;
  official_url: string;
  tracking_url: string | null;
  phone: string | null;
  play_store_url: string | null;
  app_store_url: string | null;
  organization: string;
}[] = [
  {
    slug: "ngms_noise",
    name: "NGMS — Noise Pollution",
    purpose: "noise_pollution",
    official_url: NGMS,
    tracking_url: NGMS_TRACK,
    phone: "155271",
    play_store_url: null,
    app_store_url: null,
    organization: "GNCTD / Delhi Police",
  },
  {
    slug: "green_delhi_app",
    name: "Green Delhi App",
    purpose: "air_pollution",
    official_url: GREEN_DELHI,
    tracking_url: null,
    phone: null,
    play_store_url: GREEN_PLAY,
    app_store_url: GREEN_IOS,
    organization: "DPCC",
  },
  {
    slug: "forest_grievance",
    name: "e-Forest Grievance",
    purpose: "trees_forest",
    official_url: FOREST_GRIEVANCE,
    tracking_url: FOREST_STATUS,
    phone: "1800118600",
    play_store_url: null,
    app_store_url: null,
    organization: "Forest & Wildlife Department",
  },
  {
    slug: "cm_jan_sunwai",
    name: "CM Jan Sunwai",
    purpose: "general_grievance",
    official_url: CM_JAN,
    tracking_url: "https://cmjansunwai.delhi.gov.in/ComplaintTracker",
    phone: null,
    play_store_url: null,
    app_store_url: null,
    organization: "GNCTD",
  },
];
