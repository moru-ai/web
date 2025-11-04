# Worker Agent Notes

- After changing worker code, review and update this AGENTS.md if anything needs to be refreshed.
- Run BullMQ worker processes that spawn Codex executors in container sandboxes.
- Provide `/internal/enqueue` HTTP route for job submission from web/Convex.
- Use Convex mutations for status updates and completion reporting.
- Ensure Redis connection resiliency and idempotent job handling.
- Exposes `/health` endpoint for readiness probes.

## Commands

- `pnpm dev:worker` — start local worker service
- `pnpm build` — build the service
- Compose: `docker-compose.yml` defaults to `ghcr.io/omins/moru-worker:latest`, reads `/opt/envs/moru/worker.env`, and publishes `127.0.0.1:4000`. Override the image, env file, or port mapping by exporting `WORKER_IMAGE`, `WORKER_ENV_FILE`, or `WORKER_PORT_MAPPING` (set `WORKER_IMAGE` to a fully-qualified reference with tag) before running `docker compose`.
- Registry overrides: set the repository variable `WORKER_IMAGE` (no tag) if the GHCR namespace differs from the `ghcr.io/omins/moru-worker` default, and export `WORKER_IMAGE=...:latest` on the EC2 host so Docker Compose pulls the same image.
- CI/CD: `.github/workflows/worker-deploy.yml` builds and pushes the worker image to GHCR, uploads the compose file to the EC2 host, and runs `docker compose up -d --pull always worker`. Ensure the `WORKER_SERVER_*` secrets are present in GitHub and the EC2 host has Docker Compose v2 installed.
