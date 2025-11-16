import fp from "fastify-plugin";

import { createTasksQueue, TasksQueue } from "../../workers/tasks/queue";

declare module "fastify" {
  interface FastifyInstance {
    queues: {
      tasks: TasksQueue;
    };
  }
}

export default fp(
  async (app) => {
    const tasksQueue = createTasksQueue(app.redis.connection);

    app.decorate("queues", {
      tasks: tasksQueue,
    });

    app.addHook("onClose", async () => {
      await tasksQueue.close();
    });
  },
  {
    name: "app.queues",
    dependencies: ["app.env", "app.redis"],
  },
);
