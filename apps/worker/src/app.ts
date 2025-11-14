import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export const options = {
  ajv: {
    customOptions: {
      coerceTypes: "array",
      removeAdditional: "all",
    },
  },
};

export default async function serviceApp(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/app"),
    maxDepth: 1,
    indexPattern: /.+/,
    forceESM: true,
    options: { ...opts },
  });

  fastify.get("/health", () => {
    return { ok: true };
  });
}
