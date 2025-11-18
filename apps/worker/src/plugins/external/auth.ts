import { timingSafeEqual } from "node:crypto";
import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest as FastifyRequestType } from "fastify";

type AuthenticateHook = (request: FastifyRequestType, reply: FastifyReply) => Promise<void>;

declare module "fastify" {
  interface FastifyInstance {
    authenticate: AuthenticateHook;
  }
}

export default fp(
  async (app) => {
    app.decorate("authenticate", async (request, reply) => {
      const header = request.headers.authorization;
      const bearerPrefix = "Bearer ";

      if (!header?.startsWith(bearerPrefix)) {
        return reply.code(401).send({ error: "Missing Authorization header" });
      }

      const providedKey = header.slice(bearerPrefix.length).trim();
      const expectedKey = app.env.WORKER_API_KEY;

      const providedBuffer = Buffer.from(providedKey);
      const expectedBuffer = Buffer.from(expectedKey);

      const keysMatch =
        providedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(providedBuffer, expectedBuffer);

      if (!keysMatch) {
        return reply.code(401).send({ error: "Invalid worker API key" });
      }
    });
  },
  {
    name: "auth",
    dependencies: ["app.env"],
  },
);
