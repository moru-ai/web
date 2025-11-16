import fp from "fastify-plugin";
import Redis from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: {
      connection: Redis;
    };
  }
}

export default fp(
  async (app) => {
    const connection = new Redis(app.env.REDIS_URL);

    app.decorate("redis", { connection });

    app.addHook("onClose", async () => {
      await connection.quit();
    });
  },
  {
    name: "app.redis",
    dependencies: ["app.env"],
  },
);
