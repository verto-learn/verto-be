import 'dotenv/config';
import path from 'path';
import { Job } from 'bull';
import config from './config/config';
import { GeneratedChapterContentRequest } from './shared/chapterQueue';
import { gradingQueue, processGradingQueue } from './shared/gradingQueue';

console.log(`[WORKER] 🚀 Worker process started`);
console.log(`[WORKER] Loaded .env from: ${path.resolve(process.cwd(), '.env')}`);

console.log(`[WORKER] ENV CHECK:`);
console.log(`   REDIS_HOST = ${process.env.REDIS_HOST}`);
console.log(`   REDIS_PORT = ${process.env.REDIS_PORT}`);
console.log(`   REDIS_DB   = ${process.env.REDIS_DB}`);

console.log(`[WORKER] ✅ Using Redis host=${config.redisHost}, port=${config.redisPort}, db=${config.redisDb}`);

async function main() {
  const { chapterQueue, processChapterQueue } = await import('./shared/chapterQueue');

  console.log("[WORKER] 🔧 Setting up queue processor with concurrency=10...");
  chapterQueue.process(10, processChapterQueue);
  console.log("[WORKER] ✅ Queue processor ready");

  chapterQueue.on("connect", () => {
    console.log("[WORKER] ✅ Redis queue connected successfully");
  });

  chapterQueue.on("ready", () => {
    console.log("[WORKER] 🟢 Queue is ready to process jobs");
  });

  chapterQueue.on("completed", (job: Job<GeneratedChapterContentRequest>) => {
    console.log(`[WORKER] ✅ COMPLETED - Chapter ${job.data.chapterId}`);
  });

  chapterQueue.on("failed", (job: Job<GeneratedChapterContentRequest>, err: any) => {
    console.error(`[WORKER] ❌ FAILED - Chapter ${job.data.chapterId} - Error: ${err.message}`);
  });

  chapterQueue.on("active", (job: any) => {
    const id = job?.data?.chapterId ?? job?.id ?? job;
    console.log(`[WORKER] 🟢 ACTIVE - Processing chapter ${id}`);
  });

  chapterQueue.on("waiting", (jobId: string) => {
    console.log(`[WORKER] ⏳ WAITING - Job ${jobId} is waiting in queue`);
  });

  chapterQueue.on("error", (err) => {
    console.error("[WORKER] 🔴 Queue Error:", err.message);
  });

  process.on("uncaughtException", (err) => {
    console.error("[WORKER] 🔥 uncaughtException:", err);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[WORKER] 💥 unhandledRejection:", reason);
  });

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

  gradingQueue.process(processGradingQueue);
}

main().catch((err) => {
  console.error("[WORKER] ❌ Failed to start worker:", err);
  process.exit(1);
});
