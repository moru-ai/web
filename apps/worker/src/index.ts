import "dotenv/config";

import Fastify from "fastify";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
  },
});

app.get("/health", async () => {
  return { status: "ok", message: "Hello from worker!" };
});

app.get("/internal/github/test-repos", async (req, reply) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      reply.code(400);
      return { error: "Missing user_id" };
    }
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      reply.code(500);
      return { error: "Missing CONVEX_URL" };
    }
    const client = new ConvexHttpClient(convexUrl);
    const installs = (await client.query(api.github.listInstallationsForUser, {
      userId,
    })) as Array<{ installation?: { installationId?: string } }>;
    const allRepos: Doc<"remote_repositories">[] = [];
    for (const it of installs) {
      const installationId = it.installation?.installationId;
      if (!installationId) continue;
      let cursor: string | null = null;
      let done = false;
      while (!done) {
        const page = (await client.query(api.github.listReposByInstallation, {
          installationId,
          paginationOpts: { numItems: 50, cursor },
        })) as {
          page?: Doc<"remote_repositories">[];
          continueCursor?: string | null;
          isDone?: boolean;
        };
        allRepos.push(...(page.page ?? []));
        cursor = page.continueCursor ?? null;
        done = page.isDone ?? true;
      }
    }
    return { count: allRepos.length, repos: allRepos };
  } catch (err: unknown) {
    req.log.error({ err }, "Error in test-repos");
    reply.code(500);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
});

app
  .listen({ port, host })
  .then((address) => {
    app.log.info({ address }, "Worker health endpoint listening");
  })
  .catch((err) => {
    app.log.error({ err }, "Failed to start worker API");
    process.exitCode = 1;
  });

const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

for (const signal of shutdownSignals) {
  process.on(signal, () => {
    app.log.info({ signal }, "Received shutdown signal");
    app
      .close()
      .then(() => {
        app.log.info("Worker API shut down gracefully");
        process.exit(0);
      })
      .catch((err) => {
        app.log.error({ err }, "Error during shutdown");
        process.exit(1);
      });
  });
}
