/**
 * Offline Roads & Public Spaces fallback — verified contacts only (mirrors DB seeds).
 * No invented phones, bus-shelter operators, or tracking query params.
 * Streetlight: points citizens to Electricity / DISCOM architecture — do not duplicate DISCOM numbers here.
 */

import type { AuthorityChannel, RoutedAuthority } from "./routingFallback";
import type { IssueTypeRow, AssessmentQuestion } from "./emergencyFallback";
import type { FallbackAuthorityService } from "./dfsEmergencyFieldsFallback";
import { ROADS_PUBLIC_SPACES_GROUPS } from "./roadsPublicSpacesKnowledge";
import { MCD311_CREATE as MCD_CREATE, MCD311_TRACK as MCD_TRACK } from "./mcd311Urls";

/** Offline Step 2 list uses groups as selectable “issue types”. */
export const FALLBACK_ROADS_PUBLIC_SPACES_ISSUE_TYPES: IssueTypeRow[] =
  ROADS_PUBLIC_SPACES_GROUPS.map((g, i) => ({
    slug: g.representativeSlug,
    name: g.label,
    short_description: g.description,
    sort_order: i + 1,
  }));

export const FALLBACK_ROADS_PUBLIC_SPACES_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "road_collapse_or_sinkhole",
    question_text:
      "Is there a road collapse, sinkhole, or large open void in the roadway right now?",
    sort_order: 1,
    explanation:
      "Call 112 first. Do not stand in traffic or approach the collapse. Civic channels are secondary after emergency response.",
  },
  {
    question_key: "open_manhole_traffic",
    question_text:
      "Is there an open manhole or uncovered pit in the path of traffic or pedestrians with immediate danger?",
    sort_order: 2,
    explanation:
      "Call 112 first. Do not approach the manhole. Stay clear of traffic.",
  },
  {
    question_key: "live_wire_or_flood_road",
    question_text:
      "Is there a live/fallen wire on the road, or flooding that puts people at immediate risk?",
    sort_order: 3,
    explanation:
      "Call 112 / 101 first. Do not approach wires or enter floodwater. Prefer Electricity / Water emergency channels after life safety.",
  },
  {
    question_key: "dangerous_signal_or_bridge",
    question_text:
      "Is a traffic signal failed at a dangerous junction, or is a bridge/FOB structurally unsafe with people at risk right now?",
    sort_order: 4,
    explanation:
      "Call 112 first. Traffic Police 1095 may help for signal/traffic management after emergency response.",
  },
];

function ch(
  partial: AuthorityChannel & { purpose?: string }
): AuthorityChannel & { purpose?: string } {
  return partial;
}

