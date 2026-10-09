/**
 * Offline Electricity fallback — verified contacts only (mirrors DB seeds).
 * No invented phones, CGRF addresses, or APKs.
 */

import type { AuthorityChannel, RoutedAuthority } from "./routingFallback";
import type { IssueTypeRow, AssessmentQuestion } from "./emergencyFallback";
import type { FallbackAuthorityService } from "./dfsEmergencyFieldsFallback";

export const FALLBACK_ELECTRICITY_ISSUE_TYPES: IssueTypeRow[] = [
  {
    slug: "electricity_no_supply",
    name: "No power at home",
    short_description:
      "Call your DISCOM. BRPL and BYPL pages cite DERC: individual no-supply complaints should be restored within 2 hours.",
    sort_order: 1,
  },
  {
    slug: "electricity_live_wire",
    name: "Live / fallen wire",
    short_description: "Stay away. Call 112 / 101 first",
    sort_order: 2,
  },
  {
    slug: "electricity_fire",
    name: "Electrical fire / smoke",
    short_description: "Call 101 / 112 first",
    sort_order: 3,
  },
  {
    slug: "electricity_meter_sparking",
    name: "Meter sparking",
    short_description: "Electrical safety. Emergency if immediate danger",
    sort_order: 4,
  },
  {
    slug: "electricity_wrong_bill",
    name: "Wrong bill concern",
    short_description: "Use billing / customer-care channels",
    sort_order: 5,
  },
  {
    slug: "electricity_power_theft_report",
    name: "Report suspected power theft",
    short_description: "Dedicated theft channel. Do not confront anyone",
    sort_order: 6,
  },
  {
    slug: "electricity_new_connection",
    name: "New electricity connection",
    short_description: "Official DISCOM new-connection channel",
    sort_order: 7,
  },
  {
    slug: "electricity_streetlight",
    name: "Streetlight outage",
    short_description: "Streetlight channel where verified",
    sort_order: 8,
  },
  {
    slug: "electricity_other",
    name: "Something else (electricity)",
    short_description: "DISCOM still needs confirmation",
    sort_order: 9,
  },
];

export const FALLBACK_ELECTRICITY_ASSESSMENT: AssessmentQuestion[] = [
  {
    question_key: "live_wire_or_fallen_conductor",
    question_text:
      "Is there a live wire, fallen conductor, or exposed energized cable nearby?",
    sort_order: 1,
    explanation:
      "Stay away. Do not touch. Call 112 / 101 and the DISCOM emergency channel if verified.",
  },
  {
    question_key: "electrical_fire_or_smoke",
    question_text:
      "Is there electrical fire, smoke, or burning smell from electrical equipment right now?",
    sort_order: 2,
    explanation: "Call 101 / 112 first. Do not attempt repairs.",
  },
  {
    question_key: "electrocution_or_shock_risk",
    question_text:
      "Has anyone been shocked, or is there an immediate shock risk to people?",
    sort_order: 3,
    explanation: "Immediate shock risk is an emergency — call 112.",
  },
  {
    question_key: "meter_sparking_now",
    question_text: "Is a meter or electrical panel sparking right now?",
    sort_order: 4,
    explanation:
      "Sparking with immediate danger: call 112 / 101 and DISCOM emergency if verified.",
  },
  {
    question_key: "immediate_danger_people",
    question_text:
      "Is there an immediate danger to people from this electrical situation?",
    sort_order: 5,
    explanation:
      "Immediate danger requires emergency services before any normal complaint.",
  },
];

function ch(
  partial: AuthorityChannel & { purpose?: string }
): AuthorityChannel & { purpose?: string } {
  return partial;
}

