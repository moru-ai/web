# @moru/worker

BullMQ worker responsible for enqueuing and executing Moru agent jobs. The service exposes an internal HTTP API that the web client and Convex functions call to enqueue work.

## Getting Started

1. Install workspace dependencies with `pnpm install`.
2. Provide Redis and Convex credentials via environment variables.
3. Start the worker locally with `pnpm dev:worker`.

The worker reports progress back to Convex, maintains heartbeats, and pushes execution artifacts to object storage.
