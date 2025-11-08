import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createTask = mutation({
  args: {
    prompt: v.string(),
    repo: v.id("remote_repositories"),
    branch: v.string(),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.prompt.slice(0, 100),
      repo: args.repo,
      branch: args.branch,
      status: "idle",
      createdAt: Date.now(),
      metadata: {},
    });

    await ctx.db.insert("task_messages", {
      task: taskId,
      parent: null,
      children: [],
      createdAt: Date.now(),
      content: {
        contentType: "text",
        parts: [args.prompt],
        metadata: {},
      },
      author: {
        role: "user",
        name: null,
        metadata: {},
      },
    });

    return taskId;
  },
  returns: v.id("tasks"),
});
