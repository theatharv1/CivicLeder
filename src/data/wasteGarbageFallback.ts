/**
 * Offline Waste & Garbage fallback — verified contacts only (mirrors DB seeds).
 * No invented phones, area officer lists, or tracking query params.
 */

import type { AuthorityChannel, RoutedAuthority } from "./routingFallback";
import type { IssueTypeRow, AssessmentQuestion } from "./emergencyFallback";
import type { FallbackAuthorityService } from "./dfsEmergencyFieldsFallback";
import { WASTE_GARBAGE_GROUPS } from "./wasteGarbageKnowledge";
import { MCD311_CREATE as MCD_CREATE, MCD311_TRACK as MCD_TRACK } from "./mcd311Urls";

/** Offline Step 2 list uses groups as selectable “issue types”. */
export const FALLBACK_WASTE_GARBAGE_ISSUE_TYPES: IssueTypeRow[] =
  WASTE_GARBAGE_GROUPS.map((g, i) => ({
    slug: g.representativeSlug,
    name: g.label,
    short_description: g.description,
    sort_order: i + 1,
  }));

export const FALLBACK_WASTE_GARBAGE_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "active_waste_fire",
    question_text:
      "Is there an active fire, large burning pile, or spreading flames involving waste right now?",
    sort_order: 1,
    explanation:
      "Call 112 / 101 first. Do not approach the fire. Municipal / DPCC burning channels are secondary after emergency response.",
  },
  {
    question_key: "people_near_burning",
    question_text:
      "Is anyone trapped, injured, or in immediate danger near burning waste or smoke?",
    sort_order: 2,
    explanation: "Call 112 / 101 first. Stay clear of smoke and flames.",
  },
  {
    question_key: "sharps_or_hazardous_exposure",
    question_text:
      "Are there needles, sharps, or materials that may be hazardous with people at immediate risk of contact?",
    sort_order: 3,
    explanation:
      "Stay away. Do not touch. Call 112 if someone is injured. Do not use ordinary garbage-collection channels first.",
  },
  {
    question_key: "immediate_danger_waste",
    question_text:
      "Is there an immediate danger to people from this waste situation (fire, toxic smoke, collapse of piled waste, etc.)?",
    sort_order: 4,
    explanation:
      "Immediate danger requires emergency services before any normal civic waste complaint.",
  },
];

function ch(
  partial: AuthorityChannel & { purpose?: string }
): AuthorityChannel & { purpose?: string } {
  return partial;
}

