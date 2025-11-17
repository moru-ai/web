# Moru Agent Guidelines

After changing code, review and update this AGENTS.md as needed so it stays current.

Agent-facing documentation for AI assistants working on the Moru codebase.

## Repository Overview

**Moru** is an agentic coding platform built as a pnpm monorepo with three apps:

```
moru/
├─ apps/backend/        @moru/backend (Convex control plane)
├─ apps/web/            @moru/web (React Router UI)
├─ apps/worker/         @moru/worker (BullMQ job processor)
```

## Architecture Mental Model

1. **Backend** (Convex): Single source of truth for job state, schema, mutations
2. **Web**: Consumes Convex queries, displays UI, enqueues jobs via worker API
3. **Worker**: Processes BullMQ jobs, spawns container executors, reports back to Convex

Web and worker import Convex-generated modules via the alias `@moru/convex/_generated/*`, which resolves straight to `apps/backend/convex/_generated`.

## Key Workflows

### Schema Changes

When `apps/backend/convex/schema.ts` changes:

1. From the repo root, run `pnpm dev:backend` to sync the updated schema to the Convex dev cloud (leave it running during development).
2. In another terminal, run `pnpm codegen` at root.
3. This regenerates `apps/backend/convex/_generated/*`. Web and worker resolve Convex generated imports to that directory, so keep those artifacts fresh before building.

Note: GitHub integration schema was simplified — `github_connections` has been merged into `github_installations` with a `connected: boolean` flag. Queries/mutations have been updated to use the installation record directly.

Additionally, `github_repositories` was renamed to `remote_repositories` and now includes `provider: 'github'`. Backend queries/mutations and web/worker Doc types were updated accordingly.

### Post-change Validation

1. After every code change, run `pnpm lint` and `pnpm typecheck` from the repo root.
2. Fix issues and rerun both commands until they pass cleanly.
3. Once checks pass, run `pnpm format` to normalize files before committing.

### Adding Dependencies

- **Workspace-wide tools** (eslint, prettier, typescript): `pnpm add -Dw <package>`
- **App-specific runtime**: `pnpm --filter @moru/web add <package>`
- **Never use** `"latest"` — always pin with `^` ranges

### Development

- Start all services: `pnpm dev` (automatically runs `pnpm codegen` first)
- Individual services: `pnpm dev:backend`, `pnpm dev:web`, `pnpm dev:worker`
- All dev tools (ESLint, Prettier, TypeScript) are installed at root only
- UI checks: Before and after UI changes, run `pnpm dev:web` and use Playwright MCP to open `http://localhost:5173` and verify affected routes/components.
- Environment setup: Each app that needs secrets ships a template (for example `.env.example` or `.env.local.example`); copy it to the matching file and fill in local secrets.
- Worker testing: Convex actions execute in the cloud and cannot call `localhost`, so expose the local worker with `ngrok http 4000` and set `WORKER_URL` (for example via `apps/backend/.env.local` or `convex env set`) to the resulting HTTPS URL before triggering worker-facing actions.
- Worker↔Convex updates use a dedicated secret (`WORKER_CONVEX_API_KEY` for Convex, `CONVEX_WORKER_API_KEY` for the worker); keep the two values identical and run `pnpm dlx convex env set WORKER_CONVEX_API_KEY <value>` after rotating so public mutations can validate worker calls.
- Node version: Always `nvm use 22` (Node 22 LTS) before running `pnpm` or `convex` commands; older runtimes break the toolchain.

## Module Organization

High-level responsibilities only — see per-module AGENTS.md for details.

### apps/backend/ (Convex Backend)

- Owns schema, mutations, and job orchestration (source of truth).
- Details: `apps/backend/AGENTS.md`.

### apps/web/ (React Router Web)

- Renders chat UI, diff viewer, and PR flows; consumes Convex APIs.
- Details: `apps/web/AGENTS.md`.

### apps/worker/ (Worker Service)

- Runs BullMQ workers and exposes internal/health endpoints.
- Details: `apps/worker/AGENTS.md`.

## Dependency Rules

### Install at Root

- ESLint + all plugins
- Prettier + plugins
- TypeScript
- @types/node
- Workspace orchestration tools (concurrently)

### Install in Apps

- Production runtime dependencies only
- App-specific build tools (Vite, tsx)
- App-specific types (@types/react, @types/dockerode)

### Never Duplicate

❌ Don't install eslint/prettier/typescript in individual apps
✅ They're available from root via pnpm workspace resolution

## Versioning Strategy

- All packages kept at `0.0.0` (private, not published to npm)
- External deps pinned with `^` for predictable builds

## Research Practices

**ALWAYS use context7 MCP** to fetch latest library documentation before implementing features. Never guess API usage—look it up.

Example:

```
Before: "I think fastify uses app.get()..."
After: [Use context7 to fetch Fastify docs] → Confirm actual API
```

## Code Quality Standards

### Linting & Formatting

