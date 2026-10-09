import type { PublicAlert } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { publicAlertSafetyMessage } from "../lib/publicAlertSafety.js";
import { AppError } from "../utils/errors.js";

export const ALERT_TYPES = [
  "unsafe_spot",
  "dark_street",
  "live_wire",
  "open_drain",
  "waterlogging",
  "garbage",
  "other",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

/** An alert disappears this long after the last time anyone confirmed it. */
const EXPIRY_DAYS = 7;
/** Poster + 2 others = confirmed. */
const CONFIRMED_AT = 3;
/** Reports from this many phones hide an alert until reviewed. */
const FLAG_HIDE_AT = 3;
/** "Not there anymore" votes needed (and must outnumber sightings) to retire it. */
const GONE_MIN = 2;
const POSTS_PER_DAY = 3;
const DUPLICATE_RADIUS_M = 75;
const DEFAULT_RADIUS_KM = 15;

export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function expiryCutoff(): Date {
  return new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

function assertDevice(deviceHash: string | undefined | null): string {
  const d = deviceHash?.trim() ?? "";
  if (d.length < 16 || d.length > 128) {
    throw new AppError("INVALID_DEVICE", "invalid device");
  }
  return d;
}

/** Shape sent to the app. Never includes any device hash. */
function toPublic(
  row: PublicAlert,
  me: string | null,
  myVote: string | null,
  origin?: { lat: number; lng: number }
) {
  const seenTotal = 1 + row.seenCount;
  return {
    id: row.id,
    type: row.type,
    placeName: row.placeName,
    description: row.description,
    hasPhoto: Boolean(row.photoPath),
    latitude: row.latitude,
    longitude: row.longitude,
    areaLabel: row.areaLabel,
    createdAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    seenTotal,
    goneCount: row.goneCount,
    confirmed: seenTotal >= CONFIRMED_AT,
    isMine: me != null && row.authorDeviceHash === me,
    myVote: myVote === "seen" || myVote === "gone" ? myVote : null,
    distanceMeters: origin
      ? Math.round(
          distanceMeters(origin.lat, origin.lng, row.latitude, row.longitude)
        )
      : null,
  };
}

export type PublicAlertDto = ReturnType<typeof toPublic>;

async function myVotesFor(
  ids: string[],
  me: string | null
): Promise<Map<string, string>> {
  if (!me || !ids.length) return new Map();
  const votes = await prisma.publicAlertVote.findMany({
    where: { alertId: { in: ids }, deviceHash: me },
  });
  return new Map(votes.map((v) => [v.alertId, v.vote]));
}

export async function listPublicAlerts(input: {
  deviceHash?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
}): Promise<PublicAlertDto[]> {
  const me = input.deviceHash?.trim() || null;
  const rows = await prisma.publicAlert.findMany({
    where: { status: "active", lastSeenAt: { gte: expiryCutoff() } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const origin =
    input.lat != null && input.lng != null
      ? { lat: input.lat, lng: input.lng }
      : undefined;
  const radiusM =
    Math.min(Math.max(input.radiusKm ?? DEFAULT_RADIUS_KM, 1), 60) * 1000;
  const visible = origin
    ? rows.filter(
        (r) =>
          distanceMeters(origin.lat, origin.lng, r.latitude, r.longitude) <=
          radiusM
      )
    : rows;

  const top = visible.slice(0, 60);
  const votes = await myVotesFor(
    top.map((r) => r.id),
    me
  );
  return top.map((r) => toPublic(r, me, votes.get(r.id) ?? null, origin));
}

/** Active alerts of the same type within ~75 m, so people confirm instead of re-posting. */
export async function findNearbyDuplicates(input: {
  deviceHash?: string | null;
  type: string;
  lat: number;
  lng: number;
}): Promise<PublicAlertDto[]> {
  const me = input.deviceHash?.trim() || null;
  const latDelta = 0.002;
  const lngDelta = 0.002;
  const rows = await prisma.publicAlert.findMany({
    where: {
      status: "active",
      type: input.type,
      lastSeenAt: { gte: expiryCutoff() },
      latitude: { gte: input.lat - latDelta, lte: input.lat + latDelta },
      longitude: { gte: input.lng - lngDelta, lte: input.lng + lngDelta },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const origin = { lat: input.lat, lng: input.lng };
  const near = rows.filter(
    (r) =>
      distanceMeters(input.lat, input.lng, r.latitude, r.longitude) <=
      DUPLICATE_RADIUS_M
  );
  const votes = await myVotesFor(
    near.map((r) => r.id),
    me
  );
  return near.map((r) => toPublic(r, me, votes.get(r.id) ?? null, origin));
}

export async function createPublicAlert(input: {
  deviceHash: string;
  type: string;
  placeName: string;
  description: string;
  latitude: number;
  longitude: number;
  areaLabel?: string | null;
  photoPath?: string | null;
}): Promise<PublicAlertDto> {
  const me = assertDevice(input.deviceHash);
  if (!(ALERT_TYPES as readonly string[]).includes(input.type)) {
    throw new AppError("INVALID_TYPE", "Pick what kind of problem this is.");
  }
  const description = input.description.trim();
  if (description.length < 8 || description.length > 400) {
    throw new AppError(
      "INVALID_DESCRIPTION",
      "Describe what you saw in 8 to 400 characters."
    );
  }
  const safety =
    publicAlertSafetyMessage(description) ||
    publicAlertSafetyMessage(input.placeName ?? "");
  if (safety) {
    throw new AppError("CONTENT_BLOCKED", safety);
  }
  // Rough India bounding box; the app only posts with a live GPS fix.
  if (
    input.latitude < 6 ||
    input.latitude > 38 ||
    input.longitude < 68 ||
    input.longitude > 98
  ) {
    throw new AppError("INVALID_LOCATION", "Location must be in India.");
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.publicAlert.count({
    where: { authorDeviceHash: me, createdAt: { gte: since } },
  });
  if (recent >= POSTS_PER_DAY) {
    throw new AppError(
      "DAILY_LIMIT",
      `You can post ${POSTS_PER_DAY} alerts a day. Confirm existing ones instead.`,
      429
    );
  }

  const row = await prisma.publicAlert.create({
    data: {
      type: input.type,
      placeName: input.placeName.trim().slice(0, 255) || "Current location",
      description,
      latitude: input.latitude,
      longitude: input.longitude,
      areaLabel: input.areaLabel?.trim().slice(0, 120) || null,
      photoPath: input.photoPath ?? null,
      authorDeviceHash: me,
    },
  });
  return toPublic(row, me, null);
}

export async function attachPhoto(id: string, photoPath: string) {
  await prisma.publicAlert.update({ where: { id }, data: { photoPath } });
}

export async function getPhotoPath(id: string): Promise<string | null> {
  const row = await prisma.publicAlert.findUnique({
    where: { id },
    select: { photoPath: true, status: true },
  });
  if (!row || row.status === "removed" || row.status === "flagged") return null;
  return row.photoPath;
}

export async function voteOnAlert(input: {
  alertId: string;
  deviceHash: string;
  vote: "seen" | "gone";
}): Promise<PublicAlertDto> {
  const me = assertDevice(input.deviceHash);
  return prisma.$transaction(async (tx) => {
    const alert = await tx.publicAlert.findUnique({
      where: { id: input.alertId },
    });
    if (!alert || alert.status !== "active") {
      throw new AppError("ALERT_NOT_FOUND", "This alert is no longer active.", 404);
    }
    if (alert.authorDeviceHash === me) {
      throw new AppError("SELF_VOTE", "You posted this alert.");
    }

    await tx.publicAlertVote.upsert({
      where: { alertId_deviceHash: { alertId: alert.id, deviceHash: me } },
      create: { alertId: alert.id, deviceHash: me, vote: input.vote },
      update: { vote: input.vote },
    });

    const [seen, gone] = await Promise.all([
      tx.publicAlertVote.count({ where: { alertId: alert.id, vote: "seen" } }),
      tx.publicAlertVote.count({ where: { alertId: alert.id, vote: "gone" } }),
    ]);
    const seenTotal = 1 + seen;
    const resolved = gone >= GONE_MIN && gone > seenTotal;

    const updated = await tx.publicAlert.update({
      where: { id: alert.id },
      data: {
        seenCount: seen,
        goneCount: gone,
        status: resolved ? "resolved" : "active",
        ...(input.vote === "seen" ? { lastSeenAt: new Date() } : {}),
      },
    });
    return toPublic(updated, me, input.vote);
  });
}

export async function flagAlert(input: {
  alertId: string;
  deviceHash: string;
  reason?: string | null;
}): Promise<{ hidden: boolean }> {
  const me = assertDevice(input.deviceHash);
  return prisma.$transaction(async (tx) => {
    const alert = await tx.publicAlert.findUnique({
      where: { id: input.alertId },
    });
    if (!alert) throw new AppError("ALERT_NOT_FOUND", "Alert not found.", 404);
    if (alert.authorDeviceHash === me) {
      throw new AppError("SELF_FLAG", "Delete your own post instead.");
    }
    await tx.publicAlertFlag.upsert({
      where: { alertId_deviceHash: { alertId: alert.id, deviceHash: me } },
      create: {
        alertId: alert.id,
        deviceHash: me,
        reason: input.reason?.trim().slice(0, 255) || null,
      },
      update: {},
    });
    const flags = await tx.publicAlertFlag.count({
      where: { alertId: alert.id },
    });
    const hidden = flags >= FLAG_HIDE_AT;
    await tx.publicAlert.update({
      where: { id: alert.id },
      data: {
        flagCount: flags,
        ...(hidden && alert.status === "active" ? { status: "flagged" } : {}),
      },
    });
    return { hidden };
  });
}

export async function deleteOwnAlert(input: {
  alertId: string;
  deviceHash: string;
}): Promise<void> {
  const me = assertDevice(input.deviceHash);
  const alert = await prisma.publicAlert.findUnique({
    where: { id: input.alertId },
  });
  if (!alert || alert.status === "removed") {
    throw new AppError("ALERT_NOT_FOUND", "Alert not found.", 404);
  }
  if (alert.authorDeviceHash !== me) {
    throw new AppError("NOT_OWNER", "You can only delete your own post.", 403);
  }
  await prisma.publicAlert.update({
    where: { id: alert.id },
    data: { status: "removed" },
  });
}
