/**
 * Resolve a human issue label that belongs to the current category only.
 * Never show a stale slug from another category (e.g. women under police,
 * garbage under electricity).
 */

import { animalsGroupForIssueSlug } from "../data/animalsKnowledge";
import { buildingGroupForIssueSlug } from "../data/buildingKnowledge";
import { constructionGroupForIssueSlug } from "../data/constructionKnowledge";
import { FALLBACK_ELECTRICITY_ISSUE_TYPES } from "../data/electricityFallback";
import { environmentGroupForIssueSlug } from "../data/environmentKnowledge";
import { policeGroupForIssueSlug } from "../data/policeHelpFallback";
import {
  REPORT_CATEGORIES,
  type ReportCategoryId,
} from "../data/reportCategories";
import { roadsGroupForIssueSlug } from "../data/roadsPublicSpacesKnowledge";
import { wasteGroupForIssueSlug } from "../data/wasteGarbageKnowledge";
import { waterGroupForIssueSlug } from "../data/waterDrainageKnowledge";
import { womenGroupForIssueSlug } from "../data/womenSafetyFallback";

function electricityLabel(slug: string | null): string | null {
  if (!slug) return null;
  const row = FALLBACK_ELECTRICITY_ISSUE_TYPES.find((t) => t.slug === slug);
  return row?.name ?? null;
}

/**
 * Label for the selected issue inside `categoryId`.
 * If the slug does not belong to that category, returns the category
 * description instead of a misleading foreign label.
 */
export function resolveIssueLabel(
  categoryId: ReportCategoryId | null | undefined,
  issueTypeSlug: string | null | undefined
): string {
  const category = REPORT_CATEGORIES.find((c) => c.id === categoryId);
  const fallback = category?.description ?? "Reported concern";
  const slug = issueTypeSlug?.trim() || null;
  if (!categoryId || !slug) return fallback;

  let matched: string | null = null;
  switch (categoryId) {
    case "women_safety":
      matched = womenGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "police_help":
      matched = policeGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "building":
      matched = buildingGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "construction":
      matched = constructionGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "fire_safety":
      // Fire uses free-text includes, not typed group slugs.
      matched = slug.startsWith("fire") ? slug.replace(/_/g, " ") : null;
      break;
    case "electricity":
      matched = electricityLabel(slug);
      break;
    case "water_drainage":
      matched = waterGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "waste_garbage":
      matched = wasteGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "roads_public":
      matched = roadsGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "environment":
      matched = environmentGroupForIssueSlug(slug)?.label ?? null;
      break;
    case "animals":
      matched = animalsGroupForIssueSlug(slug)?.label ?? null;
      break;
    default:
      matched = null;
  }

  return matched ?? fallback;
}
