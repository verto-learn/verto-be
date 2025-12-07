import { CourseDifficulty } from "@prisma/client";
import z from "zod";

export const createCourseSchema = z.object({
  topic_id: z.string().min(1, { message: "Topic id is required" }),
  difficulty: z.enum(
    [
      CourseDifficulty.beginner,
      CourseDifficulty.intermediate,
      CourseDifficulty.advanced,
    ],
    {
      message:
        "Difficulty must be one of the following: beginner, intermediate, advanced",
    },
  ),
});

export const deleteCourseSchema = z.object({
  course_id: z
    .string({ message: "Course Id Is required" })
    .min(4, { message: "Course id minimal 4 letters" }),
});

export const getCourseDetailSchema = z.object({
  course_id: z.string().cuid("Invalid course ID format"),
});

export const collectStudyCaseProofSchema = z.object({
proof_url: z.string().url().min(1),
  notes: z.string().min(10, { message: "Deskripsi tugas minimal 10 karakter" }),
});

export const updateStatusStudyCaseSchema = z.object({
  approved: z.boolean({ message: "Approved status is required" }),
  chapter_id: z.string({ message: "Chapter ID is required" }).min(1, {
    message: "Chapter ID is required",
  }),
  user_id: z.string({ message: "User ID is required" }).min(1, {
    message: "User ID is required",
  }),
});

export const chatWithChapterSchema = z.object({
  question: z.string().min(3, "Pertanyaan terlalu pendek"),
  chapterId: z.string().cuid(),
});

