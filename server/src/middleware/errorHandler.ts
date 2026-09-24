import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, fail } from "../utils/errors.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json(fail("NOT_FOUND", "Route not found"));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.status).json(fail(err.code, err.message));
    return;
  }
  if (err instanceof ZodError) {
    res
      .status(400)
      .json(
        fail("VALIDATION_ERROR", err.issues[0]?.message ?? "Invalid request")
      );
    return;
  }
  console.error("[error]", err instanceof Error ? err.message : err);
  res.status(500).json(fail("INTERNAL_ERROR", "Something went wrong"));
}
