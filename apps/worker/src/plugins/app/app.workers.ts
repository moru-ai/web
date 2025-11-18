import fp from "fastify-plugin";

import { createTasksWorker, type TasksWorker } from "../../workers/tasks/worker";

declare module "fastify" {
  interface FastifyInstance {
    workers: {
      tasks: TasksWorker;
    };
  }
}

export default fp(
  async (app) => {
    const tasksWorker = createTasksWorker(app);

    app.decorate("workers", {
      tasks: tasksWorker,
    });

    app.addHook("onClose", async () => {
      await tasksWorker.close();
    });
  },
  {
    name: "app.workers",
    dependencies: ["app.env", "app.redis"],
  },
);
