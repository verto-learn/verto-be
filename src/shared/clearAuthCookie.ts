import { Response } from "express";

export const clearAuthCookie = (res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
};