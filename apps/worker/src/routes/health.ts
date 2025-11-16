import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox";

const healthRoute: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: Type.Object({
            ok: Type.Boolean(),
          }),
        },
      },
    },
    async () => {
      return { ok: true };
    },
  );
};

export default healthRoute;
