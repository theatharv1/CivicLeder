/**
 * Police help and lost-property guidance — official Delhi Police portals only.
 * Lost Report ≠ theft FIR. User opens their site themselves.
 */

import type { IssueTypeRow } from "./emergencyFallback";
import type { RoutedAuthority } from "./routingFallback";

export const POLICE_HELP_GROUPS = [
  {
    label: "Lost document or article",
    description:
      "Use Delhi Police Lost Report when something is lost (not stolen).",
    representativeSlug: "police_lost_report",
  },
  {
    label: "Property stolen",
    description: "Use Delhi Police property theft e-FIR on their official site.",
    representativeSlug: "police_property_theft",
  },
  {
    label: "Cyber fraud or online crime",
    description: "Delhi Police lists cyber complaints on 1930.",
    representativeSlug: "police_cyber_1930",
  },
  {
    label: "Crime happening now",
    description: "Call 112. Do not use websites first.",
    representativeSlug: "police_danger_now",
  },
  {
    label: "Something else (police)",
    description: "Open Delhi Police citizen services and choose the right form.",
    representativeSlug: "police_other",
  },
] as const;

export const FALLBACK_POLICE_HELP_ISSUE_TYPES: IssueTypeRow[] =
  POLICE_HELP_GROUPS.map((g, i) => ({
    slug: g.representativeSlug,
    name: g.label,
    short_description: g.description,
    sort_order: i + 1,
  }));

export function policeGroupForIssueSlug(slug: string | null) {
  return POLICE_HELP_GROUPS.find((g) => g.representativeSlug === slug) ?? null;
}

export function isPoliceHelpEmergencyIssue(slug: string | null): boolean {
  return slug === "police_danger_now";
}

export const LOST_REPORT_URL = "https://lostfound.delhipolice.gov.in/";
export const PROPERTY_THEFT_URL = "https://propertytheft.delhipolice.gov.in/";
export const DELHI_POLICE_HOME = "https://delhipolice.gov.in/";

export const FALLBACK_POLICE_HELP_ROUTING: RoutedAuthority[] = [
  {
    slug: "delhi_police",
    name: "Delhi Police",
    short_description:
      "Official lost report and property theft e-FIR portals. This app does not file for you.",
    official_website: DELHI_POLICE_HOME,
    emergency_number: "112",
    confidence: "likely",
    routing_mode: "likely",
    is_primary: true,
    notes: "Open the matching portal yourself.",
    channels: [
      {
        channel_type: "phone",
        label: "All emergencies",
        value: "112",
        phone: "112",
        purpose: "emergency",
        priority: 1,
      },
      {
        channel_type: "website",
        label: "Lost Report (lost, not stolen)",
        value: LOST_REPORT_URL,
        action_url: LOST_REPORT_URL,
        purpose: "lost_report",
        priority: 2,
      },
      {
        channel_type: "website",
        label: "Property theft e-FIR",
        value: PROPERTY_THEFT_URL,
        action_url: PROPERTY_THEFT_URL,
        purpose: "property_theft",
        priority: 3,
      },
      {
        channel_type: "phone",
        label: "Cyber complaints",
        value: "1930",
        phone: "1930",
        purpose: "cyber",
        priority: 4,
      },
    ],
  },
];
