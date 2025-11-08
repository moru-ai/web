import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const commonMetadata = v.optional(v.record(v.string(), v.any()));

const contentText = v.object({
  contentType: v.literal("text"),
  parts: v.array(v.string()),
  metadata: commonMetadata,
});

export default defineSchema({
  tasks: defineTable({
    title: v.optional(v.string()),
    repo: v.id("remote_repositories"),
    branch: v.string(),
    status: v.union(
      v.literal("initializing"),
      v.literal("idle"),
      v.literal("in_progress"),
      v.literal("success"),
      v.literal("error"),
    ),
    metadata: commonMetadata,
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  task_messages: defineTable({
    task: v.id("tasks"),
    parent: v.union(v.id("task_messages"), v.null()),
    children: v.array(v.id("task_messages")),
    content: v.union(contentText),
    author: v.object({
      role: v.union(v.literal("system"), v.literal("assistant"), v.literal("user")),
      name: v.union(v.string(), v.null()),
      metadata: commonMetadata,
    }),
    metadata: commonMetadata,
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  // GitHub App integration tables (system of record)
  github_installations: defineTable({
    installationId: v.string(),
    accountLogin: v.string(),
    appSlug: v.string(),
    userId: v.string(),
    connected: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_installationId", ["installationId"])
    .index("by_accountLogin", ["accountLogin"])
    .index("by_userId", ["userId"]),

  remote_repositories: defineTable({
    repoId: v.number(),
    fullName: v.string(), // owner/name
    name: v.string(),
    owner: v.string(),
    private: v.boolean(),
    defaultBranch: v.optional(v.union(v.string(), v.null())),
    visibility: v.optional(v.string()),
    provider: v.literal("github"),
    installationId: v.string(), // FK to github_installations.installationId
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.string(), // FK to users.id
  })
    .index("by_installationId", ["installationId"])
    .index("by_fullName", ["fullName"])
    .index("by_repoId", ["repoId"]),

  // github_connections table removed; merged into github_installations via `connected` flag
});
