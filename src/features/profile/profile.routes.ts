import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { updateProfile } from "./profile.controller";
import { validate } from "../../http/validate";
import { profileUpdateSchema } from "./profile.schema";
const router = Router();

router.patch(
  "/update",
  verifyToken,
  validate(profileUpdateSchema, "body"),
  updateProfile,
);

export default router;