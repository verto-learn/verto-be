import { Router } from "express";
import userRoutes from "./user/user.routes";
import topicRoutes from "./topic/topic.routes";
import profileRoutes from "./profile/profile.routes";
import quizRoutes from "./quiz/quiz.routes";
import courseRoutes from "./course/course.routes";

const router = Router();


router.use("/user", userRoutes);
router.use("/topic", topicRoutes);
router.use("/profile", profileRoutes);
router.use("/quiz", quizRoutes);
router.use("/course", courseRoutes);

export default router;