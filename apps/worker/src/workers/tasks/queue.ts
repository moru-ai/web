import { Queue } from "bullmq";
import type { Redis } from "ioredis";

import { TASKS_QUEUE_NAME } from "./consts";
import type { TasksJobData } from "./types";

export function createTasksQueue(connection: Redis) {
  return new Queue<TasksJobData>(TASKS_QUEUE_NAME, {
    connection,
  });
}

export type TasksQueue = Queue<TasksJobData>;
