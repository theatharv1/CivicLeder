import type { IssueTypeRow } from "./emergencyFallback";
import type { RoutedAuthority } from "./routingFallback";
import { MCD311_CREATE, MCD311_TRACK } from "./mcd311Urls";

export const FALLBACK_ANIMALS_ISSUE_TYPES: IssueTypeRow[] = [
  {
    slug: "animals_cattle_on_road",
    name: "Cattle / animals on road",
    short_description: "Animals blocking or risking traffic",
    sort_order: 1,
  },
  {
    slug: "animals_aggressive_dogs",
    name: "Aggressive stray dogs",
    short_description: "Dogs that may bite — keep distance",
    sort_order: 2,
  },
  {
    slug: "animals_dog_sterilisation",
    name: "Dog sterilisation request",
    short_description: "Ask municipal team via official app",
    sort_order: 3,
  },
  {
    slug: "animals_dead_removal",
    name: "Dead animal removal",
    short_description: "Dead animal on road or public place",
    sort_order: 4,
  },
  {
    slug: "animals_other",
    name: "Something else (animals)",
    short_description: "Other animal-related concern",
    sort_order: 5,
  },
];

export const FALLBACK_ANIMALS_ROUTING: RoutedAuthority[] = [
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi (MCD)",
    short_description:
      "Likely for stray cattle, dog-related requests and dead-animal removal in most MCD areas.",
    official_website: "https://mcdonline.nic.in/",
    emergency_number: null,
    confidence: "likely",
    routing_mode: "likely",
    is_primary: true,
    notes:
      "Use MCD 311 app or 155305. Attack in progress — call 112 first. Not every area is MCD (NDMC / Cantonment differ).",
    channels: [
      {
        channel_type: "phone",
        label: "MCD helpline",
        value: "155305",
        phone: "155305",
        purpose: "civic_complaint",
        priority: 1,
      },
      {
        channel_type: "app",
        label: "MCD 311",
        value: "MCD311",
        action_url:
          "https://play.google.com/store/apps/details?id=com.mcddelhi.mcd311",
        purpose: "civic_complaint",
        priority: 2,
      },
      {
        channel_type: "website",
        label: "MCD Online / MCD311",
        value: "https://mcdonline.nic.in/",
        action_url: MCD311_CREATE,
        tracking_url: MCD311_TRACK,
        purpose: "civic_complaint",
        priority: 3,
      },
    ],
  },
];
