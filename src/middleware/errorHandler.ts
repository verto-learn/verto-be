import { NextFunction, Request, Response } from "express";
import { APIResponse } from "../models/response";


export class APIError extends Error {
  statusCode: number | undefined;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export const errorHandler = (
  err: APIError,
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
};