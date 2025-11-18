import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserIdentityOrThrow } from "./auth.helper";

export const createTask = mutation({
  args: {
    prompt: v.string(),
    repo: v.id("remote_repositories"),
    branch: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentityOrThrow(ctx);
    const userId = identity.id as string;

    const taskId = await ctx.db.insert("tasks", {
      title: args.prompt.slice(0, 100),
      repo: args.repo,
      branch: args.branch,
      status: "initializing",
      createdAt: Date.now(),
      metadata: {},
      userId,
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

    await ctx.scheduler.runAfter(0, internal.worker.insertTaskJob, {
      taskId: taskId,
    });

    return taskId;
  },
  returns: v.id("tasks"),
});

export const listTasksForUser = query({
  handler: async (ctx) => {
    const identity = await getUserIdentityOrThrow(ctx);
    const userId = identity.id as string;

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    const repoIds = Array.from(new Set(tasks.map((task) => task.repo)));
    const repoDocs = await Promise.all(repoIds.map((repoId) => ctx.db.get(repoId)));
    const repoById = new Map(repoIds.map((repoId, index) => [repoId, repoDocs[index]]));

    return tasks.map((task) => ({
      taskId: task._id,
      title: task.title ?? null,
      branch: task.branch,
      createdAt: task.createdAt,
      repoFullName: repoById.get(task.repo)?.fullName ?? null,
      status: task.status,
    }));
  },
  returns: v.array(
    v.object({
      taskId: v.id("tasks"),
      title: v.union(v.string(), v.null()),
      branch: v.string(),
      createdAt: v.number(),
      repoFullName: v.union(v.string(), v.null()),
      status: v.union(
        v.literal("initializing"),
        v.literal("idle"),
        v.literal("in_progress"),
        v.literal("success"),
        v.literal("error"),
      ),
    }),
  ),
});
