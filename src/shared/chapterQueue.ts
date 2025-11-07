import Bull, { Job } from "bull";
import config from "../config/config";
import prisma from "../database/database";
import { chapterPrompt } from "./getPrompt";
import { textGeminiModel } from "./geminiAI";
import { getLinkYoutubeVideo } from "./getYoutubeVideo";

export type GeneratedChapterContentRequest = {
  chapterId: string;
};

export const chapterQueue = new Bull("chapter", {
  redis: {
    port: config.redisPort,
    host: config.redisHost,
    password: config.redisPassword,
    username: config.redisUsername,
    db: config.redisDb,
  },
  defaultJobOptions: {
    attempts: 3,
  },
});

export const generateChapterContent = async (
  chapter: GeneratedChapterContentRequest,
) => {
  console.log("Adding chapter to queue:", chapter);
  await chapterQueue.add(chapter, {
    jobId: chapter.chapterId,
    removeOnComplete: true,
  });
};

export const processChapterQueue = async (
  job: Job<GeneratedChapterContentRequest>,
) => {
  console.log("Get job data", job.data);
  const { chapterId } = job.data;

  const chapter = await prisma.chapter.findUnique({
    where: {
      id: chapterId,
    },
    include: {
      course: {
        include: {
          topic: true,
        },
      },
    },
  });

  if (!chapter) {
    return Promise.reject(new Error(`Chapter with ID ${chapterId} not found`));
  }

  if (chapter.content) {
    console.log(`Chapter with ID ${chapterId} already has content, skipping.`);
    return Promise.resolve();
  }

  const prompt = chapterPrompt(
    chapter.course.title,
    chapter.course.description,
    chapter.title,
    chapter.description,
    chapter.order_index,
    chapter.is_study_case,
  );

  try {
    const responseModel = await textGeminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "text/plain",
      },
    });

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        content: responseModel.response.text(),
        is_active: true,
      },
    });
  } catch (error: any) {
    return Promise.reject(
      new Error(error || "Failed to parse generated content"),
    );
  }

  if (chapter.is_study_case) return Promise.resolve();

  try {
    const linkYoutubeVideo = await getLinkYoutubeVideo(chapter.title);
    console.log(
      "Chapter id: ",
      chapterId,
      "YouTube video link:",
      linkYoutubeVideo,
    );

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        video_url: linkYoutubeVideo.url,
        video_url_embed: linkYoutubeVideo.url_embed,
      },
    });
  } catch (error) {
    console.log("Failed to get YouTube video link:", error);
    return Promise.resolve();
  }

  return Promise.resolve();
};