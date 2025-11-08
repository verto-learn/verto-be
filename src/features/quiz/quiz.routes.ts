import { Router } from "express";
import { getQuizQuestions, submitQuiz } from "./quiz.controller";
import { verifyToken } from "../../middleware/verifyToken";


const quizRouter = Router();


quizRouter.get("/", getQuizQuestions);
quizRouter.post("/submit", verifyToken, submitQuiz);

export default quizRouter;