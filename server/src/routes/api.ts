import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import * as Catalog from "../services/CatalogService.js";
import * as CommunityTips from "../services/CommunityTipService.js";
import * as Reports from "../services/ReportService.js";
import { createStorage } from "../storage/StorageService.js";
import { ok } from "../utils/errors.js";
import { AppError } from "../utils/errors.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 },
});
const storage = createStorage();

export const apiRouter = Router();

apiRouter.get("/emergency/contacts", async (_req, res, next) => {
  try {
    const region =
      typeof _req.query.region === "string" ? _req.query.region : "delhi";
    res.json(ok(await Catalog.listEmergencyContacts(region)));
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/categories", async (_req, res, next) => {
  try {
    res.json(ok(await Catalog.listCategories()));
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/categories/:slug/issue-types", async (req, res, next) => {
  try {
    res.json(ok(await Catalog.listIssueTypesForCategory(req.params.slug)));
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/categories/:slug/assessment", async (req, res, next) => {
  try {
    res.json(ok(await Catalog.listAssessmentQuestions(req.params.slug)));
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/routing", async (req, res, next) => {
  try {
    const categorySlug = String(req.query.categorySlug ?? "");
    if (!categorySlug) {
      throw new AppError("VALIDATION_ERROR", "categorySlug is required");
    }
    const issueTypeSlug =
      typeof req.query.issueTypeSlug === "string"
        ? req.query.issueTypeSlug
        : null;
    res.json(
      ok(await Catalog.fetchLikelyAuthorities({ categorySlug, issueTypeSlug }))
    );
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/authorities/:slug/services", async (req, res, next) => {
  try {
    res.json(ok(await Catalog.fetchAuthorityServices(req.params.slug)));
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/search", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    res.json(ok(await Catalog.globalSearch(q)));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/cases/next-id", async (_req, res, next) => {
  try {
    res.json(ok({ caseId: await Reports.nextCaseId() }));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/reports", async (req, res, next) => {
  try {
    const body = z
      .object({
        caseId: z.string().min(3),
        categorySlug: z.string().nullable().optional(),
        issueTypeSlug: z.string().nullable().optional(),
        emergencyResult: z.string().nullable().optional(),
        selectedAuthoritySlug: z.string().nullable().optional(),
        userStatus: z.string().min(1),
        statusSourceType: z.string().nullable().optional(),
      })
      .parse(req.body);
    const report = await Reports.upsertReport(body);
    res.json(ok({ id: report.id, caseId: report.caseId }));
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/reports", async (req, res, next) => {
  try {
    const raw = typeof req.query.caseIds === "string" ? req.query.caseIds : "";
    const caseIds = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    res.json(ok(await Reports.getReportsByCaseIds(caseIds)));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/reports/locations", async (req, res, next) => {
  try {
    const body = z
      .object({
        reportId: z.string().nullable().optional(),
        draftKey: z.string().nullable().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
        addressText: z.string().nullable().optional(),
        landmark: z.string().nullable().optional(),
        accuracyMeters: z.number().nullable().optional(),
        jurisdictionStatus: z.string().nullable().optional(),
        jurisdictionId: z.string().nullable().optional(),
        addLocationOnPhoto: z.boolean().nullable().optional(),
        source: z.string().nullable().optional(),
      })
      .parse(req.body);
    const row = await Reports.createReportLocation(body);
    res.json(ok(row));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/reports/complaints", async (req, res, next) => {
  try {
    const body = z
      .object({
        reportId: z.string().min(1),
        authoritySlug: z.string().nullable().optional(),
        serviceId: z.string().nullable().optional(),
        channelType: z.string().nullable().optional(),
        channelValue: z.string().nullable().optional(),
        officialSubmissionUrl: z.string().nullable().optional(),
        officialTrackingUrl: z.string().nullable().optional(),
        hasOfficialReference: z.boolean().optional(),
        officialReference: z.string().nullable().optional(),
        userConfirmedFiled: z.boolean().optional(),
        officialFiledOn: z.string().nullable().optional(),
      })
      .parse(req.body);
    const row = await Reports.createOfficialComplaint(body);
    res.json(ok(row));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/reports/updates", async (req, res, next) => {
  try {
    const body = z
      .object({
        reportId: z.string().min(1),
        status: z.string().min(1),
        message: z.string().min(1),
      })
      .parse(req.body);
    const row = await Reports.createCaseUpdate(body);
    res.json(ok(row));
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/community-tips", async (req, res, next) => {
  try {
    const categorySlug =
      typeof req.query.categorySlug === "string"
        ? req.query.categorySlug
        : undefined;
    res.json(ok(await CommunityTips.listCommunityTips(categorySlug)));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/community-tips", async (req, res, next) => {
  try {
    const body = z
      .object({
        deviceHash: z.string().min(16),
        categorySlug: z.string().min(1),
        title: z.string().min(8).max(120),
        body: z.string().min(20).max(800),
        whenToAct: z.string().nullable().optional(),
        channelLabel: z.string().nullable().optional(),
        channelUrl: z.string().nullable().optional(),
      })
      .parse(req.body);
    const tip = await CommunityTips.submitCommunityTip(body);
    res.json(ok(tip));
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/community-tips/:id/vote", async (req, res, next) => {
  try {
    const body = z
      .object({
        deviceHash: z.string().min(16),
        vote: z.enum(["agree", "disagree"]),
      })
      .parse(req.body);
    const result = await CommunityTips.voteCommunityTip({
      tipId: req.params.id,
      deviceHash: body.deviceHash,
      vote: body.vote,
    });
    res.json(ok(result));
  } catch (e) {
    next(e);
  }
});

apiRouter.post(
  "/evidence",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const draftKey = String(req.body.draftKey ?? "").trim();
      const evidenceId = String(req.body.evidenceId ?? "").trim();
      const mediaType = String(req.body.mediaType ?? "photo");
      if (!draftKey || !evidenceId) {
        throw new AppError(
          "VALIDATION_ERROR",
          "draftKey and evidenceId are required"
        );
      }
      if (!req.file) {
        throw new AppError("VALIDATION_ERROR", "file is required");
      }
      const ext =
        mediaType === "video"
          ? "mp4"
          : (req.file.originalname.split(".").pop() || "jpg").toLowerCase();
      const relative = `${draftKey}/${evidenceId}.${ext}`;
      const saved = await storage.save(
        relative,
        req.file.buffer,
        req.file.mimetype
      );
      await Reports.recordEvidenceMeta({
        draftKey,
        storagePath: saved.storagePath,
        mediaType,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
      });
      res.json(ok({ storagePath: saved.storagePath }));
    } catch (e) {
      next(e);
    }
  }
);
