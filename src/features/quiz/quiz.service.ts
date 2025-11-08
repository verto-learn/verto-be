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
    ...byLevel.beginner.slice(0, 2),
    ...byLevel.intermediate.slice(0, 2),
    ...byLevel.advanced.slice(0, 1),
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

  // 7. Kembalikan hasilnya
  return {
    score: attempt.score,
    total: attempt.total,
    calculated_difficulty: attempt.calculated_difficulty,
  };
};

/**
 * Helper function untuk memetakan skor ke level
 */
function calculateDifficulty(
  score: number,
  total: number,
): CourseDifficulty {
  const percentage = score / total;

  if (percentage <= 0.3) { // 0-1 dari 5 soal
    return CourseDifficulty.beginner;
  } else if (percentage <= 0.7) { // 2-3 dari 5 soal
    return CourseDifficulty.intermediate;
  } else { // 4-5 dari 5 soal
    return CourseDifficulty.advanced;
  }
}