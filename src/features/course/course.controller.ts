import { NextFunction, Response } from "express";
import { APIResponse } from "../../models/response";
import z from "zod";
import {
  chatWithChapterService,
  collectStudyCaseProofService,
  createCourseService,
  deleteSelectedCourseService,
  getAllCourseService,
  getAllStudyCaseProofsService,
  getCourseDetailService,
  getSelectedCoursesService,
  selectCompleteChapterService,
  updateStatusStudyCaseService,
} from "./course.service";
import {
  chatWithChapterSchema,
  collectStudyCaseProofSchema,
  createCourseSchema,
  deleteCourseSchema,
  getCourseDetailSchema,
  updateStatusStudyCaseSchema,
} from "./course.schema";
import { AuthRequest } from "../../middleware/verifyToken";
import { gradingQueue } from "../../shared/gradingQueue";

export const createCourse = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const { topic_id, difficulty } = req.body as z.infer<
      typeof createCourseSchema
    >;

    const result = await createCourseService(
      topic_id,
      difficulty,
      req.user?.user_id as string,
    );

    return res.status(200).json({
      status: "success",
      message: "Course Created!",
      data: result,
    });
  } catch (err) {
    console.log("Error Creating Course");
    next(err);
  }
};


export const getSelectedCourses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.user_id as string;

  try {

    const courses = await getSelectedCoursesService(userId); 
    return res.status(200).json({
      status: "success",
      message: "Success get selected courses!", 
      data: courses, 
    });
  } catch (err) {
    console.log("Error get selected courses"); 
    next(err);
  }
};

export const getCourseDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.user_id as string;

  try {
    const { course_id } = getCourseDetailSchema.parse(req.params);

    const courseDetail = await getCourseDetailService(userId, course_id);
    
    return res.status(200).json({
      status: "success",
      message: "Success get course detail!",
      data: courseDetail,
    });
  } catch (err) {
    console.log("Error get course detail");
    next(err);
  }
};

export const selectCompleteChapter = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const user_id = req?.user?.user_id;
    const { chapter_id } = req.params;

    const completedChapter = await selectCompleteChapterService(
      user_id as string,
      chapter_id,
    );

    return res.status(200).json({
      message: "Chapter completed successfully",
      status: "success",
      data: completedChapter,
    });
  } catch (err) {
    next(err);
  }
};

export const collectStudyCaseProof = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const user_id = req?.user?.user_id as string;
    const { chapter_id } = req.params;
    
    const { proof_url, notes } = req.body as z.infer<typeof collectStudyCaseProofSchema>;

    const result = await collectStudyCaseProofService(
      user_id,
      chapter_id,
      proof_url,
      notes
    );

    await gradingQueue.add({ 
        chapterId: chapter_id, 
        userId: user_id 
    });

    return res.status(200).json({
      message: "Tugas dikirim! AI sedang menilai...",
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const updateStatusStudyCase = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const { approved, chapter_id, user_id } = req.body as z.infer<
      typeof updateStatusStudyCaseSchema
    >;

    const result = await updateStatusStudyCaseService(
      user_id,
      chapter_id,
      approved,
    );

    return res.status(200).json({
      message: "Study case proof status updated successfully",
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllCourse = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const allCourses = await getAllCourseService();
    return res.status(200).json({
      message: "Get all course successfully",
      status: "success",
      data: allCourses,
    });
  } catch (err) {
    console.log("Error selected all course");
    next(err);
  }
};
export const getAllStudyCaseProofs = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {
    const allProofs = await getAllStudyCaseProofsService();
    return res.status(200).json({
      message: "Get all study case proofs successfully",
      status: "success",
      data: allProofs,
    });
  } catch (err) {
    console.log("Error get all study case proofs"); 
    next(err);
  }
};

export const deleteSelectedCourse = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  const { course_id } = deleteCourseSchema.parse(req.params);
  console.log(course_id);

  try {
    const deletedCourse = await deleteSelectedCourseService(course_id);
    return res.status(200).json({
      message: "Course Deleted successfully!",
      status: "success",
      data: deletedCourse,
    });
  } catch (err) {
    next(err);
  }
};

export const chatWithChapter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chapterId, question } = chatWithChapterSchema.parse(req.body);
    
    const answer = await chatWithChapterService(chapterId, question);
    
    return res.status(200).json({
      status: "success",
      data: { answer }
    });
  } catch (err) {
    next(err);
  }
};