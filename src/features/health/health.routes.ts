// src/features/health/health.routes.ts
import express, { Router } from 'express';
import { chapterQueue } from '../../shared/chapterQueue';

const router = Router();

router.get('/health/redis', async (req, res) => {
  try {
    // Test Redis connection through Bull queue
    const isConnected = await chapterQueue.client.ping();
    
    res.status(200).json({
      status: 'connected',
      redis: isConnected === 'PONG',
      queueName: 'chapter',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;