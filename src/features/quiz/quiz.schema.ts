import { z } from "zod";


export const getQuizQuestionsSchema = z.object({
  topicId: z.string().cuid("Invalid topic ID format"),
});


export const submitQuizSchema = z.object({
  topicId: z.string().cuid("Invalid topic ID format"),
  answers: z.array(
    z.object({
      questionId: z.string().cuid("Invalid question ID format"),
      answerIndex: z.number().int().min(0, "Answer index must be positive"),
    }),
  ).min(1, "Answers array cannot be empty"), 
});