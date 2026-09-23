import { getDeviceHash } from "./deviceId";
import { storageGetItem, storageSetItem } from "./safeStorage";

const ALERTS_KEY = "civicleader.public_alerts.v1";
const VOTES_KEY = "civicleader.public_alert_votes.v1";

export type PublicAlert = {
  id: string;
  placeName: string;
  description: string;
  photoUri: string | null;
  latitude: number | null;
  longitude: number | null;
  areaLabel: string | null;
  createdAt: string;
  verifyCount: number;
  /** Local-only: this device posted it (never shown publicly). */
  isMine?: boolean;
  /** Local-only: this device already verified. */
  myVerified?: boolean;
  /** Nearby posts that look like the same spot (count of others). */
  nearbyCount?: number;
};

type StoredAlert = Omit<PublicAlert, "isMine" | "myVerified" | "nearbyCount"> & {
  authorHash: string;
};

function makeId(): string {
  return `pa_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

async function readAlerts(): Promise<StoredAlert[]> {
  const raw = await storageGetItem(ALERTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAlerts(rows: StoredAlert[]): Promise<void> {
  await storageSetItem(ALERTS_KEY, JSON.stringify(rows.slice(0, 200)));
}

async function readVotes(): Promise<Record<string, true>> {
  const raw = await storageGetItem(VOTES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, true>;
  } catch {
    return {};
  }
}

async function writeVotes(votes: Record<string, true>): Promise<void> {
  await storageSetItem(VOTES_KEY, JSON.stringify(votes));
}

function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearbyCountFor(alert: StoredAlert, all: StoredAlert[]): number {
  if (alert.latitude == null || alert.longitude == null) return 0;
  return all.filter((other) => {
    if (other.id === alert.id) return false;
    if (other.latitude == null || other.longitude == null) return false;
    return (
      distanceMeters(
        alert.latitude!,
        alert.longitude!,
        other.latitude,
        other.longitude
      ) <= 120
    );
  }).length;
}

export async function listPublicAlerts(): Promise<PublicAlert[]> {
  const [rows, votes, me] = await Promise.all([
    readAlerts(),
    readVotes(),
    getDeviceHash(),
  ]);
  const sorted = [...rows].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  return sorted.map((row) => ({
    id: row.id,
    placeName: row.placeName,
    description: row.description,
    photoUri: row.photoUri,
    latitude: row.latitude,
    longitude: row.longitude,
    areaLabel: row.areaLabel,
    createdAt: row.createdAt,
    verifyCount: row.verifyCount,
    isMine: row.authorHash === me,
    myVerified: Boolean(votes[row.id]),
    nearbyCount: nearbyCountFor(row, rows),
  }));
}

export type PostPublicAlertInput = {
  placeName: string;
  description: string;
  photoUri: string | null;
  latitude: number | null;
  longitude: number | null;
  areaLabel: string | null;
};

export function validatePublicAlertInput(
  input: PostPublicAlertInput
): string | null {
  const place = input.placeName.trim();
  const body = input.description.trim();
  if (place.length < 3) return "Add a place or building name.";
  if (body.length < 8) return "Write a short description of what you saw.";
  if (!input.photoUri) return "Add one photo of the problem.";
  return null;
}

export async function postPublicAlert(
  input: PostPublicAlertInput
): Promise<{ ok: true; alert: PublicAlert } | { ok: false; error: string }> {
  const err = validatePublicAlertInput(input);
  if (err) return { ok: false, error: err };
  const me = await getDeviceHash();
  const row: StoredAlert = {
    id: makeId(),
    placeName: input.placeName.trim(),
    description: input.description.trim(),
    photoUri: input.photoUri,
    latitude: input.latitude,
    longitude: input.longitude,
    areaLabel: input.areaLabel,
    createdAt: new Date().toISOString(),
    verifyCount: 0,
    authorHash: me,
  };
  const prev = await readAlerts();
  await writeAlerts([row, ...prev]);
  return {
    ok: true,
    alert: {
      ...row,
      isMine: true,
      myVerified: false,
      nearbyCount: nearbyCountFor(row, [row, ...prev]),
    },
  };
}

export async function verifyPublicAlert(
  id: string
): Promise<{ ok: true; alert: PublicAlert } | { ok: false; error: string }> {
  const me = await getDeviceHash();
  const rows = await readAlerts();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, error: "Alert not found." };
  const row = rows[idx]!;
  if (row.authorHash === me) {
    return { ok: false, error: "You cannot verify your own post." };
  }
  const votes = await readVotes();
  if (votes[id]) {
    return { ok: false, error: "You already verified this." };
  }
  votes[id] = true;
  row.verifyCount += 1;
  rows[idx] = row;
  await writeVotes(votes);
  await writeAlerts(rows);
  return {
    ok: true,
    alert: {
      id: row.id,
      placeName: row.placeName,
      description: row.description,
      photoUri: row.photoUri,
      latitude: row.latitude,
      longitude: row.longitude,
      areaLabel: row.areaLabel,
      createdAt: row.createdAt,
      verifyCount: row.verifyCount,
      isMine: false,
      myVerified: true,
      nearbyCount: nearbyCountFor(row, rows),
    },
  };
}
