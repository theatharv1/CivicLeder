import { Router, type Request } from "express";
import multer from "multer";
import { z } from "zod";
import * as Alerts from "../services/PublicAlertService.js";
import { createPublicAlertStorage } from "../storage/StorageService.js";
import { AppError, ok } from "../utils/errors.js";
import { rateLimit } from "../middleware/rateLimit.js";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
});
const photos = createPublicAlertStorage();

/** Detect the real image type from its first bytes (never trust the client mime). */
function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: "png", mime: "image/png" };
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (/^(heic|heix|hevc|hevx|mif1|msf1)$/.test(brand)) {
      return { ext: "heic", mime: "image/heic" };
    }
  }
  return null;
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

function deviceFrom(req: Request): string | null {
  const h = req.header("x-device-hash");
  return h && h.trim().length >= 16 ? h.trim() : null;
}

function num(v: unknown): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const writeLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });
const voteLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 200 });

export const publicAlertsRouter = Router();

publicAlertsRouter.get("/", async (req, res, next) => {
  try {
    res.json(
      ok(
        await Alerts.listPublicAlerts({
          deviceHash: deviceFrom(req),
          lat: num(req.query.lat),
          lng: num(req.query.lng),
          radiusKm: num(req.query.radiusKm),
        })
      )
    );
  } catch (e) {
    next(e);
  }
});

publicAlertsRouter.get("/nearby", async (req, res, next) => {
  try {
    const lat = num(req.query.lat);
    const lng = num(req.query.lng);
    const type = typeof req.query.type === "string" ? req.query.type : "";
    if (lat == null || lng == null || !type) {
      throw new AppError("VALIDATION_ERROR", "type, lat and lng are required");
    }
    res.json(
      ok(
        await Alerts.findNearbyDuplicates({
          deviceHash: deviceFrom(req),
          type,
          lat,
          lng,
        })
      )
    );
  } catch (e) {
    next(e);
  }
});

publicAlertsRouter.post(
  "/",
  writeLimit,
  upload.single("photo"),
  async (req, res, next) => {
    try {
      const body = z
        .object({
          deviceHash: z.string().min(16).max(128),
          type: z.enum(Alerts.ALERT_TYPES),
          placeName: z.string().max(255).default(""),
          description: z.string().min(1).max(400),
          latitude: z.coerce.number(),
          longitude: z.coerce.number(),
          areaLabel: z.string().max(120).nullable().optional(),
        })
        .parse(req.body);

      const photo = req.file ? sniffImage(req.file.buffer) : null;
      if (req.file && !photo) {
        throw new AppError("INVALID_PHOTO", "Photo must be a JPG, PNG, WEBP or HEIC image.");
      }

      const alert = await Alerts.createPublicAlert(body);
      if (req.file && photo) {
        const saved = await photos.save(`${alert.id}.${photo.ext}`, req.file.buffer, photo.mime);
        await Alerts.attachPhoto(alert.id, saved.storagePath);
        alert.hasPhoto = true;
      }
      res.status(201).json(ok(alert));
    } catch (e) {
      next(e);
    }
  }
);

publicAlertsRouter.get("/:id/photo", async (req, res, next) => {
  try {
    const rel = await Alerts.getPhotoPath(String(req.params.id));
    const full = rel ? photos.resolve(rel) : null;
    if (!rel || !full) throw new AppError("NOT_FOUND", "Photo not found", 404);
    const ext = rel.split(".").pop() ?? "jpg";
    res.setHeader("Content-Type", MIME_BY_EXT[ext] ?? "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(full, (err) => {
      if (err && !res.headersSent) next(new AppError("NOT_FOUND", "Photo not found", 404));
    });
  } catch (e) {
    next(e);
  }
});

publicAlertsRouter.post("/:id/vote", voteLimit, async (req, res, next) => {
  try {
    const body = z
      .object({
        deviceHash: z.string().min(16).max(128),
        vote: z.enum(["seen", "gone"]),
      })
      .parse(req.body);
    res.json(
      ok(
        await Alerts.voteOnAlert({
          alertId: String(req.params.id),
          deviceHash: body.deviceHash,
          vote: body.vote,
        })
      )
    );
  } catch (e) {
    next(e);
  }
});

publicAlertsRouter.post("/:id/flag", writeLimit, async (req, res, next) => {
  try {
    const body = z
      .object({
        deviceHash: z.string().min(16).max(128),
        reason: z.string().max(255).nullable().optional(),
      })
      .parse(req.body);
    res.json(
      ok(
        await Alerts.flagAlert({
          alertId: String(req.params.id),
          deviceHash: body.deviceHash,
          reason: body.reason,
        })
      )
    );
  } catch (e) {
    next(e);
  }
});

publicAlertsRouter.delete("/:id", async (req, res, next) => {
  try {
    const deviceHash = deviceFrom(req);
    if (!deviceHash) throw new AppError("INVALID_DEVICE", "invalid device");
    await Alerts.deleteOwnAlert({ alertId: String(req.params.id), deviceHash });
    res.json(ok({ deleted: true }));
  } catch (e) {
    next(e);
  }
});
