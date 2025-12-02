/**
 * Script to clear/delete all jobs from the chapter queue
 * Usage: npx ts-node scripts/clearQueue.ts
 */

import 'dotenv/config';
import { chapterQueue } from '../src/shared/chapterQueue';

const clearQueue = async () => {
  try {
    console.log('🔍 Fetching queue statistics...');
    const counts = {
      waiting: await chapterQueue.getWaitingCount(),
      active: await chapterQueue.getActiveCount(),
      completed: await chapterQueue.getCompletedCount(),
      failed: await chapterQueue.getFailedCount(),
      delayed: await chapterQueue.getDelayedCount(),
    };

    console.log('\n📊 Current Queue State:');
    console.log(`  ⏳ Waiting: ${counts.waiting}`);
    console.log(`  🟢 Active: ${counts.active}`);
    console.log(`  ✅ Completed: ${counts.completed}`);
    console.log(`  ❌ Failed: ${counts.failed}`);
    console.log(`  ⏱️  Delayed: ${counts.delayed}`);
    console.log(`  📦 Total: ${Object.values(counts).reduce((a, b) => a + b, 0)}\n`);

    // Option 1: Clear waiting jobs
    console.log('🗑️  Clearing waiting jobs...');
    const waitingJobs = await chapterQueue.getJobs(['waiting']);
    for (const job of waitingJobs) {
      await job.remove();
    }
    console.log(`✅ Deleted ${waitingJobs.length} waiting jobs`);

    // Option 2: Clear completed jobs
    console.log('🗑️  Clearing completed jobs...');
    const completedJobs = await chapterQueue.getJobs(['completed']);
    for (const job of completedJobs) {
      await job.remove();
    }
    console.log(`✅ Deleted ${completedJobs.length} completed jobs`);

    // Option 3: Clear failed jobs
    console.log('🗑️  Clearing failed jobs...');
    const failedJobs = await chapterQueue.getJobs(['failed']);
    for (const job of failedJobs) {
      await job.remove();
    }
    console.log(`✅ Deleted ${failedJobs.length} failed jobs`);

    // Option 4: Clear delayed jobs
    console.log('🗑️  Clearing delayed jobs...');
    const delayedJobs = await chapterQueue.getJobs(['delayed']);
    for (const job of delayedJobs) {
      await job.remove();
    }
    console.log(`✅ Deleted ${delayedJobs.length} delayed jobs`);

    console.log('\n📊 Final Queue State:');
    const finalCounts = {
      waiting: await chapterQueue.getWaitingCount(),
      active: await chapterQueue.getActiveCount(),
      completed: await chapterQueue.getCompletedCount(),
      failed: await chapterQueue.getFailedCount(),
      delayed: await chapterQueue.getDelayedCount(),
    };
    console.log(`  ⏳ Waiting: ${finalCounts.waiting}`);
    console.log(`  🟢 Active: ${finalCounts.active}`);
    console.log(`  ✅ Completed: ${finalCounts.completed}`);
    console.log(`  ❌ Failed: ${finalCounts.failed}`);
    console.log(`  ⏱️  Delayed: ${finalCounts.delayed}`);
    console.log(`  📦 Total: ${Object.values(finalCounts).reduce((a, b) => a + b, 0)}\n`);

    console.log('✅ Queue cleared successfully!\n');
    await chapterQueue.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error clearing queue:', error.message);
    try {
      await chapterQueue.close();
    } catch (e) {}
    process.exit(1);
  }
};

clearQueue();
