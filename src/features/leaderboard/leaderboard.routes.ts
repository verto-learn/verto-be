import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { getLeaderboard } from "./leaderboard.controller";

const leaderboardRoutes = Router();

leaderboardRoutes.get("/", getLeaderboard);

export default leaderboardRoutes;