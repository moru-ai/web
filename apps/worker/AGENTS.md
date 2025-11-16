# Worker Agent Notes

- After changing worker code, review and update this AGENTS.md if anything needs to be refreshed.
- Run BullMQ worker processes that spawn Codex executors in container sandboxes.
- Provide `/api/tasks` HTTP route (see `src/routes/api/tasks`) that enqueues BullMQ jobs into the `tasks` queue implemented under `src/workers/tasks`.
- Use Convex mutations for status updates and completion reporting.
- Ensure Redis connection resiliency and idempotent job handling.
- `plugins/external/redis.ts` exposes `fastify.redis.connection` plus a shared `fastify.redis.client` (ioredis) and cleans it up on shutdown; reuse these instead of parsing Redis URLs in multiple places.
- `plugins/external/auth.ts` verifies the `Authorization: Bearer <WORKER_API_KEY>` header and decorates `fastify.authenticate` so internal routes can enforce shared-secret auth.
- Keep the `WORKER_API_KEY` value in `apps/worker/.env` (loaded via `dotenv-safe`) and share the same secret with Convex so enqueue calls succeed.
- `plugins/app/app.queues.ts` exposes `fastify.queues.tasks` so routes can enqueue jobs without recreating BullMQ clients; the plugin closes queues during shutdown.
- Exposes `/health` endpoint for readiness probes.
- `src/app.ts` autoloads `plugins/app` before `plugins/external` so foundational plugins like `app.env` register before any dependencies (for example `app.redis`).
- Fastify autoload loads HTTP routes from `src/routes`; add new handlers there (e.g., `health`).

## Commands

- `pnpm dev:worker` — start local worker service
- `pnpm build` — build the service
- Compose: `docker-compose.yml` defaults to `ghcr.io/moru-ai/worker:latest`, reads `/opt/envs/moru/worker.env`, and publishes `127.0.0.1:4000`. Override the image, env file, or port mapping by exporting `WORKER_IMAGE`, `WORKER_ENV_FILE`, or `WORKER_PORT_MAPPING` (set `WORKER_IMAGE` to a fully-qualified reference with tag) before running `docker compose`.
- Registry overrides: set the repository variable `WORKER_IMAGE` (no tag) if the GHCR namespace differs from the `ghcr.io/moru-ai/worker` default, and export `WORKER_IMAGE=...:latest` on the EC2 host so Docker Compose pulls the same image.
- CI/CD: `.github/workflows/worker-deploy.yml` builds and pushes the worker image to GHCR, uploads the compose file to the EC2 host, and runs `docker compose up -d --pull always worker`. Ensure the `WORKER_SERVER_*` secrets are present in GitHub and the EC2 host has Docker Compose v2 installed.
