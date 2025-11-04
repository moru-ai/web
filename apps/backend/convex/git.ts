import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { getUserIdentityOrThrow } from './auth.helper';

export const listInstallationsForUser = query({
  handler: async (ctx) => {
    const identity = await getUserIdentityOrThrow(ctx);
    const userId = identity.id;

    // With merged schema, use github_installations filtered by userId
    const installs = await ctx.db
      .query('github_installations')
      .filter((f) => f.eq(f.field('userId'), userId))
      .collect();

    const results = [] as Array<{
      connectionId: string;
      status: 'connected' | 'disconnected';
      selectedRepoFullName: string | null | undefined;
      installation:
        | (Omit<Doc<'github_installations'>, '_id' | '_creationTime'> & {
            _id: Id<'github_installations'>;
            _creationTime: number;
          })
        | null;
    }>;

    for (const inst of installs) {
      results.push({
        connectionId: inst._id as unknown as string,
        status: inst.connected ? 'connected' : 'disconnected',
        selectedRepoFullName: null,
        installation: inst,
      });
    }
    return results;
  },
});

export const getInstallationByUserId = query({
  handler: async (ctx) => {
    const identity = await getUserIdentityOrThrow(ctx);
    const userId = identity.id as string;
    const installation = await ctx.db
      .query('github_installations')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();
    return installation;
  },
});

export const listReposByInstallation = query({
  args: {
    installationId: v.string(),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getUserIdentityOrThrow(ctx);

    let q = ctx.db
      .query('remote_repositories')
      .withIndex('by_installationId', (q) => q.eq('installationId', args.installationId))
      .filter((f) => f.eq(f.field('provider'), 'github'));

    // Basic exact-match filtering for MVP; avoid full scans.
    if (args.search) {
      const term = args.search;
      q = q.filter((f) => f.or(f.eq(f.field('fullName'), term), f.eq(f.field('name'), term)));
    }

    return await q.order('desc').paginate(args.paginationOpts);
  },
});

export const listRepositories = query({
  handler: async (ctx) => {
    const identity = await getUserIdentityOrThrow(ctx);
    const userId = identity.id as string;

    const repositories = await ctx.db
      .query('remote_repositories')
      .filter((f) => f.eq(f.field('userId'), userId))
      .collect();

    return repositories;
  },
});

export const upsertInstallation = mutation({
  args: {
    installationId: v.string(),
    accountLogin: v.string(),
    appSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentityOrThrow(ctx);

    const userId = identity.id as string;
    const now = Date.now();
    const existing = await ctx.db
      .query('github_installations')
      .withIndex('by_installationId', (q) => q.eq('installationId', args.installationId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accountLogin: args.accountLogin,
        appSlug: args.appSlug,
        userId: userId,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert('github_installations', {
      installationId: args.installationId,
      accountLogin: args.accountLogin,
      appSlug: args.appSlug,
      userId: userId,
      connected: true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const upsertRepositories = mutation({
  args: {
    installationId: v.string(),
    repos: v.array(
      v.object({
        repoId: v.number(),
        fullName: v.string(),
        name: v.string(),
        owner: v.string(),
        private: v.boolean(),
        defaultBranch: v.optional(v.union(v.string(), v.null())),
        visibility: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentityOrThrow(ctx);

    const userId = identity.id as string;

    const now = Date.now();
    for (const r of args.repos) {
      const existing = await ctx.db
        .query('remote_repositories')
        .withIndex('by_repoId', (q) => q.eq('repoId', r.repoId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          fullName: r.fullName,
          name: r.name,
          owner: r.owner,
          private: r.private,
          defaultBranch: r.defaultBranch ?? null,
          visibility: r.visibility,
          provider: 'github',
          installationId: args.installationId,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert('remote_repositories', {
          repoId: r.repoId,
          fullName: r.fullName,
          name: r.name,
          owner: r.owner,
          private: r.private,
          defaultBranch: r.defaultBranch ?? null,
          visibility: r.visibility,
          provider: 'github',
          installationId: args.installationId,
          createdAt: now,
          updatedAt: now,
          userId: userId,
        });
      }
    }
    return { count: args.repos.length };
  },
});

export const disconnectInstallationForUser = mutation({
  args: {
    installationId: v.string(),
    removeRepos: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await getUserIdentityOrThrow(ctx);
    const { installationId, removeRepos } = args;
    const userId = identity.id as string;

    const inst = await ctx.db
      .query('github_installations')
      .withIndex('by_installationId', (q) => q.eq('installationId', installationId))
      .unique();

    if (!inst || (inst.userId && inst.userId !== userId)) {
      return { updated: false };
    }

    await ctx.db.patch(inst._id, { connected: false, updatedAt: Date.now() });

    if (removeRepos) {
      // Best-effort cleanup of repos for the installation
      const toDelete = await ctx.db
        .query('remote_repositories')
        .withIndex('by_installationId', (q) => q.eq('installationId', installationId))
        .collect();
      for (const r of toDelete) {
        await ctx.db.delete(r._id);
      }
    }
    return { updated: true };
  },
});

export const disconnectInstallation = mutation({
  args: {
    installationId: v.string(),
    removeRepos: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getUserIdentityOrThrow(ctx);
    const { installationId, removeRepos } = args;

    const inst = await ctx.db
      .query('github_installations')
      .withIndex('by_installationId', (q) => q.eq('installationId', installationId))
      .unique();
    if (inst) {
      await ctx.db.patch(inst._id, { connected: false, updatedAt: Date.now() });
    }

    if (removeRepos) {
      const repos = await ctx.db
        .query('remote_repositories')
        .withIndex('by_installationId', (q) => q.eq('installationId', installationId))
        .collect();
      for (const r of repos) {
        await ctx.db.delete(r._id);
      }
    }
    return { updated: true, connections: 1 };
  },
});

export const removeRepositoriesByRepoId = mutation({
  args: {
    installationId: v.string(),
    repoIds: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await getUserIdentityOrThrow(ctx);
    const { installationId, repoIds } = args;

    let removed = 0;
    for (const repoId of repoIds) {
      const existing = await ctx.db
        .query('remote_repositories')
        .withIndex('by_repoId', (q) => q.eq('repoId', repoId))
        .unique();
      if (existing && existing.installationId === installationId) {
        await ctx.db.delete(existing._id);
        removed++;
      }
    }
    return { removed };
  },
});

export const getDefaultRepositoryForUser = query({
  handler: async (ctx) => {
    const identity = await getUserIdentityOrThrow(ctx);
    const userId = identity.id as string;

    const repository = await ctx.db
      .query('remote_repositories')
      .filter((f) => f.eq(f.field('userId'), userId))
      .first();

    return repository;
  },
});
