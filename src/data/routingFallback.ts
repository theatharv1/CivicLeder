/** Offline fallback for fire-safety routing when Supabase is unavailable. */

export type AuthorityChannel = {
  channel_type: string;
  label: string | null;
  value: string;
  action_url?: string | null;
  tracking_url?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  purpose?: string | null;
  priority?: number | null;
  geography?: string | null;
  requires_login?: boolean;
  requires_otp?: boolean;
  requires_captcha?: boolean;
  instructions?: string | null;
};

export type RoutingConfidence = "likely" | "possible" | "needs_confirmation";

export type RoutedAuthority = {
  slug: string;
  name: string;
  short_description: string | null;
  official_website: string | null;
  emergency_number: string | null;
  confidence: RoutingConfidence;
  routing_mode: string;
  is_primary: boolean;
  notes: string | null;
  channels: AuthorityChannel[];
};

export const FALLBACK_FIRE_ROUTING: RoutedAuthority[] = [
  {
    slug: "delhi_fire_service",
    name: "Delhi Fire Services",
    short_description:
      "Handles fire safety, fire hazards, emergency response and fire safety compliance.",
    official_website: "https://dfs.delhi.gov.in/",
    emergency_number: "101",
    confidence: "likely",
    routing_mode: "likely",
    is_primary: true,
    notes:
      "Likely authority for many fire-safety concerns in Delhi. Needs confirmation.",
    channels: [
      {
        channel_type: "phone",
        label: "Fire Control Room",
        value: "101",
        phone: "101",
      },
      {
        channel_type: "website",
        label: "Official website",
        value: "https://dfs.delhi.gov.in/",
      },
    ],
  },
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "May be involved if the issue is related to building safety or building concerns.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "possible",
    routing_mode: "conditional",
    is_primary: false,
    notes: "Conditional alternative — not all building matters are MCD.",
    channels: [
      {
        channel_type: "phone",
        label: "Citizen Call Center",
        value: "155305",
        phone: "155305",
      },
      {
        channel_type: "website",
        label: "MCD Online",
        value: "https://mcdonline.nic.in/",
      },
    ],
  },
  {
    slug: "pwd_delhi",
    name: "Public Works Department (PWD)",
    short_description:
      "May be relevant for public buildings and government infrastructure.",
    official_website: "https://pwd.delhi.gov.in/",
    emergency_number: null,
    confidence: "possible",
    routing_mode: "conditional",
    is_primary: false,
    notes: "PWD assets only — not all sites.",
    channels: [
      {
        channel_type: "website",
        label: "Official website",
        value: "https://pwd.delhi.gov.in/",
      },
    ],
  },
  {
    slug: "delhi_police",
    name: "Delhi Police",
    short_description:
      "For immediate danger, law and order issues, or if the situation requires police assistance.",
    official_website: "https://delhipolice.gov.in/",
    emergency_number: "100",
    confidence: "possible",
    routing_mode: "conditional",
    is_primary: false,
    notes: "Prefer 112/100 in emergencies.",
    channels: [
      {
        channel_type: "phone",
        label: "Police emergency",
        value: "100",
        phone: "100",
      },
      {
        channel_type: "website",
        label: "Official website",
        value: "https://delhipolice.gov.in/",
      },
    ],
  },
];

/** Offline Building routing — jurisdiction always needs confirmation. */
export const FALLBACK_BUILDING_ROUTING: RoutedAuthority[] = [
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "Municipal civic authority for many MCD areas. Building issues are NOT automatically MCD.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes:
      "Jurisdiction needs confirmation. MCD is one possible authority — not automatic for all Building reports.",
    channels: [
      {
        channel_type: "phone",
        label: "Citizen Call Center",
        value: "155305",
        phone: "155305",
      },
      {
        channel_type: "email",
        label: "MCD IT / helpdesk email",
        value: "mcd-ithelpdesk@mcd.nic.in",
        email: "mcd-ithelpdesk@mcd.nic.in",
      },
      {
        channel_type: "website",
        label: "MCD Online",
        value: "https://mcdonline.nic.in/",
        action_url:
          "https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120",
        tracking_url:
          "https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120",
      },
    ],
  },
  {
    slug: "ndmc",
    name: "New Delhi Municipal Council (NDMC)",
    short_description:
      "Civic authority for NDMC area only — jurisdiction needs confirmation.",
    official_website: "https://www.ndmc.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Jurisdiction needs confirmation. NDMC may apply only in NDMC area.",
    channels: [
      {
        channel_type: "phone",
        label: "NDMC civic helpline",
        value: "1533",
        phone: "1533",
      },
      {
        channel_type: "email",
        label: "NDMC care email",
        value: "care@ndmc.gov.in",
        email: "care@ndmc.gov.in",
      },
      {
        channel_type: "whatsapp",
        label: "NDMC WhatsApp",
        value: "8588887773",
        whatsapp: "8588887773",
      },
      {
        channel_type: "website",
        label: "NDMC website",
        value: "https://www.ndmc.gov.in/",
        action_url: "https://www.ndmc.gov.in/complaints.aspx",
      },
    ],
  },
  {
    slug: "dda",
    name: "Delhi Development Authority (DDA)",
    short_description:
      "May apply for some building / development concerns in DDA areas.",
    official_website: "https://dda.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes:
      "Jurisdiction needs confirmation. DDA may apply in DDA areas.",
    channels: [
      {
        channel_type: "phone",
        label: "DDA toll-free",
        value: "1800110332",
        phone: "1800110332",
      },
      {
        channel_type: "email",
        label: "DDA Grievance Redressal email",
        value: "dirsagr@dda.org.in",
        email: "dirsagr@dda.org.in",
      },
      {
        channel_type: "website",
        label: "DDA website",
        value: "https://dda.gov.in/",
        action_url: "https://dda.gov.in/grievance",
      },
    ],
  },
  {
    slug: "delhi_cantonment",
    name: "Delhi Cantonment Board",
    short_description:
      "May apply for concerns inside Delhi Cantonment limits.",
    official_website: "https://delhi.cantt.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes:
      "Jurisdiction needs confirmation. Cantonment Board may apply inside Cantonment limits.",
    channels: [
      {
        channel_type: "phone",
        label: "Cantonment Board phone",
        value: "25693837",
        phone: "25693837",
      },
      {
        channel_type: "phone",
        label: "Cantonment Board phone (alt)",
        value: "25695450",
        phone: "25695450",
      },
      {
        channel_type: "email",
        label: "CEO Delhi Cantt email",
        value: "ceodelhicantt@gmail.com",
        email: "ceodelhicantt@gmail.com",
      },
      {
        channel_type: "website",
        label: "Delhi Cantonment Board website",
        value: "https://delhi.cantt.gov.in/",
      },
    ],
  },
];

