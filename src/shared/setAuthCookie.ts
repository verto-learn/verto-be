import { Response } from "express";

export const setAuthCookie = (token: string, res: Response) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
};