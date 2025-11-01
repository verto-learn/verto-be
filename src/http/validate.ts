import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import { APIResponse } from "../models/response";

export function validate(
  schema: ZodTypeAny,
  source: "body" | "query" | "params" = "body",
) {
  return (req: Request, res: Response<APIResponse>, next: NextFunction) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const error = result.error as ZodError;
      const errors = error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors,
      });
    }

    (req as any)[source] = result.data;
    next();
  };
}