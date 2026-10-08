/**
 * Offline Water & Drainage fallback — verified contacts only (mirrors DB seeds).
 * No invented phones, ZRO lists, or tracking query params.
 */

import type { AuthorityChannel, RoutedAuthority } from "./routingFallback";
import type { IssueTypeRow, AssessmentQuestion } from "./emergencyFallback";
import type { FallbackAuthorityService } from "./dfsEmergencyFieldsFallback";
import { WATER_DRAINAGE_GROUPS } from "./waterDrainageKnowledge";
import { MCD311_CREATE, MCD311_TRACK } from "./mcd311Urls";

/** Offline Step 2 list uses groups as selectable “issue types”. */
export const FALLBACK_WATER_DRAINAGE_ISSUE_TYPES: IssueTypeRow[] =
  WATER_DRAINAGE_GROUPS.map((g, i) => ({
    slug: g.representativeSlug,
    name: g.label,
    short_description: g.description,
    sort_order: i + 1,
  }));

export const FALLBACK_WATER_DRAINAGE_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "rapid_flood_or_trapped",
    question_text:
      "Is water rising rapidly, or is anyone trapped in floodwater / unable to get out safely?",
    sort_order: 1,
    explanation:
      "Call 112 / 101 / 102 first. Do not enter floodwater. Then use I&FC waterlogging helpline if verified and safe.",
  },
  {
    question_key: "open_manhole_under_water",
    question_text:
      "Is there an open manhole, or a manhole / opening hidden under water?",
    sort_order: 2,
    explanation:
      "Stay away. Do not approach. Call 112 if anyone may fall in or is in immediate danger.",
  },
  {
    question_key: "water_near_electrical",
    question_text:
      "Is water near exposed electrical equipment, live wires, or sparking?",
    sort_order: 3,
    explanation:
      "Electrical + water hazard: call 112 / 101 first. Do not touch. Do not enter the water.",
  },
  {
    question_key: "sewer_immediate_exposure",
    question_text:
      "Is there sewer overflow creating immediate exposure risk to people right now?",
    sort_order: 4,
    explanation:
      "Stay away from sewer water. Call 112 if anyone is in immediate danger.",
  },
  {
    question_key: "immediate_danger_people_water",
    question_text:
      "Is there an immediate danger to people from this water / drainage situation?",
    sort_order: 5,
    explanation:
      "Immediate danger requires emergency services before any normal civic complaint.",
  },
];

function ch(
  partial: AuthorityChannel & { purpose?: string }
): AuthorityChannel & { purpose?: string } {
  return partial;
}