/** Offline Construction routing — all needs_confirmation; never auto-MCD. */
export const FALLBACK_CONSTRUCTION_ROUTING: RoutedAuthority[] = [
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "One possible municipal authority for some Construction concerns in MCD areas — not automatic.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Jurisdiction needs confirmation. Never all Construction → MCD.",
    channels: [
      {
        channel_type: "phone",
        label: "Citizen Call Center",
        value: "155305",
        phone: "155305",
      },
      {
        channel_type: "website",
        label: "MCD Online",
        value: "https://mcdonline.nic.in/",
        action_url:
          "https://mcd.everythingcivic.com/citizen/createissue?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120",
        tracking_url:
          "https://mcd.everythingcivic.com/citizen/issuedetail?app_id=U2FsdGVkX180J3mGnJmT5QpgtPjhfjtzyXAAccBUxGU%3D&api_key=e34ba86d3943bd6db9120313da011937189e6a9625170905750f649395bcd68312cf10d264c9305d57c23688cc2e5120",
      },
    ],
  },
  {
    slug: "ndmc",
    name: "New Delhi Municipal Council (NDMC)",
    short_description: "May apply only in NDMC area — needs confirmation.",
    official_website: "https://www.ndmc.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Jurisdiction needs confirmation.",
    channels: [
      {
        channel_type: "phone",
        label: "NDMC civic helpline",
        value: "1533",
        phone: "1533",
      },
      {
        channel_type: "website",
        label: "NDMC website",
        value: "https://www.ndmc.gov.in/",
        action_url: "https://www.ndmc.gov.in/complaints.aspx",
      },
    ],
  },
  {
    slug: "dpcc",
    name: "Delhi Pollution Control Committee (DPCC)",
    short_description:
      "May apply for dust / air / noise pollution concerns via Green Delhi.",
    official_website: "https://www.dpcc.delhigovt.nic.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Conditional — Green Delhi portal for pollution complaints.",
    channels: [
      {
        channel_type: "portal",
        label: "Green Delhi App / portal",
        value: "https://greendelhi.nic.in/",
        action_url: "https://greendelhi.nic.in/",
      },
    ],
  },
  {
    slug: "pwd_delhi",
    name: "Public Works Department (PWD)",
    short_description:
      "May apply when the road / public work is PWD-maintained — needs confirmation.",
    official_website: "https://www.pwddelhi.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Conditional — PWD Sewa 1908 / complaint@pwddelhi.gov.in.",
    channels: [
      {
        channel_type: "phone",
        label: "PWD Sewa toll-free",
        value: "1908",
        phone: "1908",
      },
      {
        channel_type: "email",
        label: "PWD complaint email",
        value: "complaint@pwddelhi.gov.in",
        email: "complaint@pwddelhi.gov.in",
      },
      {
        channel_type: "website",
        label: "PWD Delhi website",
        value: "https://www.pwddelhi.gov.in/",
        action_url: "https://www.pwddelhi.gov.in/sewa",
      },
    ],
  },
  {
    slug: "labour_delhi",
    name: "Labour Department (Delhi)",
    short_description:
      "May apply for reported worker-safety concerns — needs confirmation.",
    official_website: "https://labour.delhi.gov.in/",
    emergency_number: null,
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Shramik Helpline 155214 / labjlc2.delhi@nic.in.",
    channels: [
      {
        channel_type: "phone",
        label: "Shramik Helpline",
        value: "155214",
        phone: "155214",
      },
      {
        channel_type: "email",
        label: "Labour HQ grievance email",
        value: "labjlc2.delhi@nic.in",
        email: "labjlc2.delhi@nic.in",
      },
    ],
  },
  {
    slug: "delhi_fire_service",
    name: "Delhi Fire Services",
    short_description:
      "Emergency path for construction fire risk — Call 101 / 112.",
    official_website: "https://dfs.delhi.gov.in/",
    emergency_number: "101",
    confidence: "needs_confirmation",
    routing_mode: "needs_confirmation",
    is_primary: false,
    notes: "Reuse Fire Safety emergency path — do not invent portals.",
    channels: [
      {
        channel_type: "phone",
        label: "Fire Control Room",
        value: "101",
        phone: "101",
      },
    ],
  },
];
