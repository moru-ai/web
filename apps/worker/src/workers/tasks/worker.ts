import { Worker, type WorkerOptions, type Job } from "bullmq";
import type Docker from "dockerode";
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

  const worker = new Worker<TasksJobData>(TASKS_QUEUE_NAME, (job) => handleTaskJob(app, job), options);

  return worker;
}

export type TasksWorker = Worker<TasksJobData>;

async function handleTaskJob(app: FastifyInstance, job: Job<TasksJobData>) {
  const updateStatus = async (status: WorkerTaskStatus) => {
    await app.db.client.mutation(api.worker.updateTaskStatus, {
      taskId: job.data.taskId as Id<"tasks">,
      status,
      apiKey: app.env.CONVEX_WORKER_API_KEY,
    });
  };

  await updateStatus("in_progress");

  const docker = app.docker;
  const image = "ubuntu:22.04";
  const command = [
    "bash",
    "-lc",
    "for i in 1 2 3 4 5; do echo hello world $i; sleep 1; done",
  ];

  let container: Docker.Container | undefined;

  try {
    job.log(`Ensuring Docker image ${image} is available`);
    await pullImage(docker, image);
    job.log(`Image ${image} ready`);

    container = await docker.createContainer({
      Image: image,
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    job.log("Starting container");
    const logStream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    });
    const logPromise = streamContainerLogs(logStream, job);
    await container.start();

    const waitResult = await container.wait();
    await logPromise;

    if (waitResult.StatusCode !== 0) {
      throw new Error(`Container exited with status code ${waitResult.StatusCode}`);
    }

    await updateStatus("success");
  } catch (error) {
    await updateStatus("error");
    throw error;
  } finally {
    if (container) {
      await removeContainer(container, job);
    }
  }
}

async function pullImage(docker: Docker, image: string) {
  const stream = await docker.pull(image);
  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(stream, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function removeContainer(container: Docker.Container, job: Job<TasksJobData>) {
  try {
    await container.remove({ force: true });
    job.log("Container removed");
  } catch (error) {
    job.log(`Failed to remove container: ${(error as Error).message}`);
  }
}

function streamContainerLogs(stream: NodeJS.ReadWriteStream, job: Job<TasksJobData>) {
  stream.resume();

  return new Promise<void>((resolve, reject) => {
    const handleData = (chunk: Buffer | string) => {
      const output = typeof chunk === "string" ? chunk : chunk.toString("utf-8");
      const trimmed = output.trim();
      if (trimmed.length > 0) {
        job.log(trimmed);
      }
    };

    const handleEnd = () => {
      cleanup();
      resolve();
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      stream.off("data", handleData);
      stream.off("end", handleEnd);
      stream.off("error", handleError);
    };

    stream.on("data", handleData);
    stream.once("end", handleEnd);
    stream.once("error", handleError);
  });
}
