/**
 * Central HTTP client for CivicLeder backend (replaces direct Supabase access).
 * Set EXPO_PUBLIC_API_URL for local/dev (e.g. http://192.168.x.x:3000/api/v1).
 * Release builds must still reach production if Metro did not inline .env.
 */

type ExpoPublicEnv = {
  EXPO_PUBLIC_API_URL?: string;
};

/** Production API — used when env is missing (common in local Gradle release APKs). */
export const DEFAULT_API_URL = "https://api.civicleder.in/api/v1";

const env = (globalThis as { process?: { env?: ExpoPublicEnv } }).process?.env;
const fromEnv = (env?.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");

/** Optional: app.config.js extra.apiUrl (EAS / Expo Constants). */
function fromExpoExtra(): string {
  try {
    // Lazy require so tests / metro don't fail if expo-constants isn't ready.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require("expo-constants").default as {
      expoConfig?: { extra?: { apiUrl?: string } };
    };
    return (Constants.expoConfig?.extra?.apiUrl ?? "").trim().replace(/\/$/, "");
  } catch {
    return "";
  }
}

const baseUrl = fromEnv || fromExpoExtra() || DEFAULT_API_URL;

export const apiConfigured = Boolean(baseUrl);
export const apiBaseUrl = baseUrl;

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!apiConfigured) {
    return { ok: false, error: "API not configured" };
  }
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(init?.headers ?? {}),
      },
    });
    const json = (await res.json()) as ApiSuccess<T> | ApiFailure;
    if (!res.ok || !json.success) {
      const msg =
        !json.success && json.error?.message
          ? json.error.message
          : `Request failed (${res.status})`;
      return { ok: false, error: msg };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export const api = {
  getEmergencyContacts: (region = "delhi") =>
    request<Record<string, unknown>[]>(
      `/emergency/contacts?region=${encodeURIComponent(region)}`
    ),

  getIssueTypes: (categorySlug: string) =>
    request<Record<string, unknown>[]>(
      `/categories/${encodeURIComponent(categorySlug)}/issue-types`
    ),

  getAssessment: (categorySlug: string) =>
    request<Record<string, unknown>[]>(
      `/categories/${encodeURIComponent(categorySlug)}/assessment`
    ),

  getRouting: (categorySlug: string, issueTypeSlug?: string | null) => {
    const q = new URLSearchParams({ categorySlug });
    if (issueTypeSlug) q.set("issueTypeSlug", issueTypeSlug);
    return request<{
      category: unknown;
      rules: unknown[];
      channels: unknown[];
    }>(`/routing?${q.toString()}`);
  },

  getAuthorityServices: (slug: string) =>
    request<{ authority: unknown; services: unknown[] }>(
      `/authorities/${encodeURIComponent(slug)}/services`
    ),

  search: (q: string) =>
    request<{
      issueTypes: unknown[];
      officialServices: unknown[];
      citizenRights: unknown[];
    }>(`/search?q=${encodeURIComponent(q)}`),

  nextCaseId: () => request<{ caseId: string }>("/cases/next-id", { method: "POST" }),

  upsertReport: (body: Record<string, unknown>) =>
    request<{ id: string; caseId: string }>("/reports", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getReportsByCaseIds: (caseIds: string[]) =>
    request<Record<string, unknown>[]>(
      `/reports?caseIds=${encodeURIComponent(caseIds.join(","))}`
    ),

  createReportLocation: (body: Record<string, unknown>) =>
    request<unknown>("/reports/locations", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createComplaint: (body: Record<string, unknown>) =>
    request<unknown>("/reports/complaints", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createCaseUpdate: (body: Record<string, unknown>) =>
    request<unknown>("/reports/updates", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listCommunityTips: (categorySlug?: string) => {
    const q = categorySlug
      ? `?categorySlug=${encodeURIComponent(categorySlug)}`
      : "";
    return request<Record<string, unknown>[]>(`/community-tips${q}`);
  },

  submitCommunityTip: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>("/community-tips", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  voteCommunityTip: (
    tipId: string,
    body: { deviceHash: string; vote: "agree" | "disagree" }
  ) =>
    request<{
      status: string;
      agree_count: number;
      disagree_count: number;
    }>(`/community-tips/${encodeURIComponent(tipId)}/vote`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  uploadEvidence: async (
    form: FormData
  ): Promise<{ ok: true; data: { storagePath: string } } | { ok: false; error: string }> => {
    if (!apiConfigured) return { ok: false, error: "API not configured" };
    try {
      const res = await fetch(`${baseUrl}/evidence`, {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as
        | ApiSuccess<{ storagePath: string }>
        | ApiFailure;
      if (!res.ok || !json.success) {
        return {
          ok: false,
          error:
            !json.success && json.error?.message
              ? json.error.message
              : "Upload failed",
        };
      }
      return { ok: true, data: json.data };
    } catch {
      return { ok: false, error: "Network error" };
    }
  },
};
