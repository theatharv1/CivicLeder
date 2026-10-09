/**
 * Women safety guidance — helplines from official directories.
 * This app does not file complaints. Danger first: 112.
 */

import type { IssueTypeRow } from "./emergencyFallback";
import type { RoutedAuthority } from "./routingFallback";

export const WOMEN_SAFETY_GROUPS = [
  {
    label: "In danger right now",
    description: "Call 112 first. Stay where you feel safer if you can.",
    representativeSlug: "women_danger_now",
  },
  {
    label: "Need police help (Delhi)",
    description: "Delhi Police women helpline 1091 from official directory.",
    representativeSlug: "women_police_1091",
  },
  {
    label: "Need support and referral",
    description: "National Women Helpline 181 (WCD scheme).",
    representativeSlug: "women_helpline_181",
  },
  {
    label: "Something else (safety)",
    description: "We still show verified emergency numbers.",
    representativeSlug: "women_other",
  },
] as const;

export const FALLBACK_WOMEN_SAFETY_ISSUE_TYPES: IssueTypeRow[] =
  WOMEN_SAFETY_GROUPS.map((g, i) => ({
    slug: g.representativeSlug,
    name: g.label,
    short_description: g.description,
    sort_order: i + 1,
  }));

export function womenGroupForIssueSlug(slug: string | null) {
  return WOMEN_SAFETY_GROUPS.find((g) => g.representativeSlug === slug) ?? null;
}

export function isWomenSafetyEmergencyIssue(slug: string | null): boolean {
  return slug === "women_danger_now";
}

export const FALLBACK_WOMEN_SAFETY_ROUTING: RoutedAuthority[] = [
  {
    slug: "delhi_police_women",
    name: "Delhi Police and women helplines",
    short_description:
      "Verified helplines for women in distress. Not a filing portal inside this app.",
    official_website: "https://delhipolice.gov.in/telephonedirectory",
    emergency_number: "112",
    confidence: "likely",
    routing_mode: "likely",
    is_primary: true,
    notes: "Call yourself. Sources listed under Essential numbers.",
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
        channel_type: "phone",
        label: "Women in distress (Delhi Police)",
        value: "1091",
        phone: "1091",
        purpose: "women_police",
        priority: 2,
      },
      {
        channel_type: "phone",
        label: "Women Helpline 181",
        value: "181",
        phone: "181",
        purpose: "women_support",
        priority: 3,
      },
      {
        channel_type: "website",
        label: "Delhi Police directory",
        value: "https://delhipolice.gov.in/telephonedirectory",
        action_url: "https://delhipolice.gov.in/telephonedirectory",
      },
    ],
  },
];
