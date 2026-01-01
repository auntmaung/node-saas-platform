import { Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: undefined,
});

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

type InviteEmailJob = {
  reqId?: string;
  inviteId: string;
  tenantId: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const worker = new Worker(
  "notifications",
  async (job) => {
    const child = job.data?.reqId ? logger.child({ reqId: job.data.reqId }) : logger;
    child.info({ jobId: job.id, name: job.name }, "Job received");

    if (job.name === "invite.email") {
      const data = job.data as InviteEmailJob;

      // Simulate a flaky external email provider: fail 20% of the time
      if (Math.random() < 0.2) {
        child.warn({ inviteId: data.inviteId }, "Simulated email provider failure");
        throw new Error("EMAIL_PROVIDER_FAILURE");
      }

      // Simulate doing work
      await sleep(300);

      // In real life you'd send an email; for showcase we log the invite link/token
      child.info(
        {
          inviteId: data.inviteId,
          tenantId: data.tenantId,
          to: data.email,
          role: data.role,
          tokenPreview: data.token.slice(0, 12) + "...",
          expiresAt: data.expiresAt,
        },
        "Invite email sent (simulated)"
      );

      return { ok: true };
    }

    logger.warn({ name: job.name }, "Unknown job type");
    return { ignored: true };
  },
  {
    connection,
    concurrency: 10,
  }
);

// BullMQ emits events; log them to show retries/dead-letter behavior
worker.on("completed", (job) => {
  logger.info({ jobId: job.id, name: job.name }, "Job completed");
});

worker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, name: job?.name, attemptsMade: job?.attemptsMade, err: err?.message },
    "Job failed"
  );
});

worker.on("error", (err) => {
  logger.error({ err: err.message }, "Worker error");
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received: closing worker...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received: closing worker...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

logger.info({ redisUrl }, "Worker started");