export const FALLBACK_WASTE_GARBAGE_ROUTING: RoutedAuthority[] = [
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "Candidate for MSW collection, bin overflow, dumping, littering, malba in MCD areas. Not automatic for all waste.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Municipal waste — needs confirmation. Never all waste → MCD.",
    channels: [
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center",
        value: "155305",
        phone: "155305",
        purpose: "garbage_collection",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (missed collection)",
        value: "155305",
        phone: "155305",
        purpose: "missed_collection",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (dumping)",
        value: "155305",
        phone: "155305",
        purpose: "dumping",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (littering)",
        value: "155305",
        phone: "155305",
        purpose: "littering",
      }),
      ch({
        channel_type: "phone",
        label: "MCD (burning — after 112/101 if fire)",
        value: "155305",
        phone: "155305",
        purpose: "burning",
      }),
      ch({
        channel_type: "phone",
        label: "MCD (plastic dumping)",
        value: "155305",
        phone: "155305",
        purpose: "plastic_waste",
      }),
      ch({
        channel_type: "phone",
        label: "MCD (malba / C&D dumping)",
        value: "155305",
        phone: "155305",
        purpose: "cd_waste",
      }),
      ch({
        channel_type: "phone",
        label: "MCD (sanitation / public health)",
        value: "155305",
        phone: "155305",
        purpose: "public_health",
      }),
      ch({
        channel_type: "phone",
        label: "MCD (after emergency)",
        value: "155305",
        phone: "155305",
        purpose: "emergency",
      }),
      ch({
        channel_type: "app",
        label: "MCD311",
        value: "MCD311",
        action_url: MCD_CREATE,
        tracking_url: MCD_TRACK,
        purpose: "app",
      }),
      ch({
        channel_type: "portal",
        label: "MCD311 create complaint",
        value: MCD_CREATE,
        action_url: MCD_CREATE,
        tracking_url: MCD_TRACK,
        purpose: "web_portal",
      }),
      ch({
        channel_type: "portal",
        label: "MCD311 track complaint",
        value: MCD_TRACK,
        action_url: MCD_TRACK,
        tracking_url: MCD_TRACK,
        purpose: "tracking",
      }),
      ch({
        channel_type: "email",
        label: "MCD IT helpdesk email",
        value: "mcd-ithelpdesk@mcd.nic.in",
        email: "mcd-ithelpdesk@mcd.nic.in",
        purpose: "email",
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
      "Candidate only in NDMC area for sanitation / garbage. Area officer numbers are not universal.",
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
        purpose: "garbage_collection",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (missed collection)",
        value: "1533",
        phone: "1533",
        purpose: "missed_collection",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (dumping)",
        value: "1533",
        phone: "1533",
        purpose: "dumping",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (littering)",
        value: "1533",
        phone: "1533",
        purpose: "littering",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (burning)",
        value: "1533",
        phone: "1533",
        purpose: "burning",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (public health)",
        value: "1533",
        phone: "1533",
        purpose: "public_health",
      }),
      ch({
        channel_type: "whatsapp",
        label: "NDMC WhatsApp",
        value: "8588887773",
        whatsapp: "8588887773",
        purpose: "whatsapp",
      }),
      ch({
        channel_type: "email",
        label: "NDMC care email",
        value: "care@ndmc.gov.in",
        email: "care@ndmc.gov.in",
        purpose: "email",
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
    slug: "delhi_cantonment",
    name: "Delhi Cantonment Board",
    short_description:
      "Conditional: Cantonment limits only. Waste complaint phones/portals not verified this pass.",
    official_website: "https://delhi.cantt.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Cantonment only — website channel; phones NULL for waste this pass.",
    channels: [
      ch({
        channel_type: "website",
        label: "Delhi Cantonment Board website",
        value: "https://delhi.cantt.gov.in/",
        action_url: "https://delhi.cantt.gov.in/",
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "dpcc",
    name: "Delhi Pollution Control Committee (DPCC)",
    short_description:
      "Candidate for burning / plastic compliance / C&D regulatory / hazardous / biomedical / e-waste — not municipal collection.",
    official_website: "https://www.dpcc.delhigovt.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Environmental / regulatory — never all waste → DPCC.",
    channels: [
      ch({
        channel_type: "portal",
        label: "Green Delhi (burning / pollution)",
        value: "https://greendelhi.nic.in/",
        action_url: "https://greendelhi.nic.in/",
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
        channel_type: "portal",
        label: "Green Delhi (plastic / env)",
        value: "https://greendelhi.nic.in/",
        action_url: "https://greendelhi.nic.in/",
        purpose: "plastic_waste",
      }),
      ch({
        channel_type: "portal",
        label: "Green Delhi (C&D / env)",
        value: "https://greendelhi.nic.in/",
        action_url: "https://greendelhi.nic.in/",
        purpose: "cd_waste",
      }),
      ch({
        channel_type: "website",
        label: "DPCC official website",
        value: "https://www.dpcc.delhigovt.nic.in/",
        action_url: "https://www.dpcc.delhigovt.nic.in/",
        purpose: "web_portal",
      }),
      ch({
        channel_type: "website",
        label: "DPCC solid waste page",
        value: "https://www.dpcc.delhigovt.nic.in/solidwastemanagement",
        action_url: "https://www.dpcc.delhigovt.nic.in/solidwastemanagement",
        purpose: "hazardous_waste",
      }),
    ],
  },
];

export const FALLBACK_WASTE_GARBAGE_SERVICES: Record<
  string,
  FallbackAuthorityService[]
> = {
  mcd: [
    {
      slug: "mcd311_waste_garbage",
      service_name: "MCD311 / Citizen Call Center (waste)",
      description:
        "155305 and MCD311 from mcdonline feedback. Confirm MCD area for MSW/collection/dumping/malba. This app does not file for you.",
      service_type: "complaint",
      official_url: "https://mcdonline.nic.in/portal/feedback",
      filing_url: MCD_CREATE,
      tracking_url: MCD_TRACK,
      phone: "155305",
      integration_type: "phone",
      authority_slug: "mcd",
      fields: [],
    },
  ],
  ndmc: [
    {
      slug: "ndmc_waste_complaints",
      service_name: "NDMC complaints / 1533 (waste)",
      description:
        "1533, WhatsApp 8588887773, care@ndmc.gov.in on complaints.aspx. NDMC area only. Tracking URL not verified.",
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
  dpcc: [
    {
      slug: "dpcc_green_delhi_waste_burning",
      service_name: "Green Delhi / DPCC burning & pollution",
      description:
        "Green Delhi portal for pollution/burning. If fire: 112/101 first. DPCC WhatsApp 9717593574 is purpose=burning only.",
      service_type: "complaint",
      official_url: "https://greendelhi.nic.in/",
      filing_url: "https://greendelhi.nic.in/",
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "dpcc",
      fields: [],
    },
  ],
  delhi_cantonment: [
    {
      slug: "dcb_waste_website",
      service_name: "Delhi Cantonment Board website (waste)",
      description:
        "Cantonment limits only. Waste complaint phone/portal not verified — opens official website only.",
      service_type: "information",
      official_url: "https://delhi.cantt.gov.in/",
      filing_url: null,
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "delhi_cantonment",
      fields: [],
    },
  ],
};
