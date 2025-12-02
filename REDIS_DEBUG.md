# Redis Queue Debugging Guide

## Problem: Worker shows "Worker started" but doesn't process jobs

### Step 1: Check Redis Connection

Run the diagnostic script:

```powershell
npx ts-node diagnostic.ts
```

Expected output:
```
✅ Ping response: PONG
✅ Queue count: X jobs
✅ All tests passed! Redis is connected properly.
```

If you see errors, check your `.env` file for correct Redis credentials.

---

### Step 2: Check Logs in Correct Order

#### Terminal 1 - Server logs
```powershell
npm run dev
```

Expected when creating a course:
```
[QUEUE] 📝 Adding chapter to queue: chapter-id-123
[QUEUE] ✅ Chapter queued successfully: chapter-id-123
```

#### Terminal 2 - Worker logs
```powershell
npm run dev:worker
```

Expected:
```
Worker started
[REDIS] ✅ Queue connected to Redis successfully
[REDIS] ✅ Queue is ready to process jobs
```

After jobs are queued:
```
[WORKER] ⏳ WAITING - Chapter chapter-id-123 is waiting in queue
[WORKER] 🟢 ACTIVE - Processing chapter chapter-id-123
[WORKER] 🚀 Processing job: chapter-id-123
[WORKER] 💾 Saving generated content to database...
[WORKER] ✅ Content generated successfully for: chapter-id-123
[WORKER] ✅ Job completed successfully: chapter-id-123
```

---

### Step 3: Common Issues & Solutions

#### ❌ Issue: "Worker started" but nothing else
**Solution:** Worker can't connect to Redis

Check:
1. Is Redis running? (Run diagnostic.ts)
2. Are Redis credentials correct in `.env`?
3. Is there a firewall blocking the Redis port?

#### ❌ Issue: "[QUEUE] Adding chapter to queue" appears but worker doesn't process
**Solution:** Server and Worker are connecting to different Redis instances OR connection is dropping

Check:
1. Both are using the same `.env` file
2. Redis credentials match exactly
3. Run `npm run dev:worker` AFTER `npm run dev`

#### ❌ Issue: "Error adding chapter to queue"
**Solution:** Server can't connect to Redis

Check:
1. Run diagnostic.ts
2. Verify `.env` Redis configuration
3. Check if Redis service is running

---

### Step 4: Test End-to-End

1. **Terminal 1** - Start server:
   ```powershell
   npm run dev
   ```

2. **Terminal 2** - Start worker:
   ```powershell
   npm run dev:worker
   ```

3. **Frontend** - Go to Quiz page and:
   - Select topic
   - Complete quiz
   - Click "Generate Course"

4. **Check both terminals** for logs

---

### Step 5: Database Verification

After processing, check if chapters were updated:

```sql
SELECT id, title, content, video_url 
FROM "Chapter" 
WHERE id = 'chapter-id-123';
```

If `content` and `video_url` are populated, the job succeeded.

---

### Step 6: Queue Status Monitoring

You can also manually check queue status:

```powershell
# Add this temporary endpoint to your API
POST /api/v1/queue/status

# Response should show:
{
  "waiting": 0,
  "active": 0,
  "completed": 15,
  "failed": 0,
  "delayed": 0
}
```

---

## Redis Connection String Format

Make sure your `.env` has:
```properties
REDIS_HOST=redis-18272.c334.asia-southeast2-1.gce.redns.redis-cloud.com
REDIS_PORT=18272
REDIS_USERNAME=default
REDIS_PASSWORD=2kxA6hZzOcd3t5Az2IGOiPXUGmd1gZjJ
REDIS_DB=0
```

All parameters must match exactly.

---

## Contact Redis Provider

If diagnostic fails with connection error:
1. Log into Redis Cloud console
2. Verify database is running
3. Check IP whitelist (add your current IP)
4. Verify credentials match
