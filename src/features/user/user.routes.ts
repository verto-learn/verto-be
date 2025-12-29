import express from "express";
import {
  changePassword,
  createUser,
  getAllUsers,
  getUser,
  getUserStats,
  loginUser,
  logoutUser,
} from "./user.controller";
import { validate } from "../../http/validate";
import {
  changePasswordSchema,
  createUserSchema,
  loginUserSchema,
} from "./user.schema";
import { verifyToken } from "../../middleware/verifyToken";
import { isAdmin } from "../../middleware/isAdmin";

const router = express.Router();

router.post("/register", validate(createUserSchema, "body"), createUser);
router.post("/login", validate(loginUserSchema, "body"), loginUser);
router.get("/session", verifyToken, getUser);
router.post("/logout", logoutUser);
router.patch(
  "/change-password",
  validate(changePasswordSchema, "body"),
  verifyToken,
  changePassword,
);
router.get("/all-users", verifyToken, isAdmin, getAllUsers);
router.get("/stats", verifyToken, isAdmin, getUserStats);

export default router;