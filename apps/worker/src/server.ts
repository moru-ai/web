import "dotenv-safe/config";
import Fastify from "fastify";
import fp from "fastify-plugin";

// Import your application as a normal plugin.
import serviceApp from "./app";

/**
 * Do not use NODE_ENV to determine what logger (or any env related feature) to use
 * @see {@link https://www.youtube.com/watch?v=HMM7GJC5E2o}
 */
function getLoggerOptions() {
  // Only if the program is running in an interactive terminal
  if (process.stdout.isTTY) {
    return {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    };
  }

  return { level: process.env.LOG_LEVEL ?? "silent" };
}

const app = Fastify({
  logger: getLoggerOptions(),
  ajv: {
    customOptions: {
      coerceTypes: "array", // change type of data to match type keyword
      removeAdditional: "all", // Remove additional body properties
    },
  },
});

async function init() {
  app.register(fp(serviceApp));

  await app.ready();

  try {
    app.listen({ port: Number(process.env.PORT ?? 4000) });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

init();