export const FALLBACK_ROADS_PUBLIC_SPACES_ROUTING: RoutedAuthority[] = [
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "Candidate for MCD roads, footpaths, parks, street furniture in MCD areas. Not automatic for all roads.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Municipal roads/parks — needs confirmation. Never all roads → MCD.",
    channels: [
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (pothole)",
        value: "155305",
        phone: "155305",
        purpose: "pothole",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (road damage)",
        value: "155305",
        phone: "155305",
        purpose: "road_damage",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (footpath)",
        value: "155305",
        phone: "155305",
        purpose: "footpath",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (park)",
        value: "155305",
        phone: "155305",
        purpose: "park",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (street furniture)",
        value: "155305",
        phone: "155305",
        purpose: "street_furniture",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (road signage)",
        value: "155305",
        phone: "155305",
        purpose: "road_signage",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (public space)",
        value: "155305",
        phone: "155305",
        purpose: "public_space",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (encroachment)",
        value: "155305",
        phone: "155305",
        purpose: "encroachment",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (road cut)",
        value: "155305",
        phone: "155305",
        purpose: "road_cut",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (waterlogging — municipal)",
        value: "155305",
        phone: "155305",
        purpose: "waterlogging",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (after emergency)",
        value: "155305",
        phone: "155305",
        purpose: "emergency",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center (grievance)",
        value: "155305",
        phone: "155305",
        purpose: "grievance",
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
    slug: "pwd_delhi",
    name: "Public Works Department (PWD)",
    short_description:
      "Candidate only for PWD-maintained roads / FOBs / streetlights — not all roads. Confirm ownership.",
    official_website: "https://www.pwddelhi.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "PWD assets only — never auto-route all roads to PWD.",
    channels: [
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (pothole)",
        value: "1908",
        phone: "1908",
        purpose: "pothole",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (road damage)",
        value: "1908",
        phone: "1908",
        purpose: "road_damage",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (footpath)",
        value: "1908",
        phone: "1908",
        purpose: "footpath",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (bridge / FOB)",
        value: "1908",
        phone: "1908",
        purpose: "bridge",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (underpass)",
        value: "1908",
        phone: "1908",
        purpose: "underpass",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (road cut)",
        value: "1908",
        phone: "1908",
        purpose: "road_cut",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (streetlight — PWD asset)",
        value: "1908",
        phone: "1908",
        purpose: "streetlight",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (grievance)",
        value: "1908",
        phone: "1908",
        purpose: "grievance",
      }),
      ch({
        channel_type: "phone",
        label: "PWD Sewa helpline 1908 (after emergency)",
        value: "1908",
        phone: "1908",
        purpose: "emergency",
      }),
      ch({
        channel_type: "email",
        label: "PWD complaint email",
        value: "complaint@pwddelhi.gov.in",
        email: "complaint@pwddelhi.gov.in",
        purpose: "email",
      }),
      ch({
        channel_type: "whatsapp",
        label: "PWD Sewa WhatsApp chatbot",
        value: "8130188222",
        whatsapp: "8130188222",
        purpose: "whatsapp",
      }),
      ch({
        channel_type: "portal",
        label: "PWD Sewa hub",
        value: "https://www.pwddelhi.gov.in/sewa",
        action_url: "https://www.pwddelhi.gov.in/sewa",
        purpose: "web_portal",
      }),
      ch({
        channel_type: "portal",
        label: "PWD Sewa submit complaint",
        value: "https://pwdsewa.pwddelhi.gov.in/Home/SubmitComplaint/",
        action_url: "https://pwdsewa.pwddelhi.gov.in/Home/SubmitComplaint/",
        purpose: "web_portal",
      }),
      ch({
        channel_type: "portal",
        label: "PWD Sewa check complaint status",
        value: "https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus",
        action_url: "https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus",
        tracking_url:
          "https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus",
        purpose: "tracking",
      }),
      ch({
        channel_type: "app",
        label: "PWD SEWA App",
        value: "PWD SEWA",
        action_url: "https://www.pwddelhi.gov.in/sewa",
        purpose: "app",
      }),
    ],
  },
  {
    slug: "ndmc",
    name: "New Delhi Municipal Council (NDMC)",
    short_description:
      "Candidate only in NDMC area for roads, footpaths, parks, FOB, bus shelters (Civil-I). Confirm NDMC area.",
    official_website: "https://www.ndmc.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "NDMC area only — needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (pothole)",
        value: "1533",
        phone: "1533",
        purpose: "pothole",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (road damage)",
        value: "1533",
        phone: "1533",
        purpose: "road_damage",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (footpath)",
        value: "1533",
        phone: "1533",
        purpose: "footpath",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (park)",
        value: "1533",
        phone: "1533",
        purpose: "park",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (street furniture)",
        value: "1533",
        phone: "1533",
        purpose: "street_furniture",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (bus shelter — NDMC area)",
        value: "1533",
        phone: "1533",
        purpose: "bus_shelter",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (bridge / FOB)",
        value: "1533",
        phone: "1533",
        purpose: "bridge",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (road signage)",
        value: "1533",
        phone: "1533",
        purpose: "road_signage",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC helpline 1533 (grievance)",
        value: "1533",
        phone: "1533",
        purpose: "grievance",
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
      ch({
        channel_type: "website",
        label: "NDMC Civil-I (roads / parks / FOB / bus shelters)",
        value: "https://www.ndmc.gov.in/departments/civil_i.aspx",
        action_url: "https://www.ndmc.gov.in/departments/civil_i.aspx",
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "dda",
    name: "Delhi Development Authority (DDA)",
    short_description:
      "Conditional: DDA parks / roads only when DDA context. Reuse grievance channels.",
    official_website: "https://dda.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "DDA context only — needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "DDA helpline (park / public space)",
        value: "1800110332",
        phone: "1800110332",
        purpose: "park",
      }),
      ch({
        channel_type: "phone",
        label: "DDA helpline (road — DDA context)",
        value: "1800110332",
        phone: "1800110332",
        purpose: "road_damage",
      }),
      ch({
        channel_type: "phone",
        label: "DDA helpline (grievance)",
        value: "1800110332",
        phone: "1800110332",
        purpose: "grievance",
      }),
      ch({
        channel_type: "email",
        label: "DDA Grievance Redressal email",
        value: "dirsagr@dda.org.in",
        email: "dirsagr@dda.org.in",
        purpose: "email",
      }),
      ch({
        channel_type: "portal",
        label: "DDA grievance hub",
        value: "https://dda.gov.in/grievance",
        action_url: "https://dda.gov.in/grievance",
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "delhi_traffic_police",
    name: "Delhi Traffic Police",
    short_description:
      "Candidate for traffic signals, illegal parking, traffic obstruction — NOT every pothole.",
    official_website: "https://traffic.delhipolice.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Traffic management only — never for every pothole.",
    channels: [
      ch({
        channel_type: "phone",
        label: "Traffic helpline 1095 (signal)",
        value: "1095",
        phone: "1095",
        purpose: "traffic_signal",
      }),
      ch({
        channel_type: "phone",
        label: "Traffic helpline 1095 (obstruction)",
        value: "1095",
        phone: "1095",
        purpose: "traffic_obstruction",
      }),
      ch({
        channel_type: "phone",
        label: "Traffic helpline 1095 (illegal parking)",
        value: "1095",
        phone: "1095",
        purpose: "traffic_obstruction",
      }),
      ch({
        channel_type: "phone",
        label: "Traffic control room 011-25844444",
        value: "011-25844444",
        phone: "011-25844444",
        purpose: "phone",
      }),
      ch({
        channel_type: "phone",
        label: "Traffic helpline 1095 (emergency context)",
        value: "1095",
        phone: "1095",
        purpose: "emergency",
      }),
      ch({
        channel_type: "email",
        label: "Traffic grievance email",
        value: "grievance.traffic@delhipolice.gov.in",
        email: "grievance.traffic@delhipolice.gov.in",
        purpose: "email",
      }),
      ch({
        channel_type: "website",
        label: "Traffic Police contact us",
        value: "https://traffic.delhipolice.gov.in/en/contact-us",
        action_url: "https://traffic.delhipolice.gov.in/en/contact-us",
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "delhi_cantonment",
    name: "Delhi Cantonment Board",
    short_description:
      "Conditional: Cantonment limits only. Road/park phones not re-verified this pass — website.",
    official_website: "https://delhi.cantt.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Cantonment only — website; phones NULL for roads this pass.",
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
    slug: "irrigation_flood_control",
    name: "Irrigation & Flood Control (I&FC)",
    short_description:
      "Cross-ref for road waterlogging / flood context — not automatic road owner.",
    official_website: "https://ifc.delhi.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Waterlogging on road — prefer I&FC / municipal over auto PWD.",
    channels: [
      ch({
        channel_type: "phone",
        label: "I&FC waterlogging helpline",
        value: "1800-11-0093",
        phone: "1800-11-0093",
        purpose: "waterlogging",
      }),
    ],
  },
];

export const FALLBACK_ROADS_PUBLIC_SPACES_SERVICES: Record<
  string,
  FallbackAuthorityService[]
> = {
  mcd: [
    {
      slug: "mcd311_roads_public_spaces",
      service_name: "MCD311 / Citizen Call Center (roads & parks)",
      description:
        "155305 and MCD311 from mcdonline feedback. Confirm MCD area for roads/footpaths/parks. This app does not file for you.",
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
  pwd_delhi: [
    {
      slug: "pwd_sewa_roads",
      service_name: "PWD Sewa (roads / public works)",
      description:
        "Toll-free 1908, WhatsApp 8130188222, complaint@pwddelhi.gov.in on pwddelhi.gov.in Sewa. Confirm PWD asset. This app does not file for you.",
      service_type: "complaint",
      official_url: "https://www.pwddelhi.gov.in/sewa",
      filing_url: "https://pwdsewa.pwddelhi.gov.in/Home/SubmitComplaint/",
      tracking_url:
        "https://pwdsewa.pwddelhi.gov.in/Home/CheckComplaintStatus",
      phone: "1908",
      integration_type: "phone",
      authority_slug: "pwd_delhi",
      fields: [],
    },
  ],
  ndmc: [
    {
      slug: "ndmc_roads_complaints",
      service_name: "NDMC complaints / 1533 (roads & parks)",
      description:
        "1533, WhatsApp 8588887773, care@ndmc.gov.in. Civil-I covers roads/parks/FOB/bus shelters in NDMC area. Tracking URL not verified.",
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
      slug: "dda_roads_parks_grievance",
      service_name: "DDA grievance (parks / roads — DDA context)",
      description:
        "1800110332 and dirsagr@dda.org.in via dda.gov.in/grievance. Only when DDA context. Dedicated tracking URL not verified.",
      service_type: "grievance",
      official_url: "https://dda.gov.in/grievance",
      filing_url: "https://dda.gov.in/grievance",
      tracking_url: null,
      phone: "1800110332",
      integration_type: "phone",
      authority_slug: "dda",
      fields: [],
    },
  ],
  delhi_traffic_police: [
    {
      slug: "traffic_citizen_services_roads",
      service_name: "Delhi Traffic Police citizen contact",
      description:
        "1095 / 011-25844444 and grievance.traffic@delhipolice.gov.in on traffic.delhipolice.gov.in contact-us. For signals / obstruction / parking — not every pothole.",
      service_type: "complaint",
      official_url: "https://traffic.delhipolice.gov.in/en/contact-us",
      filing_url: "https://traffic.delhipolice.gov.in/en/contact-us",
      tracking_url: null,
      phone: "1095",
      integration_type: "phone",
      authority_slug: "delhi_traffic_police",
      fields: [],
    },
  ],
  delhi_cantonment: [
    {
      slug: "dcb_roads_website",
      service_name: "Delhi Cantonment Board website (roads)",
      description:
        "Cantonment limits only. Road/park complaint phone not re-verified this pass — opens official website only.",
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
  irrigation_flood_control: [
    {
      slug: "ifc_road_waterlogging_crossref",
      service_name: "I&FC waterlogging helpline (road waterlogging cross-ref)",
      description:
        "1800-11-0093 for waterlogging/flood context. Not the automatic road owner. Prefer Water & Drainage flow when flooding is primary.",
      service_type: "complaint",
      official_url: "https://ifc.delhi.gov.in/ifc/organizational-setup",
      filing_url: null,
      tracking_url: null,
      phone: "1800-11-0093",
      integration_type: "phone",
      authority_slug: "irrigation_flood_control",
      fields: [],
    },
  ],
};
