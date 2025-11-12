import { Router } from "express";
import { createQuizQuestion, getQuizQuestions, submitQuiz } from "./quiz.controller";
import { verifyToken } from "../../middleware/verifyToken";
import { isAdmin } from "../../middleware/isAdmin";


const quizRouter = Router();

quizRouter.get("/", getQuizQuestions);
quizRouter.post("/", verifyToken, isAdmin, createQuizQuestion);
quizRouter.post("/submit", verifyToken, submitQuiz);

export default quizRouter;