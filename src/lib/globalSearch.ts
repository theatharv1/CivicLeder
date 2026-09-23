/**
 * Global offline (+ optional Supabase) search across issues, services, rights, knowledge.
 * Does not force complaint flow for rights/services hits.
 */

import { REPORT_CATEGORIES, type ReportCategoryId } from "../data/reportCategories";
import { ENVIRONMENT_GROUPS } from "../data/environmentKnowledge";
import { ENVIRONMENT_RIGHTS_SOURCE } from "../data/environmentKnowledge";
import { FALLBACK_OFFICIAL_SERVICES_CATALOG } from "../data/environmentFallback";
import { WASTE_GARBAGE_GROUPS } from "../data/wasteGarbageKnowledge";
import { WATER_DRAINAGE_GROUPS } from "../data/waterDrainageKnowledge";
import { ROADS_PUBLIC_SPACES_GROUPS } from "../data/roadsPublicSpacesKnowledge";
import { ELECTRICITY_KNOWLEDGE_CARDS } from "../data/electricityKnowledge";
import { supabase, supabaseConfigured } from "./supabase";

export type GlobalSearchKind =
  | "category"
  | "issue"
  | "service"
  | "right"
  | "knowledge"
  | "app"
  | "emergency"
  | "grievance";

export type GlobalSearchHit = {
  id: string;
  kind: GlobalSearchKind;
  title: string;
  subtitle: string;
  /** Soft language for suggestions */
  confidenceLabel: "may be" | "related" | "official";
  categoryId?: ReportCategoryId;
  issueSlug?: string;
  url?: string | null;
  phone?: string | null;
  playStoreUrl?: string | null;
  appStoreUrl?: string | null;
};

const OFFLINE_RIGHTS: GlobalSearchHit[] = [
  {
    id: "right_noise",
    kind: "right",
    title: "Report noise pollution",
    subtitle: "NGMS portal or helpline 155271 — not DPCC homepage first",
    confidenceLabel: "official",
    url: ENVIRONMENT_RIGHTS_SOURCE.ngms,
    phone: "155271",
  },
  {
    id: "right_trees",
    kind: "right",
    title: "Report tree / wildlife concern",
    subtitle: "Forest grievance portal and Green Helpline 1800-11-8600",
    confidenceLabel: "official",
    url: ENVIRONMENT_RIGHTS_SOURCE.forestGrievance,
    phone: "1800118600",
  },
  {
    id: "right_pollution",
    kind: "right",
    title: "Report pollution via Green Delhi",
    subtitle: "Green Delhi App / portal for air and related pollution",
    confidenceLabel: "official",
    url: ENVIRONMENT_RIGHTS_SOURCE.greenDelhi,
    playStoreUrl: ENVIRONMENT_RIGHTS_SOURCE.greenDelhiPlay,
    appStoreUrl: ENVIRONMENT_RIGHTS_SOURCE.greenDelhiIos,
  },
  {
    id: "right_reference",
    kind: "knowledge",
    title: "Keep official references",
    subtitle: "MD-###### is only your CivicLeder ID — save the authority’s number",
    confidenceLabel: "related",
  },
];

const OFFLINE_KNOWLEDGE: GlobalSearchHit[] = [
  {
    id: "know_not_all_dpcc",
    kind: "knowledge",
    title: "Not all environment → DPCC",
    subtitle: "Noise → NGMS; trees → Forest; air → Green Delhi",
    confidenceLabel: "related",
    categoryId: "environment",
  },
  {
    id: "know_cross_waste",
    kind: "knowledge",
    title: "Garbage collection belongs under Waste",
    subtitle: "Missed collection / dumping usually Waste & Garbage, not Environment",
    confidenceLabel: "may be",
    categoryId: "waste_garbage",
  },
  {
    id: "know_cross_water",
    kind: "knowledge",
    title: "Household water / sewer belongs under Water",
    subtitle: "Supply, sewer blockage, drainage waterlogging → Water & Drainage",
    confidenceLabel: "may be",
    categoryId: "water_drainage",
  },
  ...ELECTRICITY_KNOWLEDGE_CARDS.slice(0, 2).map((c) => ({
    id: `know_elec_${c.id}`,
    kind: "knowledge" as const,
    title: c.title,
    subtitle: c.body.slice(0, 120),
    confidenceLabel: "related" as const,
    categoryId: "electricity" as ReportCategoryId,
    url: c.sourceUrl,
  })),
];

function groupHits(
  categoryId: ReportCategoryId,
  groups: { id: string; label: string; description: string; representativeSlug: string }[]
): GlobalSearchHit[] {
  return groups.map((g) => ({
    id: `issue_${categoryId}_${g.id}`,
    kind: "issue" as const,
    title: g.label,
    subtitle: g.description,
    confidenceLabel: "may be" as const,
    categoryId,
    issueSlug: g.representativeSlug,
  }));
}

