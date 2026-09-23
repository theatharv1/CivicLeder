/**
 * Animals / stray — daily Delhi citizen path (MCD 311 etc.).
 * Keep groups few and plain.
 */

import type { CitizenTip } from "./buildingKnowledge";

export type AnimalsGroup = {
  id: string;
  label: string;
  description: string;
  representativeSlug: string;
};

export const ANIMALS_GROUPS: AnimalsGroup[] = [
  {
    id: "cattle_road",
    label: "Cattle / animals on road",
    description: "Risk of crash, especially at night",
    representativeSlug: "animals_cattle_on_road",
  },
  {
    id: "aggressive_dogs",
    label: "Aggressive stray dogs",
    description: "Pack or dog that may bite",
    representativeSlug: "animals_aggressive_dogs",
  },
  {
    id: "sterilisation",
    label: "Dog sterilisation request",
    description: "Ask municipal team via official app",
    representativeSlug: "animals_dog_sterilisation",
  },
  {
    id: "dead_animal",
    label: "Dead animal on road / park",
    description: "Needs municipal removal",
    representativeSlug: "animals_dead_removal",
  },
  {
    id: "other",
    label: "Something else (animals)",
    description: "Other animal-related public concern",
    representativeSlug: "animals_other",
  },
];

export function animalsGroupForIssueSlug(
  slug: string | null
): AnimalsGroup | null {
  if (!slug) return null;
  const direct = ANIMALS_GROUPS.find(
    (g) => g.representativeSlug === slug || g.id === slug
  );
  if (direct) return direct;
  if (slug.includes("cattle") || slug.includes("road")) {
    return ANIMALS_GROUPS.find((g) => g.id === "cattle_road") ?? null;
  }
  if (
    slug.includes("aggress") ||
    slug.includes("bite") ||
    slug.includes("dog")
  ) {
    return ANIMALS_GROUPS.find((g) => g.id === "aggressive_dogs") ?? null;
  }
  if (slug.includes("steril")) {
    return ANIMALS_GROUPS.find((g) => g.id === "sterilisation") ?? null;
  }
  if (slug.includes("dead")) {
    return ANIMALS_GROUPS.find((g) => g.id === "dead_animal") ?? null;
  }
  return ANIMALS_GROUPS.find((g) => g.id === "other") ?? null;
}

export const ANIMALS_EMERGENCY_ISSUE_SLUGS = new Set([
  "animals_aggressive_dogs",
  "animals_attack_in_progress",
]);

export function isAnimalsEmergencyIssue(slug: string | null): boolean {
  if (!slug) return false;
  return ANIMALS_EMERGENCY_ISSUE_SLUGS.has(slug);
}

export const ANIMALS_CITIZEN_TIPS: CitizenTip[] = [
  {
    id: "mcd_311",
    title: "Where do animal complaints go?",
    plain:
      "In most Delhi neighbourhoods, MCD 311 / helpline 155305 takes stray cattle, dog-related and dead-animal complaints. NDMC areas use NDMC channels.",
    whenToAct:
      "Attack happening now — call 112. Otherwise open the official municipal app after this guide.",
    whereLabel: "MCD Online",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "do_not_confront",
    title: "Do not confront animals yourself",
    plain:
      "Trying to catch, chase or harm animals can make the situation worse and is not the municipal process.",
    whenToAct: "Keep distance, move children away, then use the official channel.",
    whereLabel: "Emergency 112 if attack",
    whereUrl: "https://112.gov.in/",
  },
];