export const FALLBACK_ELECTRICITY_ROUTING: RoutedAuthority[] = [
  {
    slug: "brpl",
    name: "BSES Rajdhani Power Limited (BRPL)",
    short_description:
      "Candidate DISCOM for BRPL areas. Confirm from bill. GPS does not prove provider.",
    official_website: "https://www.bsesdelhi.com/web/brpl",
    emergency_number: "011-49516707",
    confidence: "needs_confirmation",
    routing_mode: "needs_service_area",
    is_primary: false,
    notes: "Electricity provider needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "BRPL 24x7 toll-free",
        value: "19123",
        phone: "19123",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "phone",
        label: "BRPL no-supply",
        value: "19123",
        phone: "19123",
        purpose: "no_supply",
      }),
      ch({
        channel_type: "phone",
        label: "BRPL Emergency / Streetlight",
        value: "011-49516707",
        phone: "011-49516707",
        purpose: "fire_shock",
      }),
      ch({
        channel_type: "email",
        label: "BRPL customer care email",
        value: "brpl.customercare@reliancegroupindia.com",
        email: "brpl.customercare@reliancegroupindia.com",
        purpose: "email",
      }),
      ch({
        channel_type: "whatsapp",
        label: "BRPL WhatsApp",
        value: "8800919123",
        whatsapp: "8800919123",
        purpose: "whatsapp",
      }),
      ch({
        channel_type: "portal",
        label: "BRPL report power theft",
        value: "https://www.bsesdelhi.com/web/brpl/report-power-theft",
        action_url: "https://www.bsesdelhi.com/web/brpl/report-power-theft",
        purpose: "power_theft",
      }),
      ch({
        channel_type: "app",
        label: "BRPL Power App",
        value: "https://play.google.com/store/apps/details?id=com.bses.bsesapp",
        action_url:
          "https://play.google.com/store/apps/details?id=com.bses.bsesapp",
        purpose: "app",
      }),
      ch({
        channel_type: "website",
        label: "BRPL website",
        value: "https://www.bsesdelhi.com/web/brpl",
        action_url: "https://www.bsesdelhi.com/web/brpl",
        purpose: "web_portal",
      }),
    ],
  },
  {
    slug: "bypl",
    name: "BSES Yamuna Power Limited (BYPL)",
    short_description:
      "Candidate DISCOM for BYPL areas. Confirm from bill. GPS does not prove provider.",
    official_website: "https://www.bsesdelhi.com/web/bypl",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_service_area",
    is_primary: false,
    notes: "Electricity provider needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "BYPL 24x7 helpline",
        value: "19122",
        phone: "19122",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "phone",
        label: "BYPL no-supply",
        value: "19122",
        phone: "19122",
        purpose: "no_supply",
      }),
      ch({
        channel_type: "phone",
        label: "BYPL Streetlight Emergency",
        value: "011-41999808",
        phone: "011-41999808",
        purpose: "streetlight",
      }),
      ch({
        channel_type: "email",
        label: "BYPL customer care email",
        value: "bypl.customercare@reliancegroupindia.com",
        email: "bypl.customercare@reliancegroupindia.com",
        purpose: "email",
      }),
      ch({
        channel_type: "whatsapp",
        label: "BYPL WhatsApp",
        value: "8745999808",
        whatsapp: "8745999808",
        purpose: "whatsapp",
      }),
      ch({
        channel_type: "portal",
        label: "BYPL report power theft",
        value: "https://www.bsesdelhi.com/web/bypl/report-power-theft",
        action_url: "https://www.bsesdelhi.com/web/bypl/report-power-theft",
        purpose: "power_theft",
      }),
      ch({
        channel_type: "app",
        label: "BYPL Connect",
        value:
          "https://play.google.com/store/apps/details?id=com.bses.bypl.prod",
        action_url:
          "https://play.google.com/store/apps/details?id=com.bses.bypl.prod",
        purpose: "app",
      }),
    ],
  },
  {
    slug: "tpddl",
    name: "Tata Power-DDL (TPDDL)",
    short_description:
      "Candidate DISCOM for TPDDL areas. Confirm from bill. GPS does not prove provider.",
    official_website: "https://www.tatapower-ddl.com/",
    emergency_number: "19124",
    confidence: "needs_confirmation",
    routing_mode: "needs_service_area",
    is_primary: false,
    notes: "Electricity provider needs confirmation.",
    channels: [
      ch({
        channel_type: "phone",
        label: "TPDDL Sampark Kendra",
        value: "19124",
        phone: "19124",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "phone",
        label: "TPDDL no-supply",
        value: "19124",
        phone: "19124",
        purpose: "no_supply",
      }),
      ch({
        channel_type: "phone",
        label: "TPDDL alternate helpline",
        value: "1800-208-9124",
        phone: "1800-208-9124",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "email",
        label: "TPDDL customer care email",
        value: "customercare@tatapower-ddl.com",
        email: "customercare@tatapower-ddl.com",
        purpose: "email",
      }),
      ch({
        channel_type: "portal",
        label: "TPDDL online request / complaint",
        value:
          "https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx",
        action_url:
          "https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx",
        purpose: "web_portal",
      }),
      ch({
        channel_type: "portal",
        label: "TPDDL complaint status",
        value:
          "https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx",
        tracking_url:
          "https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx",
        purpose: "tracking",
      }),
      ch({
        channel_type: "app",
        label: "My Tata Power",
        value: "https://play.google.com/store/apps/details?id=com.sew.tatapower",
        action_url:
          "https://play.google.com/store/apps/details?id=com.sew.tatapower",
        purpose: "app",
      }),
    ],
  },
  {
    slug: "ndmc",
    name: "New Delhi Municipal Council (NDMC)",
    short_description:
      "NDMC electricity is separate from BRPL/BYPL/TPDDL. Confirm NDMC area. Use area-specific no-current centres.",
    official_website: "https://www.ndmc.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_service_area",
    is_primary: false,
    notes: "Electricity provider needs confirmation. No invented universal NDMC emergency number.",
    channels: [
      ch({
        channel_type: "portal",
        label: "NDMC No Current complaint centres",
        value:
          "https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx",
        action_url:
          "https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx",
        purpose: "no_supply",
      }),
      ch({
        channel_type: "phone",
        label: "NDMC toll-free complaints (1533)",
        value: "1533",
        phone: "1533",
        purpose: "general_customer_care",
      }),
      ch({
        channel_type: "website",
        label: "NDMC website",
        value: "https://www.ndmc.gov.in/",
        action_url: "https://www.ndmc.gov.in/",
        purpose: "web_portal",
      }),
    ],
  },
];

