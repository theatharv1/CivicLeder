import {
  FALLBACK_BUILDING_ROUTING,
  FALLBACK_CONSTRUCTION_ROUTING,
  FALLBACK_FIRE_ROUTING,
  type AuthorityChannel,
  type RoutedAuthority,
  type RoutingConfidence,
} from "../data/routingFallback";
import { FALLBACK_ANIMALS_ROUTING } from "../data/animalsFallback";
import { FALLBACK_ELECTRICITY_ROUTING } from "../data/electricityFallback";
import { FALLBACK_WATER_DRAINAGE_ROUTING } from "../data/waterDrainageFallback";
import { FALLBACK_WASTE_GARBAGE_ROUTING } from "../data/wasteGarbageFallback";
import { FALLBACK_ROADS_PUBLIC_SPACES_ROUTING } from "../data/roadsPublicSpacesFallback";
import { FALLBACK_ENVIRONMENT_ROUTING } from "../data/environmentFallback";
import { api, apiConfigured } from "./apiClient";

/** Map app category ids to DB slugs where they differ. */
function dbCategorySlug(categorySlug: string): string[] {
  if (categorySlug === "roads_public") {
    return ["roads_public", "roads_public_spaces"];
  }
  return [categorySlug];
}

function offlineFallback(categorySlug: string): RoutedAuthority[] {
  if (categorySlug === "fire_safety") return FALLBACK_FIRE_ROUTING;
  if (categorySlug === "building") return FALLBACK_BUILDING_ROUTING;
  if (categorySlug === "construction") return FALLBACK_CONSTRUCTION_ROUTING;
  if (categorySlug === "electricity") return FALLBACK_ELECTRICITY_ROUTING;
  if (categorySlug === "water_drainage") return FALLBACK_WATER_DRAINAGE_ROUTING;
  if (categorySlug === "waste_garbage") return FALLBACK_WASTE_GARBAGE_ROUTING;
  if (categorySlug === "roads_public" || categorySlug === "roads_public_spaces") {
    return FALLBACK_ROADS_PUBLIC_SPACES_ROUTING;
  }
  if (categorySlug === "environment") {
    return FALLBACK_ENVIRONMENT_ROUTING;
  }
  if (categorySlug === "animals") {
    return FALLBACK_ANIMALS_ROUTING;
  }
  return [];
}

function mapConfidence(raw: unknown): RoutingConfidence {
  if (raw === "likely" || raw === "possible" || raw === "needs_confirmation") {
    return raw;
  }
  return "possible";
}

function mapChannel(ch: {
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
  requires_login?: boolean | null;
  requires_otp?: boolean | null;
  requires_captcha?: boolean | null;
  instructions?: string | null;
}): AuthorityChannel {
  return {
    channel_type: ch.channel_type,
    label: ch.label,
    value: ch.value,
    action_url: ch.action_url ?? null,
    tracking_url: ch.tracking_url ?? null,
    email: ch.email ?? (ch.channel_type === "email" ? ch.value : null),
    whatsapp:
      ch.whatsapp ?? (ch.channel_type === "whatsapp" ? ch.value : null),
    phone: ch.phone ?? (ch.channel_type === "phone" ? ch.value : null),
    purpose: ch.purpose ?? null,
    priority: ch.priority ?? null,
    geography: ch.geography ?? null,
    requires_login: Boolean(ch.requires_login),
    requires_otp: Boolean(ch.requires_otp),
    requires_captcha: Boolean(ch.requires_captcha),
    instructions: ch.instructions ?? null,
  };
}

/** Prefer verified action_url from channels; never invent URLs. */
export function channelActionUrl(
  channels: AuthorityChannel[]
): string | null {
  const withAction = channels.find((c) => Boolean(c.action_url));
  return withAction?.action_url ?? null;
}

export function channelTrackingUrl(
  channels: AuthorityChannel[]
): string | null {
  const withTrack = channels.find((c) => Boolean(c.tracking_url));
  return withTrack?.tracking_url ?? null;
}

