# Moru

> AI Coding Agent Platform — Spawn autonomous coding agents that work while you sleep

Moru is an agentic software engineering platform that runs Codex/Claude in GitHub-connected environments as background coding agents. Create tasks via a web UI, watch agents generate code, and merge Pull Requests—all orchestrated through Convex, BullMQ, and containerized executors.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start all services (Convex, Web, Worker)
pnpm dev

# Or start individually
pnpm dev:backend    # Convex backend
pnpm dev:web        # React Router web app
pnpm dev:worker     # BullMQ worker + Fastify API
```

## Architecture

```
moru/
├─ apps/
│  ├─ backend/         @moru/backend
│  │  └─ Convex backend (schema, queries, mutations)
│  ├─ web/             @moru/web
│  │  └─ React Router UI (Tailwind, shadcn/ui)
│  └─ worker/          @moru/worker
│     └─ BullMQ worker + Fastify enqueue API
```

### Components

| Component   | Purpose                               | Tech Stack                 |
| ----------- | ------------------------------------- | -------------------------- |
| **Backend** | Job state, schema, control plane      | Convex (serverless)        |
| **Web**     | Chat UI, diff viewer, PR creator      | React Router, Tailwind     |
| **Worker**  | Job processor, container orchestrator | Fastify, BullMQ, Dockerode |

## Development

### Prerequisites

- Node.js 22+ (install via [nvm](https://github.com/nvm-sh/nvm))
- pnpm 9+ (included via `packageManager` field)
- Docker (for worker sandbox execution)
- Redis (for BullMQ queue)
- Convex account ([convex.dev](https://convex.dev))

### Setup

1. **Clone and install:**

   ```bash
   git clone <repo-url>
   cd moru
   pnpm install
   ```

2. **Configure Convex:**

   ```bash
   cd apps/backend
   npx convex login
   npx convex dev --once  # Creates deployment
   ```

3. **Environment variables:**

   ```bash
   # .env.local (apps/backend)
   # Automatically created by `convex dev`

   # .env (apps/web)
   VITE_CONVEX_URL=https://your-deployment.convex.cloud

   # .env (apps/worker)
   CONVEX_URL=https://your-deployment.convex.cloud
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   WORKER_QUEUE=moru-jobs
   PORT=4000
   ```

4. **Start Redis** (if running locally):

   ```bash
   # macOS
   brew services start redis

   # or Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

5. **Run development servers:**

   ```bash
   pnpm dev
   ```

   This starts:
   - 🔵 Backend: Convex dev server
   - 🟢 Web: http://localhost:5173
   - 🟡 Worker: http://localhost:4000

### Key Commands

```bash
# Development
pnpm dev              # Start all services
pnpm dev:backend      # Convex only
pnpm dev:web          # Web only
pnpm dev:worker       # Worker only

# Code Generation
pnpm codegen          # Regenerate Convex types (run after schema changes)

# Building
pnpm build            # Build all packages

# Code Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format all code
pnpm format:check     # Check formatting

# Testing
pnpm test             # Run all tests
```

## Monorepo Structure

### Convex Generated Imports

Web and worker consume Convex-generated modules via the alias `@moru/convex/_generated/*`, which resolves directly to `apps/backend/convex/_generated/*` through each app's bundler/tsconfig configuration. Run `pnpm codegen` after schema changes so the backend artifacts stay in sync.

### Dependency Organization

```
Root (workspace-wide tools):
  - eslint, prettier, typescript
  - All shared dev dependencies

Apps (production runtime):
  - Framework packages (react, fastify)
  - Business logic libraries

Apps devDependencies (build tools):
  - App-specific bundlers (vite)
  - App-specific types (@types/react)
```

### Version Strategy

- App packages stay at `0.0.0` (private, not published)
- All external deps pinned with `^` ranges (no `"latest"`)
