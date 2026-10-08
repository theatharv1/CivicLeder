import * as Location from "expo-location";

export type GpsCapture = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  addressText: string | null;
};

export type CaptureGpsOptions = {
  accuracy?: "balanced" | "high";
};

/** Rough India bounding box. Rejects simulator / default US locations. */
export function isInIndia(lat: number, lng: number): boolean {
  return lat >= 6.5 && lat <= 37.5 && lng >= 68 && lng <= 97.5;
}

function formatPlace(p: Location.LocationGeocodedAddress): string {
  return [p.name, p.street, p.district, p.city, p.region]
    .filter(Boolean)
    .join(", ");
}

/** Short header label from a full reverse-geocode string. */
export function shortPlaceLabel(addressText: string | null | undefined): string {
  if (!addressText?.trim()) return "";
  const parts = addressText
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 2) return parts.join(", ");
  // Prefer locality + city (skip very long street lines when possible)
  return parts.slice(0, 2).join(", ");
}

export type GpsFailureReason =
  | "permission_denied"
  | "outside_india"
  | "unavailable";

/**
 * Request GPS. Returns null if permission denied, GPS fails, or location
 * is clearly outside India (e.g. Expo simulator default).
 */
export async function captureGps(
  options?: CaptureGpsOptions
): Promise<GpsCapture | null> {
  const result = await captureGpsDetailed(options);
  return result.ok ? result.gps : null;
}

export async function captureGpsDetailed(
  options?: CaptureGpsOptions
): Promise<
  | { ok: true; gps: GpsCapture }
  | { ok: false; reason: GpsFailureReason }
> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return { ok: false, reason: "permission_denied" };
    }
    const accuracy =
      options?.accuracy === "high"
        ? Location.Accuracy.High
        : Location.Accuracy.Balanced;
    const pos = await Location.getCurrentPositionAsync({ accuracy });
    const { latitude, longitude, accuracy: meters } = pos.coords;
    if (!isInIndia(latitude, longitude)) {
      return { ok: false, reason: "outside_india" };
    }
    let addressText: string | null = null;
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const p = places[0];
      if (p) {
        const country = (p.country || "").toLowerCase();
        if (
          country &&
          !country.includes("india") &&
          country !== "in" &&
          country !== "ind"
        ) {
          return { ok: false, reason: "outside_india" };
        }
        addressText = formatPlace(p) || null;
      }
    } catch {
      addressText = null;
    }
    return {
      ok: true,
      gps: {
        latitude,
        longitude,
        accuracyMeters: meters ?? null,
        addressText,
      },
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