export function channelPhone(channels: AuthorityChannel[]): string | null {
  const row = channels.find(
    (c) => c.channel_type === "phone" || Boolean(c.phone)
  );
  return row?.phone ?? (row?.channel_type === "phone" ? row.value : null);
}

export function channelEmail(channels: AuthorityChannel[]): string | null {
  const row = channels.find(
    (c) => c.channel_type === "email" || Boolean(c.email)
  );
  return row?.email ?? (row?.channel_type === "email" ? row.value : null);
}

export function channelWhatsapp(channels: AuthorityChannel[]): string | null {
  const row = channels.find(
    (c) => c.channel_type === "whatsapp" || Boolean(c.whatsapp)
  );
  return row?.whatsapp ?? (row?.channel_type === "whatsapp" ? row.value : null);
}

export function channelWebsite(channels: AuthorityChannel[]): string | null {
  const row = channels.find(
    (c) =>
      c.channel_type === "website" ||
      c.channel_type === "portal"
  );
  return row?.value ?? null;
}

export function whatsappUrl(number: string): string {
  const digits = number.replace(/\D/g, "");
  const withCountry =
    digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

export async function fetchLikelyAuthorities(
  categorySlug: string
): Promise<RoutedAuthority[]> {
  if (!apiConfigured) {
    return offlineFallback(categorySlug);
  }

  const slug = dbCategorySlug(categorySlug)[0];
  const result = await api.getRouting(slug);
  if (!result.ok) return offlineFallback(categorySlug);

  const rules = (result.data.rules ?? []) as Record<string, unknown>[];
  const channels = (result.data.channels ?? []) as Record<string, unknown>[];
  if (!rules.length) return offlineFallback(categorySlug);

  const channelMap = new Map<string, AuthorityChannel[]>();
  for (const ch of channels) {
    const authId = String(ch.authorityId ?? ch.authority_id ?? "");
    const list = channelMap.get(authId) ?? [];
    list.push(
      mapChannel({
        channel_type: String(ch.channelType ?? ch.channel_type ?? "other"),
        label: (ch.label as string | null) ?? null,
        value: String(ch.value ?? ""),
        action_url:
          (ch.actionUrl as string | null) ??
          (ch.action_url as string | null) ??
          null,
        tracking_url:
          (ch.trackingUrl as string | null) ??
          (ch.tracking_url as string | null) ??
          null,
        email: null,
        whatsapp: null,
        phone:
          ch.channelType === "phone" || ch.channel_type === "phone"
            ? String(ch.value ?? "")
            : null,
        purpose: null,
        priority: null,
        geography: null,
        requires_login: null,
        requires_otp: null,
        requires_captcha: null,
        instructions: null,
      })
    );
    channelMap.set(authId, list);
  }

  const mapped: RoutedAuthority[] = [];
  for (const rule of rules) {
    const auth = rule.authority as Record<string, unknown> | undefined;
    if (!auth?.slug) continue;
    const authorityId = String(rule.authorityId ?? rule.authority_id ?? "");
    mapped.push({
      slug: String(auth.slug),
      name: String(auth.name ?? ""),
      short_description:
        (auth.shortDescription as string | null) ??
        (auth.short_description as string | null) ??
        null,
      official_website:
        (auth.officialWebsite as string | null) ??
        (auth.official_website as string | null) ??
        null,
      emergency_number:
        (auth.emergencyNumber as string | null) ??
        (auth.emergency_number as string | null) ??
        null,
      confidence: mapConfidence(rule.confidence),
      routing_mode: String(rule.routingMode ?? rule.routing_mode ?? "conditional"),
      is_primary: Boolean(rule.isPrimary ?? rule.is_primary),
      notes: (rule.notes as string | null) ?? null,
      channels: channelMap.get(authorityId) ?? [],
    });
  }

  mapped.sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    const rank = (c: RoutingConfidence) =>
      c === "likely" ? 0 : c === "possible" ? 1 : 2;
    if (a.confidence !== b.confidence) {
      return rank(a.confidence) - rank(b.confidence);
    }
    return a.name.localeCompare(b.name);
  });

  return mapped.length ? mapped : offlineFallback(categorySlug);
}

