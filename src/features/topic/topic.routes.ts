import { Router } from "express";
import {
  createTopic,
  deleteTopic,
  getAdminInfo,
  getAllTopics,
} from "./topic.controller";
import { validate } from "../../http/validate";
import { createTopicSchema, deleteTopicSchema } from "./topic.schema";
import { verifyToken } from "../../middleware/verifyToken";
import { isAdmin } from "../../middleware/isAdmin";


const topicRoutes = Router();

topicRoutes.get("/", getAllTopics);

topicRoutes.post(
  "/",
  verifyToken,
  isAdmin,
  validate(createTopicSchema, "body"),
  createTopic,
);

topicRoutes.delete(
  "/:topic_id",
  verifyToken,
  isAdmin,
  validate(deleteTopicSchema, "params"),
  deleteTopic,
);

topicRoutes.get("/admin", verifyToken, isAdmin, getAdminInfo);

export default topicRoutes;