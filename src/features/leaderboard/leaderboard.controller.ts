import { NextFunction, Response } from "express";
import { getLeaderboardService } from "./leaderboard.service";
import { AuthRequest } from "../../middleware/verifyToken";
import { APIResponse } from "../../models/response";


export const getLeaderboard = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction
) => {
  try {
    const data = await getLeaderboardService();

    return res.status(200).json({
      status: "success",
      message: "Leaderboard retrieved successfully",
      data: data,
    });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    next(err);
  }
};