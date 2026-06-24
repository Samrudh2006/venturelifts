import logger from "./logger.js";

type JobHandler = (payload: any) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export function registerJob(type: string, handler: JobHandler) {
  handlers.set(type, handler);
  logger.info({ jobType: type }, "Job handler registered");
}

export async function enqueueJob(type: string, payload: any) {
  const handler = handlers.get(type);
  if (!handler) {
    logger.warn({ jobType: type }, "No handler registered for job type");
    return;
  }
  try {
    logger.info({ jobType: type }, "Processing job");
    await handler(payload);
    logger.info({ jobType: type }, "Job completed");
  } catch (error: any) {
    logger.error({ jobType: type, err: error }, "Job failed");
  }
}

export async function processJobQueue() {
  logger.info("Job queue processor started");
}

export default { registerJob, enqueueJob, processJobQueue };
