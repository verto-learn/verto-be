// File: src/quiz/quiz.controller.ts

import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../middleware/verifyToken"; // Asumsi Anda punya ini
import { APIResponse } from "../../models/response";
import { getQuizQuestionsSchema, submitQuizSchema } from "./quiz.schema";
import { getQuizQuestionsService, submitQuizService } from "./quiz.service";

export const getQuizQuestions = async (
  req: Request,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {

    const { topicId } = getQuizQuestionsSchema.parse(req.query);

    const questions = await getQuizQuestionsService(topicId);

    res.status(200).json({
      status: "success",
      message: "Quiz questions fetched successfully",
      data: questions,
    });
  } catch (err) {
    next(err);
  }
};

export const submitQuiz = async (
  req: AuthRequest,
  res: Response<APIResponse>,
  next: NextFunction,
) => {
  try {

    const { topicId, answers } = submitQuizSchema.parse(req.body);

  
    const userId = req.user!.user_id; 

    const result = await submitQuizService(userId, topicId, answers);

    return res.status(200).json({
      status: "success",
      message: "Quiz submitted and graded successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};