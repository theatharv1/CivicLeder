import {
  FALLBACK_BUILDING_ASSESSMENT,
  FALLBACK_BUILDING_ISSUE_TYPES,
  FALLBACK_CONSTRUCTION_ASSESSMENT,
  FALLBACK_CONSTRUCTION_ISSUE_TYPES,
  FALLBACK_EMERGENCY_CONTACTS,
  FALLBACK_FIRE_ASSESSMENT,
  type AssessmentQuestion,
  type EmergencyContact,
  type IssueTypeRow,
} from "../data/emergencyFallback";
import {
  FALLBACK_ELECTRICITY_ASSESSMENT,
  FALLBACK_ELECTRICITY_ISSUE_TYPES,
} from "../data/electricityFallback";
import {
  FALLBACK_WATER_DRAINAGE_ASSESSMENT,
  FALLBACK_WATER_DRAINAGE_ISSUE_TYPES,
} from "../data/waterDrainageFallback";
import {
  FALLBACK_WASTE_GARBAGE_ASSESSMENT,
  FALLBACK_WASTE_GARBAGE_ISSUE_TYPES,
} from "../data/wasteGarbageFallback";
import {
  FALLBACK_ROADS_PUBLIC_SPACES_ASSESSMENT,
  FALLBACK_ROADS_PUBLIC_SPACES_ISSUE_TYPES,
} from "../data/roadsPublicSpacesFallback";
import {
  FALLBACK_ENVIRONMENT_ASSESSMENT,
  FALLBACK_ENVIRONMENT_ISSUE_TYPES,
} from "../data/environmentFallback";
import { api, apiConfigured } from "./apiClient";

function dbCategorySlug(categorySlug: string): string {
  if (categorySlug === "roads_public") return "roads_public_spaces";
  return categorySlug;
}

function offlineAssessment(categorySlug: string): AssessmentQuestion[] {
  if (categorySlug === "fire_safety") return FALLBACK_FIRE_ASSESSMENT;
  if (categorySlug === "building") return FALLBACK_BUILDING_ASSESSMENT;
  if (categorySlug === "construction") return FALLBACK_CONSTRUCTION_ASSESSMENT;
  if (categorySlug === "electricity") return FALLBACK_ELECTRICITY_ASSESSMENT;
  if (categorySlug === "water_drainage") return FALLBACK_WATER_DRAINAGE_ASSESSMENT;
  if (categorySlug === "waste_garbage") return FALLBACK_WASTE_GARBAGE_ASSESSMENT;
  if (categorySlug === "roads_public" || categorySlug === "roads_public_spaces") {
    return FALLBACK_ROADS_PUBLIC_SPACES_ASSESSMENT;
  }
  if (categorySlug === "environment") return FALLBACK_ENVIRONMENT_ASSESSMENT;
  return [];
}

function offlineIssueTypes(categorySlug: string): IssueTypeRow[] {
  if (categorySlug === "building") return FALLBACK_BUILDING_ISSUE_TYPES;
  if (categorySlug === "construction") return FALLBACK_CONSTRUCTION_ISSUE_TYPES;
  if (categorySlug === "electricity") return FALLBACK_ELECTRICITY_ISSUE_TYPES;
  if (categorySlug === "water_drainage") return FALLBACK_WATER_DRAINAGE_ISSUE_TYPES;
  if (categorySlug === "waste_garbage") return FALLBACK_WASTE_GARBAGE_ISSUE_TYPES;
  if (categorySlug === "roads_public" || categorySlug === "roads_public_spaces") {
    return FALLBACK_ROADS_PUBLIC_SPACES_ISSUE_TYPES;
  }
  if (categorySlug === "environment") return FALLBACK_ENVIRONMENT_ISSUE_TYPES;
  return [];
}

export async function fetchEmergencyContacts(
  region = "delhi"
): Promise<EmergencyContact[]> {
  if (!apiConfigured) return FALLBACK_EMERGENCY_CONTACTS;
  const result = await api.getEmergencyContacts(region);
  if (!result.ok || !result.data.length) return FALLBACK_EMERGENCY_CONTACTS;
  return result.data.map((row) => ({
    number: String(row.number ?? ""),
    label: String(row.label ?? ""),
    description: (row.description as string | null) ?? null,
    sort_order: Number(row.sortOrder ?? row.sort_order ?? 0),
    source_name: (row.sourceName as string | null) ?? (row.source_name as string | null) ?? null,
    source_url: (row.sourceUrl as string | null) ?? (row.source_url as string | null) ?? null,
  }));
}

export async function fetchAssessmentQuestions(
  categorySlug: string
): Promise<AssessmentQuestion[]> {
  if (!apiConfigured) return offlineAssessment(categorySlug);
  const result = await api.getAssessment(dbCategorySlug(categorySlug));
  if (!result.ok || !result.data.length) return offlineAssessment(categorySlug);
  return result.data.map((row) => ({
    question_key: String(row.questionKey ?? row.question_key ?? ""),
    question_text: String(row.questionText ?? row.question_text ?? ""),
    sort_order: Number(row.sortOrder ?? row.sort_order ?? 0),
    explanation: (row.explanation as string | null) ?? null,
  }));
}

export async function fetchIssueTypesForCategory(
  categorySlug: string
): Promise<IssueTypeRow[]> {
  if (!apiConfigured) return offlineIssueTypes(categorySlug);
  const result = await api.getIssueTypes(dbCategorySlug(categorySlug));
  if (!result.ok || !result.data.length) return offlineIssueTypes(categorySlug);
  return result.data.map((row) => ({
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    short_description:
      (row.shortDescription as string | null) ??
      (row.short_description as string | null) ??
      null,
    sort_order: Number(row.sortOrder ?? row.sort_order ?? 0),
  }));
}

export type AssessmentAnswer = "yes" | "no" | "not_sure";
export type EmergencyResult = "emergency" | "not_emergency" | "uncertain";

/** Deterministic result from Not sure questionnaire answers. */
export function evaluateAssessment(
  answers: Record<string, AssessmentAnswer>
): EmergencyResult {
  const values = Object.values(answers);
  if (values.length === 0) return "uncertain";
  if (values.some((a) => a === "yes")) return "emergency";
  if (values.every((a) => a === "no")) return "not_emergency";
  return "uncertain";
}
