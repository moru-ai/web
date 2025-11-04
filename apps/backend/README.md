# @moru/backend

Convex project that powers the Moru control plane. It stores agent job metadata, tracks execution progress, and exposes queries/mutations used by the web client and worker.

## Getting Started

1. Install workspace dependencies with `pnpm install`.
2. Log in to Convex with `pnpm convex login`.
3. Start the development server with `pnpm dev:backend`.

After running `pnpm codegen`, the generated modules under `apps/backend/convex/_generated` are consumed by the web and worker apps via the `@moru/convex/_generated/*` path alias.
