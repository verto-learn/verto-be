import { Router } from "express";
import userRoutes from "./user/user.routes";
import topicRoutes from "./topic/topic.routes";
import profileRoutes from "./profile/profile.routes";
import quizRoutes from "./quiz/quiz.routes";
import courseRoutes from "./course/course.routes";
import certificateRoutes from "./certificate/certificate.routes";
import healthRouter from './health/health.routes';
import queueRoutes from './queue/queue.routes';
import leaderboardRoutes from "./leaderboard/leaderboard.routes";

const router = Router();


router.use("/user", userRoutes);
router.use("/topic", topicRoutes);
router.use("/profile", profileRoutes);
router.use("/quiz", quizRoutes);
router.use("/course", courseRoutes);
router.use("/certificate", certificateRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use('/', healthRouter);
router.use('/', queueRoutes);

export default router;