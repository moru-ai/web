import { v } from "convex/values";

import { mutation } from "./_generated/server";

export const addTask = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      text: args.text,
      completed: false,
    });
    return taskId;
  },
});

export const toggleTask = mutation({
  args: {
    taskId: v.id("tasks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      completed: args.completed,
    });
  },
});
