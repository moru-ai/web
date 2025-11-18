import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox";

const CreateTaskSchema = Type.Object({
  taskId: Type.String(),
});

const plugin: FastifyPluginAsyncTypebox = async (app) => {
  app.post(
    "/",
    {
      preHandler: app.authenticate,
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

      console.log("job", job);

      return { jobId: job.id };
    },
  );
};

export default plugin;