function offlineCatalog(): GlobalSearchHit[] {
  const categories: GlobalSearchHit[] = REPORT_CATEGORIES.filter(
    (c) => c.id !== "something_else"
  ).map((c) => ({
    id: `cat_${c.id}`,
    kind: "category",
    title: c.title,
    subtitle: c.description,
    confidenceLabel: "may be",
    categoryId: c.id,
  }));

  const issues = [
    ...groupHits("environment", ENVIRONMENT_GROUPS),
    ...groupHits("waste_garbage", WASTE_GARBAGE_GROUPS),
    ...groupHits("water_drainage", WATER_DRAINAGE_GROUPS),
    ...groupHits("roads_public", ROADS_PUBLIC_SPACES_GROUPS),
  ];

  const services: GlobalSearchHit[] = FALLBACK_OFFICIAL_SERVICES_CATALOG.map(
    (s) => ({
      id: `svc_${s.slug}`,
      kind: s.play_store_url || s.app_store_url ? "app" : "service",
      title: s.name,
      subtitle: `${s.organization} — ${s.purpose.replace(/_/g, " ")}`,
      confidenceLabel: "official",
      url: s.official_url,
      phone: s.phone,
      playStoreUrl: s.play_store_url,
      appStoreUrl: s.app_store_url,
    })
  );

  const emergency: GlobalSearchHit[] = [
    {
      id: "em_112",
      kind: "emergency",
      title: "Call 112 — All emergencies",
      subtitle: "Immediate danger to people",
      confidenceLabel: "official",
      phone: "112",
    },
    {
      id: "em_101",
      kind: "emergency",
      title: "Call 101 — Fire & Rescue",
      subtitle: "Fire or rescue emergency",
      confidenceLabel: "official",
      phone: "101",
    },
  ];

  const grievance: GlobalSearchHit[] = [
    {
      id: "grievance_cm",
      kind: "grievance",
      title: "CM Jan Sunwai (general grievance)",
      subtitle:
        "Fallback when no specialized channel fits — opens official portal only",
      confidenceLabel: "official",
      url: ENVIRONMENT_RIGHTS_SOURCE.cmJanSunwai,
    },
  ];

  return [
    ...categories,
    ...issues,
    ...services,
    ...OFFLINE_RIGHTS,
    ...OFFLINE_KNOWLEDGE,
    ...emergency,
    ...grievance,
  ];
}

function scoreHit(query: string, hit: GlobalSearchHit): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const hay = `${hit.title} ${hit.subtitle} ${hit.kind} ${hit.issueSlug ?? ""} ${
    hit.categoryId ?? ""
  }`.toLowerCase();
  if (hay.includes(q)) return 10;
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const tok of tokens) {
    if (hay.includes(tok)) score += 3;
  }
  return score;
}

