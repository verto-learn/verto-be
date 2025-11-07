type Job = () => Promise<void>;

class InMemoryQueue {
  private q: Job[] = [];
  private running = false;

  push(job: Job) {
    this.q.push(job);
    this.run();
  }

  private async run() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.q.length) {
        const job = this.q.shift()!;
        try {
          await job();
        } catch (e) {
          console.error("[Queue] job failed:", (e as Error).message);
        }
      }
    } finally {
      this.running = false;
    }
  }
}

export const queue = new InMemoryQueue();