/**
 * Most-likely authority for auto-highlight.
 * Never treats needs_confirmation / needs_service_area as automatic primary.
 */
export function pickPrimaryAuthority(
  list: RoutedAuthority[]
): RoutedAuthority | null {
  const primary = list.find(
    (a) =>
      a.is_primary &&
      a.routing_mode !== "needs_service_area" &&
      a.routing_mode !== "needs_confirmation" &&
      a.confidence !== "needs_confirmation" &&
      (a.confidence === "likely" || a.routing_mode === "likely")
  );
  if (primary) return primary;
  const likely = list.find(
    (a) =>
      a.confidence === "likely" &&
      a.routing_mode !== "needs_service_area" &&
      a.routing_mode !== "needs_confirmation"
  );
  return likely ?? null;
}

/** Cap "other possible" list when a primary exists (Step 6). */
export function pickAlternativeAuthorities(
  list: RoutedAuthority[],
  primary: RoutedAuthority | null,
  limit = 2
): RoutedAuthority[] {
  const others = list.filter((a) => a.slug !== primary?.slug);
  if (primary) return others.slice(0, limit);
  // No primary (e.g. Building) — show confirmation options (capped)
  return others.slice(0, Math.max(limit, 3));
}

/**
 * Apply optional Building propertyContext hint (citizen-selected, not GPS).
 * Sets hinted authority as first "likely" display candidate without claiming proof.
 */
export function applyPropertyContextHint(
  list: RoutedAuthority[],
  authoritySlug: string | null
): {
  likely: RoutedAuthority | null;
  alternatives: RoutedAuthority[];
  ordered: RoutedAuthority[];
} {
  if (!list.length) {
    return { likely: null, alternatives: [], ordered: [] };
  }
  if (!authoritySlug) {
    return {
      likely: null,
      alternatives: list.slice(0, 4),
      ordered: list,
    };
  }
  const likely = list.find((a) => a.slug === authoritySlug) ?? null;
  const alternatives = list
    .filter((a) => a.slug !== authoritySlug)
    .slice(0, 2);
  const ordered = likely
    ? [likely, ...list.filter((a) => a.slug !== likely.slug)]
    : list;
  return { likely, alternatives, ordered };
}

export function jurisdictionNeedsConfirmation(
  list: RoutedAuthority[],
  primary: RoutedAuthority | null
): boolean {
  if (primary) return false;
  return list.some(
    (a) =>
      a.confidence === "needs_confirmation" ||
      a.routing_mode === "needs_confirmation" ||
      a.routing_mode === "needs_service_area"
  );
}

/**
 * Filter channels by purpose for reason-specific Step 7 actions.
 * Falls back to general_customer_care / web_portal / any phone if no match.
 */
export function filterChannelsByPurpose(
  channels: AuthorityChannel[],
  purpose: string
): AuthorityChannel[] {
  const exact = channels.filter((c) => c.purpose === purpose);
  if (exact.length) return exact;
  const fallbacks = channels.filter((c) =>
    ["general_customer_care", "web_portal", "app"].includes(c.purpose ?? "")
  );
  return fallbacks.length ? fallbacks : channels;
}

/** Best phone for a purpose (reason-specific). */
export function channelPhoneForPurpose(
  channels: AuthorityChannel[],
  purpose: string
): string | null {
  const filtered = filterChannelsByPurpose(channels, purpose);
  return channelPhone(filtered) ?? channelPhone(channels);
}

/** Best action URL for a purpose. */
export function channelActionUrlForPurpose(
  channels: AuthorityChannel[],
  purpose: string
): string | null {
  const filtered = filterChannelsByPurpose(channels, purpose);
  return channelActionUrl(filtered) ?? channelActionUrl(channels);
}
