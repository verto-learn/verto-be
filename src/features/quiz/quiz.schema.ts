import { z } from "zod";
import { CourseDifficulty } from "@prisma/client";


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

export const createQuizQuestionSchema = z.object({
  topicId: z.string().min(1, "topicId tidak boleh kosong"),
  questionText: z.string().min(5, "Teks pertanyaan minimal 5 karakter"),
  options: z
    .array(z.string().min(1, "Opsi tidak boleh kosong"))
    .min(2, "Harus ada minimal 2 opsi jawaban"),
  correctAnswerIndex: z.number().int().min(0, "Indeks jawaban harus angka positif"),
  level: z.nativeEnum(CourseDifficulty),
}).refine(
  (data) => data.correctAnswerIndex < data.options.length,
  {
    message: "Indeks jawaban yang benar harus ada di dalam rentang opsi",
    path: ["correctAnswerIndex"], 
  }
);