export const FALLBACK_WATER_DRAINAGE_ROUTING: RoutedAuthority[] = [
  {
    slug: "delhi_jal_board",
    name: "Delhi Jal Board (DJB)",
    short_description:
      "Candidate for water supply / sewerage / billing in DJB areas. Confirm from bill — GPS does not prove DJB.",
    official_website: "https://djb.gov.in/",
    emergency_number: "1916",
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Water authority needs confirmation — never auto-assigned.",
    channels: [
      ch({
        channel_type: "phone",
        label: "DJB water / sewer (1916 option 1)",
        value: "1916",
        phone: "1916",
        purpose: "water_supply",
      }),
      ch({
        channel_type: "phone",
        label: "DJB sewerage (1916 option 1)",
        value: "1916",
        phone: "1916",
        purpose: "sewerage",
      }),
      ch({
        channel_type: "phone",
        label: "DJB billing (1916 option 3)",
        value: "1916",
        phone: "1916",
        purpose: "billing",
      }),
      ch({
        channel_type: "phone",
        label: "DJB billing grievances direct line",
        value: "011-66587300",
        phone: "011-66587300",
        purpose: "billing",
      }),
      ch({
        channel_type: "phone",
        label: "DJB meter / connection",
        value: "1916",
        phone: "1916",
        purpose: "meter",
      }),
      ch({
        channel_type: "phone",
        label: "DJB water quality",
        value: "1916",
        phone: "1916",
        purpose: "water_quality",
      }),
      ch({
        channel_type: "phone",
        label: "DJB alternate toll-free (official contact-us)",
        value: "1800117118",
        phone: "1800117118",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "whatsapp",
        label: "DJB WhatsApp (official contact-us)",
        value: "9650291021",
        phone: "9650291021",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "phone",
        label: "DJB track via 1916 + SMS reference",
        value: "1916",
        phone: "1916",
        purpose: "tracking",
        tracking_url: null,
      }),
      ch({
        channel_type: "web_complaint",
        label: "DJB billing / RMS grievance (official portal)",
        value: "https://djb.gov.in/DJBRMSPortal/portal/grievenceRegister.html",
        action_url:
          "https://djb.gov.in/DJBRMSPortal/portal/grievenceRegister.html",
        purpose: "billing",
      }),
      ch({
        channel_type: "website",
        label: "DJB official website",
        value: "https://djb.gov.in/",
        action_url: "https://djb.gov.in/",
        purpose: "web_portal",
      }),
      ch({
        channel_type: "portal",
        label: "DJB Contact Us PDF (ZRO / area)",
        value: "https://djb.gov.in/StaticContent/ContactUs.pdf",
        action_url: "https://djb.gov.in/StaticContent/ContactUs.pdf",
        purpose: "grievance",
      }),
    ],
  },
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "Candidate for municipal drainage / waterlogging / open manhole in MCD areas. Not automatic for all water issues.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Municipal drainage — needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center",
        value: "155305",
        phone: "155305",
        purpose: "waterlogging",
      }),
      ch({
        channel_type: "phone",
        label: "MCD Citizen Call Center",
        value: "155305",
        phone: "155305",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "phone",
        label: "MCD (after emergency if open manhole)",
        value: "155305",
        phone: "155305",
        purpose: "emergency",
      }),
      ch({
        channel_type: "app",
        label: "MCD311",
        value: "MCD311",
        purpose: "app",
      }),
      ch({
        channel_type: "website",
        label: "MCD311 file / track",
        value: "https://mcdonline.nic.in/",
        action_url: MCD311_CREATE,
        tracking_url: MCD311_TRACK,
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "ndmc",
    name: "New Delhi Municipal Council (NDMC)",
    short_description:
      "Candidate only in NDMC area. Kali Bari water control and sewerage contacts are area-specific.",
    official_website: "https://www.ndmc.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Confirm NDMC area — no fake universal sewer number.",
    channels: [
      ch({
        channel_type: "phone",
        label: "NDMC Kali Bari water control",
        value: "011-23743642",
        phone: "011-23743642",
        purpose: "water_supply",
        geography: "ndmc_kali_bari",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC Kali Bari water control",
        value: "011-23360683",
        phone: "011-23360683",
        purpose: "water_supply",
        geography: "ndmc_kali_bari",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC Kali Bari water quality",
        value: "011-23743642",
        phone: "011-23743642",
        purpose: "water_quality",
        geography: "ndmc_kali_bari",
      }),
      ch({
        channel_type: "portal",
        label: "NDMC sewerage FAQs (area centres)",
        value: "https://www.ndmc.gov.in/faq/sewerage_faqs.aspx",
        action_url: "https://www.ndmc.gov.in/faq/sewerage_faqs.aspx",
        purpose: "sewerage",
        geography: "ndmc_area",
      }),
      ch({
        channel_type: "portal",
        label: "NDMC civil complaints",
        value: "https://www.ndmc.gov.in/Departments/civil_complaints.aspx",
        action_url: "https://www.ndmc.gov.in/Departments/civil_complaints.aspx",
        purpose: "web_portal",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC civic helpline",
        value: "1533",
        phone: "1533",
        purpose: "general_customer_care",
      }),
    ],
  },
  {
    slug: "irrigation_flood_control",
    name: "Irrigation & Flood Control (I&FC)",
    short_description:
      "Candidate for flooding / major waterlogging — not every blocked drain.",
    official_website: "https://ifc.delhi.gov.in/",
    emergency_number: "1800-11-0093",
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Flood / waterlogging context — needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "I&FC waterlogging helpline (toll-free)",
        value: "1800-11-0093",
        phone: "1800-11-0093",
        purpose: "waterlogging",
      }),
      ch({
        channel_type: "phone",
        label: "I&FC flood control helpline",
        value: "1800-11-0093",
        phone: "1800-11-0093",
        purpose: "flood_control",
      }),
      ch({
        channel_type: "phone",
        label: "I&FC helpline (after 112 if needed)",
        value: "1800-11-0093",
        phone: "1800-11-0093",
        purpose: "emergency",
      }),
      ch({
        channel_type: "phone",
        label: "Central Flood Control Room",
        value: "011-21210867",
        phone: "011-21210867",
        purpose: "flood_control",
      }),
      ch({
        channel_type: "website",
        label: "I&FC flood control rooms",
        value: "https://ifc.delhi.gov.in/ifc/flood-control-rooms",
        action_url: "https://ifc.delhi.gov.in/ifc/flood-control-rooms",
        purpose: "flood_control",
      }),
    ],
  },
];

