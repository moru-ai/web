import { Worker, type WorkerOptions } from "bullmq";

import { TASKS_QUEUE_NAME, TASKS_WORKER_CONCURRENCY } from "./consts";
import type { TasksJobData } from "./types";
import { FastifyInstance } from "fastify";

export function createTasksWorker(app: FastifyInstance) {
  const options: WorkerOptions = {
    concurrency: TASKS_WORKER_CONCURRENCY,
    connection: app.redis.connection,
  };

  const worker = new Worker<TasksJobData>(
    TASKS_QUEUE_NAME,
    async (job) => {
      job.log("job start");
      console.log("hello world");
      console.log(app.env.CONVEX_URL);
      job.log("job end");
    },
    options,
  );

  return worker;
}

export type TasksWorker = Worker<TasksJobData>;
