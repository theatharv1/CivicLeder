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
import { supabase, supabaseConfigured } from "./supabase";

/** Map app category ids to DB slugs where they differ. */
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
  if (!supabaseConfigured || !supabase) {
    return FALLBACK_EMERGENCY_CONTACTS;
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .select(
      "number, label, description, sort_order, source_name, source_url"
    )
    .eq("region", region)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return FALLBACK_EMERGENCY_CONTACTS;
  }

  return data as EmergencyContact[];
}

export async function fetchAssessmentQuestions(
  categorySlug: string
): Promise<AssessmentQuestion[]> {
  if (!supabaseConfigured || !supabase) {
    return offlineAssessment(categorySlug);
  }

  const dbSlug = dbCategorySlug(categorySlug);
  const { data: category, error: catErr } = await supabase
    .from("issue_categories")
    .select("id")
    .eq("slug", dbSlug)
    .eq("active", true)
    .maybeSingle();

  if (catErr || !category?.id) {
    return offlineAssessment(categorySlug);
  }

  const { data, error } = await supabase
    .from("emergency_rules")
    .select("question_key, question_text, sort_order, explanation")
    .eq("category_id", category.id)
    .eq("rule_kind", "assessment_question")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return offlineAssessment(categorySlug);
  }

  return data as AssessmentQuestion[];
}

export async function fetchIssueTypesForCategory(
  categorySlug: string
): Promise<IssueTypeRow[]> {
  if (!supabaseConfigured || !supabase) {
    return offlineIssueTypes(categorySlug);
  }

  const dbSlug = dbCategorySlug(categorySlug);
  const { data: category } = await supabase
    .from("issue_categories")
    .select("id")
    .eq("slug", dbSlug)
    .eq("active", true)
    .maybeSingle();

  if (!category?.id) {
    return offlineIssueTypes(categorySlug);
  }

  const { data, error } = await supabase
    .from("issue_types")
    .select("slug, name, short_description, sort_order")
    .eq("category_id", category.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return offlineIssueTypes(categorySlug);
  }
  return data as IssueTypeRow[];
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
