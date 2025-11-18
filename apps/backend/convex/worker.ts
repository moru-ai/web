import { v } from "convex/values";
import { internalAction, mutation } from "./_generated/server";
import { taskStatusField } from "./schema";

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

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: taskStatusField,
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedApiKey = process.env.WORKER_CONVEX_API_KEY;

    if (!expectedApiKey) {
      throw new Error("WORKER_CONVEX_API_KEY is not configured");
    }

    if (args.apiKey !== expectedApiKey) {
      throw new Error("Unauthorized worker request");
    }

    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
