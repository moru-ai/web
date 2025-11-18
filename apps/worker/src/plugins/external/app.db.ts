import { ConvexHttpClient } from "convex/browser";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    db: {
      client: ConvexHttpClient;
    };
  }
}

export default fp(
  async (app) => {
    const client = new ConvexHttpClient(app.env.CONVEX_URL);

    app.decorate("db", { client });
  },
  {
    name: "app.db",
    dependencies: ["app.env"],
  },
);
