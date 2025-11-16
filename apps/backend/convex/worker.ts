import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const insertTaskJob = internalAction({
  args: {
    taskId: v.string(),
  },
  handler: async (_ctx, args) => {
    const workerUrl = process.env.WORKER_URL;
    const workerApiKey = process.env.WORKER_API_KEY;

    if (!workerUrl) {
      throw new Error("WORKER_URL is not configured");
    }

    if (!workerApiKey) {
      throw new Error("WORKER_API_KEY is not configured");
    }

    const response = await fetch(`${workerUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerApiKey}`,
      },
      body: JSON.stringify({ taskId: args.taskId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to enqueue worker task: ${response.status} ${errorText}`);
    }
  },
});
