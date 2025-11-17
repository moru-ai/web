import { Worker, type WorkerOptions } from "bullmq";
import { FastifyInstance } from "fastify";

import { api } from "@moru/convex/_generated/api";
import type { Doc, Id } from "@moru/convex/_generated/dataModel";
import { TASKS_QUEUE_NAME, TASKS_WORKER_CONCURRENCY } from "./consts";
import type { TasksJobData } from "./types";

type WorkerTaskStatus = Doc<"tasks">["status"];

export function createTasksWorker(app: FastifyInstance) {
  const options: WorkerOptions = {
    concurrency: TASKS_WORKER_CONCURRENCY,
    connection: app.redis.connection,
  };

  const worker = new Worker<TasksJobData>(
    TASKS_QUEUE_NAME,
    async (job) => {
      const updateStatus = async (status: WorkerTaskStatus) => {
        await app.db.client.mutation(api.worker.updateTaskStatus, {
          taskId: job.data.taskId as Id<"tasks">,
          status,
          apiKey: app.env.CONVEX_WORKER_API_KEY,
        });
      };

      await updateStatus("in_progress");

      try {
        job.log("job start");
        job.log("job end");

        await updateStatus("success");
      } catch (error) {
        await updateStatus("error");
        throw error;
      }
    },
    options,
  );

  return worker;
}

export type TasksWorker = Worker<TasksJobData>;
