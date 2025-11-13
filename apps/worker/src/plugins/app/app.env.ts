import fastifyEnv from "@fastify/env";
import { Type, type Static } from "@sinclair/typebox";
import fp from "fastify-plugin";

const schema = Type.Object({
  HOST: Type.Optional(Type.String()),
  PORT: Type.Optional(Type.String()),
  LOG_LEVEL: Type.Optional(Type.String()),
  CONVEX_URL: Type.String(),
  REDIS_URL: Type.Optional(Type.String()),
});

declare module "fastify" {
  interface FastifyInstance {
    env: Static<typeof schema>;
  }
}

export default fp(
  async (app) => {
    await app.register(fastifyEnv, {
      confKey: "env",
      schema,
      dotenv: false,
    });
  },
  {
    name: "app.env",
  },
);
