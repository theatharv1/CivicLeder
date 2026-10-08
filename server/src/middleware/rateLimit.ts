import type { NextFunction, Request, Response } from "express";
import { fail } from "../utils/errors.js";

/**
 * Small in-memory per-IP limiter. The API runs as a single PM2 process,
 * so one Map is enough; per-device limits in the services do the rest.
 */
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const cur = hits.get(key);
    if (!cur || cur.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      next();
      return;
    }
    cur.count += 1;
    if (cur.count > opts.max) {
      res.status(429).json(fail("RATE_LIMITED", "Too many requests. Try again later."));
      return;
    }
    next();
  };
}
