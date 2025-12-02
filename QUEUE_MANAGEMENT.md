# Queue Management Guide

## Quick Options to Clear/Manage Chapter Queue Jobs

You now have **3 ways** to clear or inspect the queue:

---

## Option 1: CLI Script (Fastest for bulk operations)

Clear all jobs from the queue with one command:

```powershell
cd d:\Arsal\verto\backend
npx ts-node scripts/clearQueue.ts
```

**What it does:**
- Shows current queue state (waiting, active, completed, failed, delayed counts)
- Deletes all waiting jobs
- Deletes all completed jobs
- Deletes all failed jobs
- Deletes all delayed jobs
- Shows final queue state

**Output:**
```
📊 Current Queue State:
  ⏳ Waiting: 36
  🟢 Active: 0
  ✅ Completed: 0
  ❌ Failed: 0
  ⏱️  Delayed: 0
  📦 Total: 36

🗑️  Clearing waiting jobs...
✅ Deleted 36 waiting jobs
...
✅ Queue cleared successfully!
```

---

## Option 2: API Endpoints (For browser/Postman/frontend)

### 2.1 Get Queue Status
```
GET /api/v1/queue/status
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "waiting": 10,
    "active": 2,
    "completed": 5,
    "failed": 0,
    "delayed": 0,
    "total": 17
  }
}
```

### 2.2 List Jobs by State
```
GET /api/v1/queue/jobs?state=waiting,active,failed
```

**Query params:**
- `state` (optional): comma-separated list of states to show (waiting, active, completed, failed, delayed)
- Default: waiting, active, failed

**Response:**
```json
{
  "status": "success",
  "data": {
    "count": 3,
    "jobs": [
      {
        "id": "cmhrcemle00071m3cb0nowhy3",
        "jobId": "cmhrcemle00071m3cb0nowhy3",
        "data": { "chapterId": "cmhrcemle00071m3cb0nowhy3" },
        "state": "waiting",
        "attempts": 0,
        "maxAttempts": 3,
        "progress": 0
      }
    ]
  }
}
```

### 2.3 Clear All Jobs
```
POST /api/v1/queue/clear
```

**Request body (optional):**
```json
{
  "states": ["waiting", "completed", "failed", "delayed"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Queue cleared",
  "data": {
    "deleted": {
      "waiting": 36,
      "completed": 0,
      "failed": 0,
      "delayed": 0
    },
    "remaining": {
      "waiting": 0,
      "active": 0,
      "completed": 0,
      "failed": 0,
      "delayed": 0
    }
  }
}
```

### 2.4 Delete a Specific Job
```
DELETE /api/v1/queue/job/:jobId
```

**Example:**
```
DELETE /api/v1/queue/job/cmhrcemle00071m3cb0nowhy3
```

**Response:**
```json
{
  "status": "success",
  "message": "Job cmhrcemle00071m3cb0nowhy3 deleted",
  "data": { "deletedJobId": "cmhrcemle00071m3cb0nowhy3" }
}
```

---

## Option 3: Inspect with Script (Already provided)

You already have `src/listJobs.ts` which lists all waiting jobs:

```powershell
npx ts-node src/listJobs.ts
```

Shows:
- waiting: array of job IDs and data
- active: array of active jobs
- completed: count
- failed: count

---

## Which Option to Use?

| Use Case | Option |
|----------|--------|
| **Bulk clear all jobs** | CLI: `scripts/clearQueue.ts` |
| **Check queue health** | API: `GET /api/v1/queue/status` |
| **Inspect specific jobs** | API: `GET /api/v1/queue/jobs` or CLI: `src/listJobs.ts` |
| **Delete one job** | API: `DELETE /api/v1/queue/job/:id` |
| **Delete selective states** | API: `POST /api/v1/queue/clear` (with body) |

---

## Testing from Terminal

### With curl (PowerShell):
```powershell
# Get status
Invoke-WebRequest -Uri http://localhost:3001/api/v1/queue/status -Method GET

# Clear all jobs
Invoke-WebRequest -Uri http://localhost:3001/api/v1/queue/clear -Method POST

# List jobs
Invoke-WebRequest -Uri http://localhost:3001/api/v1/queue/jobs?state=waiting -Method GET
```

### With Postman:
1. Import these as requests in Postman
2. Set method to GET/POST/DELETE as shown
3. Add full URL (e.g., `http://localhost:3001/api/v1/queue/clear`)
4. For POST, add Body (JSON): `{ "states": ["waiting"] }`

---

## Common Commands (Ready to Copy-Paste)

**Clear all waiting jobs via CLI:**
```powershell
cd d:\Arsal\verto\backend; npx ts-node scripts/clearQueue.ts
```

**Check queue status:**
```powershell
curl http://localhost:3001/api/v1/queue/status
```

**Clear waiting jobs via API:**
```powershell
$body = @{ states = @("waiting") } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3001/api/v1/queue/clear -Method POST -ContentType "application/json" -Body $body
```

---

## What to Do Next

1. **Clear the 36 existing jobs:**
   ```powershell
   npx ts-node scripts/clearQueue.ts
   ```

2. **Restart the worker (fresh):**
   ```powershell
   npm run dev:worker
   ```

3. **Create a new course** from the frontend and watch the worker process it.

4. **Check progress** with one of the endpoints or scripts above.

Enjoy the clean queue!
