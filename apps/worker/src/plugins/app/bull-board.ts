import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import fp from "fastify-plugin";

const BULL_BOARD_PATH = "/admin/bull";

export default fp(
  async (app) => {
    const queueAdapters = Object.values(app.queues).map((queue) => new BullMQAdapter(queue));

    const serverAdapter = new FastifyAdapter();

    createBullBoard({
      queues: queueAdapters,
      serverAdapter,
    });

    serverAdapter.setBasePath(BULL_BOARD_PATH);

    await app.register(serverAdapter.registerPlugin(), {
      prefix: BULL_BOARD_PATH,
    });

    app.log.info({ basePath: BULL_BOARD_PATH }, "Bull Board mounted");
  },
  {
    name: "bull-board",
    dependencies: ["app.env", "app.queues"],
  },
);