/** Minimal services for offline Step 7. */
export const FALLBACK_ELECTRICITY_SERVICES: Record<
  string,
  FallbackAuthorityService[]
> = {
  brpl: [
    {
      slug: "brpl_no_supply_helpline",
      service_name: "BRPL no-supply / customer care",
      description: "Call 19123. Confirm BRPL service area first.",
      service_type: "complaint",
      official_url: "https://www.bsesdelhi.com/web/brpl",
      filing_url: null,
      tracking_url: null,
      phone: "19123",
      integration_type: "phone",
      authority_slug: "brpl",
      fields: [],
    },
    {
      slug: "brpl_fire_shock_emergency",
      service_name: "BRPL Emergency / Streetlight",
      description: "011-49516707. Also call 112 / 101 for life-threatening emergencies.",
      service_type: "emergency",
      official_url: "https://www.bsesdelhi.com/web/brpl/contact-points",
      filing_url: null,
      tracking_url: null,
      phone: "011-49516707",
      integration_type: "phone",
      authority_slug: "brpl",
      fields: [],
    },
    {
      slug: "brpl_power_theft",
      service_name: "BRPL report power theft",
      description: "Official theft portal. Opening URL ≠ filed.",
      service_type: "complaint",
      official_url: "https://www.bsesdelhi.com/web/brpl/report-power-theft",
      filing_url: "https://www.bsesdelhi.com/web/brpl/report-power-theft",
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "brpl",
      fields: [],
    },
  ],
  bypl: [
    {
      slug: "bypl_no_supply_helpline",
      service_name: "BYPL no-supply / customer care",
      description: "Call 19122. Confirm BYPL service area first.",
      service_type: "complaint",
      official_url: "https://www.bsesdelhi.com/web/bypl",
      filing_url: null,
      tracking_url: null,
      phone: "19122",
      integration_type: "phone",
      authority_slug: "bypl",
      fields: [],
    },
    {
      slug: "bypl_power_theft",
      service_name: "BYPL report power theft",
      description: "Official theft portal.",
      service_type: "complaint",
      official_url: "https://www.bsesdelhi.com/web/bypl/report-power-theft",
      filing_url: "https://www.bsesdelhi.com/web/bypl/report-power-theft",
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "bypl",
      fields: [],
    },
  ],
  tpddl: [
    {
      slug: "tpddl_online_complaint",
      service_name: "TPDDL online request / complaint",
      description: "Citizen files on official site — this app does not file for you.",
      service_type: "complaint",
      official_url:
        "https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx",
      filing_url:
        "https://www.tatapower-ddl.com/customer/complaint/online-complaint.aspx",
      tracking_url:
        "https://www.tatapower-ddl.com/customer/complaint/view-current-status.aspx",
      phone: "19124",
      integration_type: "deep_link",
      authority_slug: "tpddl",
      fields: [],
    },
  ],
  ndmc: [
    {
      slug: "ndmc_no_current_centres",
      service_name: "NDMC No Current complaint centres",
      description: "Area-specific centres on official NDMC page.",
      service_type: "complaint",
      official_url:
        "https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx",
      filing_url:
        "https://www.ndmc.gov.in/departments/electricity_nocurrent_complaint.aspx",
      tracking_url: null,
      phone: null,
      integration_type: "deep_link",
      authority_slug: "ndmc",
      fields: [],
    },
  ],
};
