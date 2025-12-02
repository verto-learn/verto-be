import express, { Router, Request, Response, NextFunction } from 'express';
import { chapterQueue } from '../../shared/chapterQueue';

const router = Router();

router.get('/queue/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = {
      waiting: await chapterQueue.getWaitingCount(),
      active: await chapterQueue.getActiveCount(),
      completed: await chapterQueue.getCompletedCount(),
      failed: await chapterQueue.getFailedCount(),
      delayed: await chapterQueue.getDelayedCount(),
    };

    return res.status(200).json({
      status: 'success',
      data: {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/queue/jobs - List jobs by state
 * Query params: state=waiting|active|completed|failed|delayed (optional, comma-separated)
 */
router.get('/queue/jobs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stateParam = req.query.state as string | undefined;
    const states = stateParam ? stateParam.split(',').map(s => s.trim()) : ['waiting', 'active', 'failed'];

    const jobs = await chapterQueue.getJobs(states as any, 0, -1);

    return res.status(200).json({
      status: 'success',
      data: {
        count: jobs.length,
        jobs: jobs.map(job => ({
          id: job.id,
          jobId: job.opts?.jobId || job.id,
          data: job.data,
          state: job.getState(),
          attempts: job.attemptsMade,
          maxAttempts: job.opts?.attempts,
          progress: job.progress(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/queue/clear - Clear all jobs from the queue
 * Body: { states: ['waiting', 'completed', 'failed', 'delayed'] } (optional)
 */
router.post('/queue/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { states } = req.body || {};
    const statesToClear = states || ['waiting', 'completed', 'failed', 'delayed'];

    const results: Record<string, number> = {};

    for (const state of statesToClear) {
      const jobs = await chapterQueue.getJobs([state], 0, -1);
      for (const job of jobs) {
        await job.remove();
      }
      results[state] = jobs.length;
    }

    const finalCounts = {
      waiting: await chapterQueue.getWaitingCount(),
      active: await chapterQueue.getActiveCount(),
      completed: await chapterQueue.getCompletedCount(),
      failed: await chapterQueue.getFailedCount(),
      delayed: await chapterQueue.getDelayedCount(),
    };

    return res.status(200).json({
      status: 'success',
      message: 'Queue cleared',
      data: {
        deleted: results,
        remaining: finalCounts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/queue/job/:jobId - Delete a specific job
 */
router.delete('/queue/job/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = await chapterQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: `Job ${jobId} not found`,
      });
    }

    await job.remove();

    return res.status(200).json({
      status: 'success',
      message: `Job ${jobId} deleted`,
      data: { deletedJobId: jobId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
