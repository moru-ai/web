import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox";

const CreateTaskSchema = Type.Object({
  taskId: Type.String(),
});

const plugin: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    "/",
    {
      schema: {
        body: CreateTaskSchema,
        response: {
          200: Type.Object({
            jobId: Type.Optional(Type.String()),
          }),
        },
      },
    },
    async (request) => {
      const { taskId } = request.body;

      const job = await app.queues.tasks.add(taskId, {
        taskId,
      });

      return { jobId: job.id };
    },
  );
};

export default plugin;
