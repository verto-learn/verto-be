import { Router } from "express";
import {
  chatWithChapter,
  collectStudyCaseProof,
  createCourse,
  deleteSelectedCourse,
  getAllCourse,
  getAllStudyCaseProofs,
  getCourseDetail,
  getSelectedCourses,
  selectCompleteChapter,
  updateStatusStudyCase,
} from "./course.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { validate } from "../../http/validate";
import {
  collectStudyCaseProofSchema,
  createCourseSchema,
  deleteCourseSchema,
  updateStatusStudyCaseSchema,
} from "./course.schema";
import { isAdmin } from "../../middleware/isAdmin";

const router = Router();

router.post(
  "/",
  verifyToken,
  isAdmin,
  validate(createCourseSchema, "body"),
  createCourse,
);
router.get("/", verifyToken, getSelectedCourses);
router.get("/:course_id", verifyToken, getCourseDetail);

router.patch("/:chapter_id", verifyToken, selectCompleteChapter);
router.get("/all-courses", verifyToken, isAdmin, getAllCourse);

router.delete(
  "/:course_id",
  verifyToken,
  isAdmin,
  validate(deleteCourseSchema, "params"),
  deleteSelectedCourse,
);

router.post(
  "/chapter/:chapter_id/study-case",
  verifyToken,
  validate(collectStudyCaseProofSchema, "body"),
  collectStudyCaseProof,
);

router.get(
  "/study-case/proofs",
  verifyToken,
  isAdmin,
  getAllStudyCaseProofs,
);

router.patch(
  "/study-case/proofs/status",
  verifyToken,
  isAdmin,
  validate(updateStatusStudyCaseSchema, "body"),
  updateStatusStudyCase,
);

router.post(
  "/chat", 
  verifyToken, 
  chatWithChapter
);

export default router;