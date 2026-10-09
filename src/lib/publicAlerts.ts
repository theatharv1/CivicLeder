import { apiBaseUrl, apiConfigured } from "./apiClient";
import { getDeviceHash } from "./deviceId";
import { publicAlertSafetyMessage } from "./publicAlertSafety";
import type { ReportCategoryId } from "../data/reportCategories";

/**
 * Public alerts live on the CivicLeder API so everyone nearby sees them.
 * Nothing is kept only on this phone: if the server can't be reached we say so.
 */

export const ALERT_TYPES = [
  {
    id: "unsafe_spot",
    label: "Unsafe spot",
    hint: "Isolated stretch, harassment happens here, feels unsafe at night.",
    reportCategory: "women_safety",
    reportLabel: "Get help: women safety",
  },
  {
    id: "dark_street",
    label: "Dark street",
    hint: "Streetlight broken or off.",
    reportCategory: "electricity",
    reportLabel: "Report broken streetlight",
  },
  {
    id: "live_wire",
    label: "Live wire",
    hint: "Hanging or sparking wire, open meter box.",
    reportCategory: "electricity",
    reportLabel: "Report to the power company",
  },
  {
    id: "open_drain",
    label: "Open drain / manhole",
    hint: "Uncovered drain, missing manhole cover.",
    reportCategory: "water_drainage",
    reportLabel: "Report open drain",
  },
  {
    id: "waterlogging",
    label: "Waterlogging",
    hint: "Flooded road or underpass.",
    reportCategory: "water_drainage",
    reportLabel: "Report waterlogging",
  },
  {
    id: "garbage",
    label: "Garbage",
    hint: "Overflowing bins, dumping, burning.",
    reportCategory: "waste_garbage",
    reportLabel: "Report garbage",
  },
  {
    id: "other",
    label: "Something else",
    hint: "Anything else people nearby should know.",
    reportCategory: "something_else",
    reportLabel: "Report to the right office",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  hint: string;
  reportCategory: ReportCategoryId;
  reportLabel: string;
}[];

export type PublicAlertType = (typeof ALERT_TYPES)[number]["id"];

export function alertTypeInfo(type: string) {
  return ALERT_TYPES.find((t) => t.id === type) ?? ALERT_TYPES[ALERT_TYPES.length - 1]!;
}

/** Photo is optional only where taking one could be unsafe or impossible. */
export function photoRequiredFor(type: PublicAlertType | null): boolean {
  return type !== null && type !== "unsafe_spot" && type !== "dark_street";
}

export type PublicAlert = {
  id: string;
  type: PublicAlertType;
  placeName: string;
  description: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  areaLabel: string | null;
  createdAt: string;
  /** People who saw it, including the person who posted it. */
  seenTotal: number;
  goneCount: number;
  confirmed: boolean;
  isMine: boolean;
  myVote: "seen" | "gone" | null;
  distanceMeters: number | null;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

type ApiAlert = Omit<PublicAlert, "photoUrl"> & { hasPhoto: boolean };

function fromApi(a: ApiAlert): PublicAlert {
  return {
    ...a,
    type: alertTypeInfo(a.type).id,
    photoUrl: a.hasPhoto
      ? `${apiBaseUrl}/public-alerts/${encodeURIComponent(a.id)}/photo`
      : null,
  };
}

const OFFLINE = "Can't reach CivicLeder right now. Check your internet and try again.";

async function call<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  if (!apiConfigured) return { ok: false, error: OFFLINE };
  try {
    const deviceHash = await getDeviceHash();
    const res = await fetch(`${apiBaseUrl}/public-alerts${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "X-Device-Hash": deviceHash,
        ...(init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(init?.headers ?? {}),
      },
    });
    let json: { success: true; data: T } | { success: false; error?: { message?: string } };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      if (!res.ok) {
        return {
          ok: false,
          error:
            res.status === 429
              ? "Too many requests. Wait a bit and try again."
              : OFFLINE,
        };
      }
      return { ok: false, error: OFFLINE };
    }
    if (!res.ok || !json.success) {
      const msg =
        !json.success && json.error?.message
          ? json.error.message
          : res.status === 429
            ? "Too many requests. Wait a bit and try again."
            : "Something went wrong. Try again.";
      return { ok: false, error: msg };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: OFFLINE };
  }
}

export async function listPublicAlerts(near?: {
  latitude: number;
  longitude: number;
} | null): Promise<Result<PublicAlert[]>> {
  // Empty path → GET /public-alerts (Express treats trailing "/" the same).
  const path = near
    ? `?lat=${near.latitude.toFixed(5)}&lng=${near.longitude.toFixed(5)}`
    : "";
  const r = await call<ApiAlert[]>(path);
  return r.ok ? { ok: true, data: r.data.map(fromApi) } : r;
}

/** Same kind of alert already posted within ~75 m. */
export async function findNearbyDuplicates(input: {
  type: PublicAlertType;
  latitude: number;
  longitude: number;
}): Promise<PublicAlert[]> {
  const r = await call<ApiAlert[]>(
    `/nearby?type=${input.type}&lat=${input.latitude.toFixed(6)}&lng=${input.longitude.toFixed(6)}`
  );
  return r.ok ? r.data.map(fromApi) : [];
}

export type PostPublicAlertInput = {
  type: PublicAlertType | null;
  placeName: string;
  description: string;
  photoUri: string | null;
  latitude: number | null;
  longitude: number | null;
  areaLabel: string | null;
};

export function validatePublicAlertInput(input: PostPublicAlertInput): string | null {
  if (!input.type) return "Pick what kind of problem this is.";
  if (photoRequiredFor(input.type) && !input.photoUri) {
    return "Add a photo so others can recognise the spot.";
  }
  if (input.placeName.trim().length < 2) {
    return "Add a short place name so others recognise the spot.";
  }
  if (input.description.trim().length < 8) {
    return "Describe what you saw (at least a few words).";
  }
  const safety =
    publicAlertSafetyMessage(input.description) ||
    publicAlertSafetyMessage(input.placeName);
  if (safety) return safety;
  if (input.latitude == null || input.longitude == null) {
    return "Current location is required. Allow GPS and retry.";
  }
  return null;
}

function photoPart(uri: string) {
  const ext = (uri.split("?")[0]!.split(".").pop() || "jpg").toLowerCase();
  const type =
    ext === "png" ? "image/png" : ext === "heic" ? "image/heic" : ext === "webp" ? "image/webp" : "image/jpeg";
  // React Native's FormData accepts { uri, name, type } for file parts.
  return { uri, name: `alert.${ext}`, type } as unknown as Blob;
}

export async function postPublicAlert(
  input: PostPublicAlertInput
): Promise<Result<PublicAlert>> {
  const err = validatePublicAlertInput(input);
  if (err) return { ok: false, error: err };
  const form = new FormData();
  form.append("deviceHash", await getDeviceHash());
  form.append("type", input.type!);
  form.append("placeName", input.placeName.trim());
  form.append("description", input.description.trim());
  form.append("latitude", String(input.latitude));
  form.append("longitude", String(input.longitude));
  if (input.areaLabel) form.append("areaLabel", input.areaLabel);
  if (input.photoUri) form.append("photo", photoPart(input.photoUri));
  const r = await call<ApiAlert>("/", { method: "POST", body: form });
  return r.ok ? { ok: true, data: fromApi(r.data) } : r;
}

export async function voteOnAlert(
  id: string,
  vote: "seen" | "gone"
): Promise<Result<PublicAlert>> {
  const r = await call<ApiAlert>(`/${encodeURIComponent(id)}/vote`, {
    method: "POST",
    body: JSON.stringify({ deviceHash: await getDeviceHash(), vote }),
  });
  return r.ok ? { ok: true, data: fromApi(r.data) } : r;
}

export async function flagAlert(id: string): Promise<Result<{ hidden: boolean }>> {
  return call(`/${encodeURIComponent(id)}/flag`, {
    method: "POST",
    body: JSON.stringify({ deviceHash: await getDeviceHash(), reason: "wrong_or_abusive" }),
  });
}

export async function deletePublicAlert(id: string): Promise<Result<{ deleted: boolean }>> {
  return call(`/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function distanceLabel(m: number | null): string | null {
  if (m == null) return null;
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m away`;
  return `${(m / 1000).toFixed(1)} km away`;
}