- Follow the Post-change Validation workflow above (`pnpm lint`, `pnpm typecheck`, then `pnpm format`)
- ESLint config at root: `eslint.config.cjs`
- Prettier config at root: `prettier.config.cjs`
- `.prettierignore` excludes `apps/backend/convex/_generated` so Convex artifacts stay untouched
- All apps inherit these configs automatically

### Type Safety

- Enable strict TypeScript checks
- Never use `any` without explicit reason
- Leverage Convex codegen for end-to-end type safety
- Web and worker import backend `_generated` artifacts via aliases so type definitions remain in sync
- Lean on TypeScript inference whenever possible—avoid explicit return type annotations and `as` assertions unless you've tried at least three alternative shapes and the compiler still needs help
- Skip redundant variable annotations—prefer `const hello = "world"` over `const hello: string = "world"` unless inference truly fails
- After each task that changes code, immediately run `pnpm typecheck` so regressions surface early

```ts
const hello = "world"; // ✅ inferred string
const helloTyped: string = "world"; // ❌ avoid unless inference fails
```

### Code Style

- Use early returns to avoid nesting
- Prefer functional, immutable style
- Write self-documenting code (minimize comments)
- Follow existing patterns in each app
- UI palette tokens live in `apps/web/app/app.css`; prefer `success`/`failed` state utilities (`bg-success`, `text-failed`, etc.) over ad-hoc colors

## Commit & PR Guidelines

### Conventional Commits

Use semantic commit format:

```
feat: add worker queue metrics
fix: resolve race condition in job processor
chore: update dependencies to latest patch versions
docs: document deployment workflow
```

### PR Requirements

1. Describe intent clearly
2. List impacted modules (backend/web/worker)
3. Reference Convex job IDs if applicable
4. Attach UI screenshots (store in `references/imgs/`)
5. Ensure `pnpm lint` passes
6. Request at least one reviewer
7. Link related issues/tasks

### Git Workflow

- Never force push to main/master
- Keep commits scoped to single features
- Run `pnpm lint` and `pnpm typecheck` before pushing
- Squash fixup commits before merging

## Deployment

- Auto-deploys on push to `main`. Do not deploy manually.
- **Convex backend**: `.github/workflows/deploy.yml` runs on every push to `main`. It installs deps, runs `pnpm codegen` to refresh `_generated` artifacts, and executes `pnpm run deploy` in `apps/backend` with `CONVEX_DEPLOY_KEY`.
- **Web app**: Vercel builds and deploys automatically on pushes to `main`. Manage build settings/routes in `apps/web/vercel.json`; the install command now runs `pnpm codegen` so backend artifacts stay fresh before the web build. No manual Vercel deploys needed.
- **Worker**: The same job immediately builds the worker image after the backend deploy completes, reusing the fresh Convex artifacts. It pushes the image to GHCR, uploads `apps/worker/docker-compose.yml` to `${{ secrets.WORKER_SERVER_APP_DIR }}`, and runs `docker compose up -d --pull always worker` on the EC2 host. Configure `WORKER_SERVER_HOST`, `WORKER_SERVER_USER`, `WORKER_SERVER_SSH_KEY`, and `WORKER_SERVER_APP_DIR` secrets; optionally set repository variable `WORKER_IMAGE` (base image name without tag). No manual SSH/compose steps needed.

## Common Tasks

### Add a new Convex table

```bash
# 1. Edit apps/backend/convex/schema.ts
# 2. Sync schema to Convex dev cloud (from repo root)
pnpm dev:backend
# 3. Regenerate types
pnpm codegen
# 4. Types now available in web/worker
```

### Verify a UI change locally

```bash
# 1. Start the web dev server (serves at http://localhost:5173)
pnpm dev:web

# 2. In a Playwright MCP session, open http://localhost:5173
# 3. Navigate to affected routes/components and verify behavior before and after your change
# 4. Optionally capture screenshots for PRs (store under references/imgs/)
```

### Update a dependency

```bash
# Check what's outdated
pnpm outdated

# Update within ^ range
pnpm update <package> -r

# Update to new major version
pnpm add -Dw eslint@^10.0.0
```

### Debug Convex artifact resolution

```bash
# Confirm web/worker aliases target backend artifacts
rg "@moru/convex/_generated" apps/web apps/worker

# Inspect backend outputs if types look stale
ls apps/backend/convex/_generated
```

## Files to Never Edit

- `pnpm-lock.yaml` (only via pnpm commands)
- `apps/backend/convex/_generated/*` (Convex auto-generated)
- `apps/web/.react-router/*` (React Router build cache)

## When Stuck

1. Check app-specific `AGENTS.md` in `apps/*/AGENTS.md`
2. Review `requirements/project-setup.md` for architecture details
3. Use context7 MCP to research library usage
4. Check `references/imgs/` for UI reference screenshots
5. Run `pnpm lint` to catch common issues

## Project Status

Current MVP phase:

- ✅ Monorepo setup complete
- ✅ Convex backend operational
- ✅ Web UI foundation built
- ✅ Worker queue infrastructure ready
- 🚧 GitHub integration in progress
- 🚧 Codex executor implementation
- 📋 Planned: GitLab support, advanced sandboxing
