// scripts/listJobs.ts
import 'dotenv/config';
import { chapterQueue } from './shared/chapterQueue';


(async () => {
  try {
    const waiting = await chapterQueue.getJobs(['waiting']);
    const active = await chapterQueue.getJobs(['active']);
    const completed = await chapterQueue.getJobs(['completed']);
    const failed = await chapterQueue.getJobs(['failed']);

    console.log('waiting:', waiting.map(j => ({ id: j.id, jobId: j.opts?.jobId || j.id, data: j.data })));
    console.log('active:', active.map(j => ({ id: j.id, jobId: j.opts?.jobId || j.id, data: j.data })));
    console.log('completed:', completed.map(j => ({ id: j.id })));
    console.log('failed:', failed.map(j => ({ id: j.id })));

    await chapterQueue.close();
    process.exit(0);
  } catch (err) {
    console.error('Error listing jobs:', err);
    process.exit(1);
  }
})();