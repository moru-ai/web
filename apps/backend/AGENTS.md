# Convex Agent Notes

- After changing backend code, review and update this AGENTS.md if anything needs to be refreshed.
- Own the Convex schema, migrations, and action functions backing job orchestration.
- Surface generated API via `pnpm convex codegen` so other apps import from `@moru/convex/_generated/*`.
- Coordinate job lifecycle: enqueue → heartbeat → completion reporting.
- Keep environment secrets (GitHub tokens, Redis credentials) scoped with Convex environment variables.

## Key Files

- `convex/schema.ts` — data model and indexes
- `convex/mutations.ts` — mutations/queries

Note: This list is intentionally concise and not exhaustive; no need to enumerate every file.

## Commands

- `pnpm dev:backend` — start Convex dev server and sync schema to Convex dev cloud
- `pnpm codegen` — regenerate `_generated` artifacts
- `pnpm deploy` — deploy Convex (use via CI or when explicitly requested)

## Schema Changes

When editing `apps/backend/convex/schema.ts`:

1. From repo root, run `pnpm dev:backend` to sync the schema to Convex dev cloud (leave running during dev).
2. In a separate terminal, run `pnpm codegen` at the root to refresh `apps/backend/convex/_generated/*`.
3. Web and worker import these artifacts directly via aliases.

## Generated Types

- Convex generates `apps/backend/convex/_generated/*` (do not edit).
- Web and worker resolve `@moru/convex/_generated/*` to this directory via bundler/tsconfig aliases.

## Deployment

- CI deploys on changes to backend/shared (see root AGENTS.md Deployment). Local deploys should use `pnpm deploy` only when instructed.

## Authentication (Clerk JWT)

- Auth is configured via `convex/auth.config.ts` using Clerk-issued JWTs.
- `applicationID`/`aud` must be `convex` to match the Clerk JWT template.

### Clerk JWT claims (template)

These claims are included in the Clerk JWT used by Convex. Ensure your Clerk JWT template named for Convex includes these fields and `aud` is set to `convex`.

```json
{
  "id": "{{user.id}}",
  "aud": "convex",
  "name": "{{user.full_name}}",
  "email": "{{user.primary_email_address}}",
  "picture": "{{user.image_url}}",
  "nickname": "{{user.username}}",
  "given_name": "{{user.first_name}}",
  "updated_at": "{{user.updated_at}}",
  "external_id": "{{user.external_id}}",
  "family_name": "{{user.last_name}}",
  "phone_number": "{{user.primary_phone_number}}",
  "email_verified": "{{user.email_verified}}",
  "phone_number_verified": "{{user.phone_number_verified}}"
}
```

### Getting the current user in Convex

Use `ctx.auth.getUserIdentity()` in queries/mutations. The returned identity mirrors the Clerk JWT claims above (e.g., `identity.email`). Always handle the unauthenticated case.

Example (replace table/fields to match your schema):

```ts
export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("author"), identity.email))
      .collect();
  },
});
```

Notes:

- Prefer `identity.email` as a human-friendly identifier when present; for immutable IDs use `identity.subject` (Clerk `user.id`).
- Ensure routes requiring auth enforce it at the query/mutation boundary; do not trust client-provided user IDs.

## References

- Convex Docs: https://docs.convex.dev/
- When anything is unclear (APIs, schema/indexes, auth, actions), search the Convex docs first.
