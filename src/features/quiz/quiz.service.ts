import prisma from "../../database/database";
import { APIError } from "../../middleware/errorHandler";
import { CourseDifficulty } from "@prisma/client";


type UserAnswer = {
  questionId: string;
  answerIndex: number;
};

export const getQuizQuestionsService = async (topicId: string) => {
  const allQuestions = await prisma.quizQuestion.findMany({
    where: { topic_id: topicId },
  });


  const byLevel: Record<string, typeof allQuestions> = {
    beginner: [],
    intermediate: [],
    advanced: [],
  };
  allQuestions.forEach((q) => {
    byLevel[q.level].push(q);
  });

  const quizQuestions = [
    ...byLevel.beginner,
    ...byLevel.intermediate,
    ...byLevel.advanced,
  ];


  if (quizQuestions.length < 5) {
    throw new APIError(
      "Not enough questions in the bank for this topic",
      404,
    );
  }


  const safeQuestions = quizQuestions.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options,
    level: q.level,
  }));

  return safeQuestions;
};

type CreateQuestionInput = {
  topicId: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  level: CourseDifficulty;
};

/**
 * Service untuk membuat pertanyaan kuis baru
 */
export const createQuizQuestionService = async (
  data: CreateQuestionInput,
) => {
  const { topicId, questionText, options, correctAnswerIndex, level } = data;

  const newQuestion = await prisma.quizQuestion.create({
    data: {
      topic_id: topicId,
      question_text: questionText,
      options: options,
      correct_answer_index: correctAnswerIndex,
      level: level,
    },
  });

  return newQuestion;
};

export const submitQuizService = async (
  userId: string,
  topicId: string,
  answers: UserAnswer[],
) => {

  const questionIds = answers.map((a) => a.questionId);


  const correctAnswers = await prisma.quizQuestion.findMany({
    where: {
      id: { in: questionIds },
    },
    select: {
      id: true,
      correct_answer_index: true,
    },
  });

  const answerMap = new Map<string, number>();
  correctAnswers.forEach((q) => {
    answerMap.set(q.id, q.correct_answer_index);
  });

  let score = 0;
  answers.forEach((userAnswer) => {
    const correctAnswerIndex = answerMap.get(userAnswer.questionId);
    if (userAnswer.answerIndex === correctAnswerIndex) {
      score++;
    }
  });


  const total = answers.length;
  const calculated_difficulty = calculateDifficulty(score, total);

  const existingAttempt = await prisma.quizAttempt.findFirst({
    where: {
      user_id: userId,
      topic_id: topicId,
    },
  });

  let attempt;
  if (existingAttempt) {
    attempt = await prisma.quizAttempt.update({
      where: { id: existingAttempt.id },
      data: {
        score,
        total,
        calculated_difficulty,
      },
    });
  } else {
    attempt = await prisma.quizAttempt.create({
      data: {
        user_id: userId,
        topic_id: topicId,
        score,
        total,
        calculated_difficulty,
      },
    });
  }

  const difficultyResult = attempt.calculated_difficulty;

  console.log("Mencari course dengan syarat:");
  console.log("1. Topic ID:", topicId);
  console.log("2. Difficulty:", difficultyResult);
  console.log("3. Is Published: true");

  const matchedCourse = await prisma.course.findFirst({
    where: {
      topic_id: topicId,
      difficulty: difficultyResult,
      is_published: true,
    },
    include: {
      chapters: { orderBy: { order_index: "asc" } },
    },
  });

  console.log("Hasil Pencarian:", matchedCourse);

  if (!matchedCourse) {
    // Jangan error, tapi beritahu bahwa course belum tersedia
    return {
      score: attempt.score,
      total: attempt.total,
      calculated_difficulty: attempt.calculated_difficulty,
      message: "Course untuk level ini belum tersedia. Silakan cek nanti."
    };
  }

  // [BARU] Enroll User (Cek duplikasi dulu)
  const existingEnrollment = await prisma.selectedCourse.findUnique({
    where: {
      user_id_course_id: { user_id: userId, course_id: matchedCourse.id },
    },
  });

  if (!existingEnrollment) {
    await prisma.selectedCourse.create({
      data: {
        user_id: userId,
        course_id: matchedCourse.id,
        user_score: 0,
      },
    });

    const progressData = matchedCourse.chapters.map((chapter) => ({
      user_id: userId,
      chapter_id: chapter.id,
      is_done: false,
    }));

    await prisma.chapterProgress.createMany({ data: progressData });
  }


  return {
    score: attempt.score,
    total: attempt.total,
    calculated_difficulty: attempt.calculated_difficulty,
    assigned_course: {
      id: matchedCourse.id,
      title: matchedCourse.title
    }
  };
};


function calculateDifficulty(
  score: number,
  total: number,
): CourseDifficulty {
  const percentage = score / total;

  if (percentage <= 0.3) {
    return CourseDifficulty.beginner;
  } else if (percentage <= 0.7) {
    return CourseDifficulty.intermediate;
  } else {
    return CourseDifficulty.advanced;
  }
}