export function searchOffline(query: string, limit = 20): GlobalSearchHit[] {
  const catalog = offlineCatalog();
  const q = query.trim();
  if (!q) return catalog.slice(0, limit);
  return catalog
    .map((hit) => ({ hit, score: scoreHit(q, hit) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.hit);
}

/** Suggest category/issue/authority with soft “may be” language from free text. */
export function suggestFromFreeText(text: string): GlobalSearchHit[] {
  const q = text.toLowerCase();
  const suggestions: GlobalSearchHit[] = [];
  if (/noise|dj|loud|speaker|generator/.test(q)) {
    suggestions.push({
      id: "sug_noise",
      kind: "issue",
      title: "Noise pollution",
      subtitle: "May be Environment → Noise / NGMS",
      confidenceLabel: "may be",
      categoryId: "environment",
      issueSlug: "noise_pollution_concern",
      url: ENVIRONMENT_RIGHTS_SOURCE.ngms,
    });
  }
  if (/tree|forest|cutting|wildlife|monkey|snake/.test(q)) {
    suggestions.push({
      id: "sug_forest",
      kind: "issue",
      title: "Trees / wildlife",
      subtitle: "May be Environment → Forest grievance",
      confidenceLabel: "may be",
      categoryId: "environment",
      issueSlug: "tree_cutting_damage",
      url: ENVIRONMENT_RIGHTS_SOURCE.forestGrievance,
    });
  }
  if (/pollution|smoke|dust|smog|air quality/.test(q)) {
    suggestions.push({
      id: "sug_air",
      kind: "issue",
      title: "Air pollution",
      subtitle: "May be Environment → Green Delhi",
      confidenceLabel: "may be",
      categoryId: "environment",
      issueSlug: "air_pollution_concern",
      url: ENVIRONMENT_RIGHTS_SOURCE.greenDelhi,
    });
  }
  if (/garbage|dump|litter|bin|waste|burning/.test(q)) {
    suggestions.push({
      id: "sug_waste",
      kind: "category",
      title: "Waste & Garbage",
      subtitle: "May be a waste / collection / dumping issue",
      confidenceLabel: "may be",
      categoryId: "waste_garbage",
    });
  }
  if (/water|sewer|drain|waterlog|flood|tap/.test(q)) {
    suggestions.push({
      id: "sug_water",
      kind: "category",
      title: "Water & Drainage",
      subtitle: "May be supply, sewer, drain or waterlogging",
      confidenceLabel: "may be",
      categoryId: "water_drainage",
    });
  }
  if (/pothole|road|footpath|streetlight|park|signal/.test(q)) {
    suggestions.push({
      id: "sug_roads",
      kind: "category",
      title: "Roads & Public Spaces",
      subtitle: "May be a roads / footpath / park issue",
      confidenceLabel: "may be",
      categoryId: "roads_public",
    });
  }
  if (/electric|wire|power|outage|light bill|discom/.test(q)) {
    suggestions.push({
      id: "sug_elec",
      kind: "category",
      title: "Electricity",
      subtitle: "May be an electricity / DISCOM issue",
      confidenceLabel: "may be",
      categoryId: "electricity",
    });
  }
  if (/fire|exit|extinguisher/.test(q)) {
    suggestions.push({
      id: "sug_fire",
      kind: "category",
      title: "Fire Safety",
      subtitle: "May be a fire safety concern",
      confidenceLabel: "may be",
      categoryId: "fire_safety",
    });
  }
  if (/building|property|illegal construction|unauthorized/.test(q)) {
    suggestions.push({
      id: "sug_building",
      kind: "category",
      title: "Building",
      subtitle: "May be a building / property concern",
      confidenceLabel: "may be",
      categoryId: "building",
    });
  }
  if (/construction|demolition|site|scaffold/.test(q)) {
    suggestions.push({
      id: "sug_construction",
      kind: "category",
      title: "Construction",
      subtitle: "May be a construction / site concern",
      confidenceLabel: "may be",
      categoryId: "construction",
    });
  }
  if (!suggestions.length) {
    suggestions.push({
      id: "sug_none",
      kind: "grievance",
      title: "No clear match",
      subtitle: "You can browse categories or open CM Jan Sunwai as a general fallback",
      confidenceLabel: "may be",
      url: ENVIRONMENT_RIGHTS_SOURCE.cmJanSunwai,
    });
  }
  return suggestions;
}

export async function searchGlobal(
  query: string,
  limit = 20
): Promise<GlobalSearchHit[]> {
  const offline = searchOffline(query, limit);
  if (!supabaseConfigured || !supabase || !query.trim()) {
    return offline;
  }

  try {
    const q = `%${query.trim()}%`;
    const extras: GlobalSearchHit[] = [];

    const { data: types } = await supabase
      .from("issue_types")
      .select("slug, name, short_description, category_id")
      .eq("active", true)
      .or(`name.ilike.${q},short_description.ilike.${q},slug.ilike.${q}`)
      .limit(8);

    if (types?.length) {
      for (const row of types) {
        extras.push({
          id: `db_type_${row.slug}`,
          kind: "issue",
          title: row.name,
          subtitle: row.short_description ?? row.slug,
          confidenceLabel: "may be",
          issueSlug: row.slug,
        });
      }
    }

    const { data: services } = await supabase
      .from("official_services")
      .select(
        "slug, name, description, official_url, tracking_url, phone, play_store_url, app_store_url, purpose"
      )
      .eq("active", true)
      .or(`name.ilike.${q},description.ilike.${q},purpose.ilike.${q}`)
      .limit(8);

    if (services?.length) {
      for (const row of services) {
        extras.push({
          id: `db_svc_${row.slug}`,
          kind: "service",
          title: row.name,
          subtitle: row.description ?? row.purpose ?? "Official service",
          confidenceLabel: "official",
          url: row.official_url,
          phone: row.phone,
          playStoreUrl: row.play_store_url,
          appStoreUrl: row.app_store_url,
        });
      }
    }

    const { data: rights } = await supabase
      .from("citizen_rights")
      .select("slug, title, short_description, official_action_url")
      .eq("active", true)
      .or(`title.ilike.${q},short_description.ilike.${q}`)
      .limit(6);

    if (rights?.length) {
      for (const row of rights) {
        extras.push({
          id: `db_right_${row.slug}`,
          kind: "right",
          title: row.title,
          subtitle: row.short_description ?? "Citizen right / guidance",
          confidenceLabel: "official",
          url: row.official_action_url,
        });
      }
    }

    const merged = [...extras, ...offline];
    const seen = new Set<string>();
    const unique: GlobalSearchHit[] = [];
    for (const hit of merged) {
      const key = `${hit.kind}:${hit.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(hit);
      if (unique.length >= limit) break;
    }
    return unique;
  } catch {
    return offline;
  }
}
