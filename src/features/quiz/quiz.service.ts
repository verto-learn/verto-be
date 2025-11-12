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

  // Opsional: Anda bisa cek dulu apakah topicId valid/ada di db
  // const topicExists = await prisma.topic.findUnique({ where: { id: topicId } });
  // if (!topicExists) {
  //   throw new APIError("Topic not found", 404);
  // }

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


  return {
    score: attempt.score,
    total: attempt.total,
    calculated_difficulty: attempt.calculated_difficulty,
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