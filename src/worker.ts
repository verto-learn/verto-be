import { Job } from "bull";
import {
  chapterQueue,
  GeneratedChapterContentRequest,
  processChapterQueue,
} from "./shared/chapterQueue";

console.log("Worker started");

chapterQueue.process(10, processChapterQueue);

chapterQueue.on("completed", (job: Job<GeneratedChapterContentRequest>) => {
  console.log(
    `Generated content for chapter ID ${job.data.chapterId} is completed.`,
  );
});

chapterQueue.on(
  "failed",
  (job: Job<GeneratedChapterContentRequest>, err: any) => {
    console.error(
      `Generated content for chapter ID ${job.data.chapterId} is failed!! error: ${err}`,
      err,
    );
  },
);

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing Bull queue...");
  await chapterQueue.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing Bull queue...");
  await chapterQueue.close();
  process.exit(0);
});