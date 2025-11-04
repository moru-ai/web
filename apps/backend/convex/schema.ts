import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    completed: v.optional(v.boolean()),
    isCompleted: v.optional(v.boolean()),
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
