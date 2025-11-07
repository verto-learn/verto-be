import { Router } from "express";
import userRoutes from "./user/user.routes";
import topicRoutes from "./topic/topic.routes";
import profileRoutes from "./profile/profile.routes";

const router = Router();


router.use("/user", userRoutes);
router.use("/topic", topicRoutes);
router.use("/profile", profileRoutes);



export default router;