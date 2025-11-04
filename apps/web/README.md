# @moru/web

Server-rendered web client for Moru. This app provides the chat interface for spawning coding agents, queue visibility, and PR management utilities.

## Getting Started

1. Install workspace dependencies with `pnpm install`.
2. Create a `.env.local` based on `../.env.example` (to be added as integrations land).
3. Run the dev server with `pnpm dev:web` (React Router framework with SSR).
4. Optionally run type generation and checks with `pnpm --filter web typecheck`.

The app consumes Convex APIs via the `@moru/convex/_generated/*` alias and posts job enqueue requests to the worker service.
