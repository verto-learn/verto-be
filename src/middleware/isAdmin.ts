import { APIError } from "./errorHandler";
import { AuthRequest } from "./verifyToken";
import { Response, NextFunction } from "express";


export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role === "admin") {
    return next();
  }

  throw new APIError("Forbidden: Admins only", 403);
};