export const FALLBACK_WATER_DRAINAGE_SERVICES: Record<
  string,
  FallbackAuthorityService[]
> = {
  delhi_jal_board: [
    {
      slug: "djb_water_supply_1916",
      service_name: "DJB water / sewer (Call 1916)",
      description:
        "Call 1916 option 1 for water/sewer. Confirm DJB area. Track via 1916 + SMS ref — no verified web tracking URL. This app does not file for you.",
      service_type: "complaint",
      official_url: "https://djb.gov.in/",
      filing_url: null,
      tracking_url: null,
      phone: "1916",
      integration_type: "phone",
      authority_slug: "delhi_jal_board",
      fields: [
        {
          field_key: "issue_description",
          label: "Issue description",
          description: "Water supply, leakage, sewer, or quality concern",
          field_type: "long_text",
          requiredness: "recommended",
          sort_order: 1,
        },
        {
          field_key: "location_address",
          label: "Location / address",
          description: "Where the issue is occurring",
          field_type: "address",
          requiredness: "recommended",
          sort_order: 2,
        },
        {
          field_key: "contact_phone",
          label: "Your phone number",
          description: "Needed to receive SMS complaint reference from DJB",
          field_type: "phone",
          requiredness: "recommended",
          sort_order: 3,
        },
      ],
    },
    {
      slug: "djb_billing_1916",
      service_name: "DJB billing (1916 option 3)",
      description:
        "Call 1916 option 3 for billing. Direct line 011-66587300 also listed on ContactUs.pdf.",
      service_type: "complaint",
      official_url: "https://djb.gov.in/StaticContent/ContactUs.pdf",
      filing_url: null,
      tracking_url: null,
      phone: "1916",
      integration_type: "phone",
      authority_slug: "delhi_jal_board",
      fields: [],
    },
  ],
  mcd: [
    {
      slug: "mcd_waterlogging_155305",
      service_name: "MCD Citizen Call Center / MCD311",
      description:
        "155305 and MCD311 listed on mcdonline feedback page. Confirm MCD area for drainage/waterlogging.",
      service_type: "complaint",
      official_url: "https://mcdonline.nic.in/portal/feedback",
      filing_url: MCD311_CREATE,
      tracking_url: MCD311_TRACK,
      phone: "155305",
      integration_type: "phone",
      authority_slug: "mcd",
      fields: [],
    },
  ],
  ndmc: [
    {
      slug: "ndmc_kali_bari_water",
      service_name: "NDMC Kali Bari water control",
      description:
        "NDMC-area water supply control room. Confirm NDMC jurisdiction. Sewerage uses area-specific FAQ centres — no universal sewer number.",
      service_type: "complaint",
      official_url: "https://www.ndmc.gov.in/departments/civil_i.aspx",
      filing_url: "https://www.ndmc.gov.in/Departments/civil_complaints.aspx",
      tracking_url: null,
      phone: "011-23743642",
      integration_type: "phone",
      authority_slug: "ndmc",
      fields: [],
    },
  ],
  irrigation_flood_control: [
    {
      slug: "ifc_waterlogging_helpline",
      service_name: "I&FC waterlogging helpline",
      description:
        "Toll-free 1800-11-0093. For flooding/waterlogging — not every blocked drain. Call 112 first if life danger.",
      service_type: "emergency",
      official_url: "https://ifc.delhi.gov.in/ifc/flood-control-rooms",
      filing_url: "https://ifc.delhi.gov.in/ifc/flood-control-rooms",
      tracking_url: null,
      phone: "1800-11-0093",
      integration_type: "phone",
      authority_slug: "irrigation_flood_control",
      fields: [],
    },
  ],
};
