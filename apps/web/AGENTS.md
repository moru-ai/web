# Moru Web Agent Notes

- After changing web code, review and update this AGENTS.md if anything needs to be refreshed.
- Primary objectives: render chat UX, surface diff previews, orchestrate PR creation/update flows.
- Environment: React Router with Tailwind/shadcn/ui, hydrated from Convex queries and worker status events.
- Interfaces:
  - Runtime: `convex/react`.
  - Convex generated artifacts: `@moru/convex/_generated/*` resolves straight to `apps/backend/convex/_generated` via tsconfig/vite path aliases (no local shim).
- Watch for Convex schema changes and keep generated types in sync.

## Stack and Commands

- Stack: React 19, React Router 7, Tailwind CSS 4, shadcn/ui, Clerk auth
- Commands: `pnpm dev:web`, `pnpm build`, `pnpm typecheck`

## Auth

- Use `rootAuthLoader` to provide auth context to `ClerkProvider` in `app/root.tsx`. Always pass `loaderData` through route components.
- Public marketing + sign-in UI now lives under `app/routes/sign-in.tsx`; unauthenticated users navigate there instead of `home.tsx`.
- Auth-only routes (e.g., `app/routes/home.tsx`) gate access in their loaders and redirect unauthenticated visitors to `/sign-in`.
- Route-level loaders/actions that call Convex should compose the `convexClientWithAuthMiddleware`, then read the authed client via `convexClientContext` (`context.get`/`context.set`) instead of instantiating their own `ConvexHttpClient`.

## UI Development

- Use Tailwind utility classes and shadcn/ui components for UI.
- Before using a shadcn component, fetch the latest docs/examples via shadcn MCP or context7 MCP (don’t guess APIs).
- Keep components consistent with existing patterns; prefer composition over deep prop drilling.
- You may install any shadcn/ui component as needed for the UI. Use shadcn MCP or context7 MCP to get the correct install steps/files.

## Theming

- Monochrome UI: Black/white/gray palette only across the app.
- System theme: Respect `prefers-color-scheme`; no explicit theme switcher.
- Implementation lives in `app/app.css` using CSS variables and a dark-mode media query.
- Allowed color accents: green for positive/success and red for destructive actions/statuses (e.g., GitHub "Connected" badge and "Disconnect" button).
- When styling components, prefer tokens over raw colors:
  - Backgrounds: `bg-background`, `bg-card`, `bg-popover`
  - Text: `text-foreground`, `text-muted-foreground`
  - Borders: `border-border`
  - Interactive hover: `hover:bg-accent`, `hover:opacity-80`
- Clerk-auth UI inherits the system scheme by toggling the `@clerk/themes` `dark` base theme inside `app/root.tsx`; avoid manual color overrides.

## Auth Rendering

- For conditional rendering, use `Authenticated` and `Unauthenticated` from `convex/react`.

Example:

```tsx
import { Authenticated, Unauthenticated } from "convex/react";

export function HeaderCTA() {
  return (
    <>
      <Authenticated>
        <a className="btn btn-primary" href="/dashboard">
          Open Dashboard
        </a>
      </Authenticated>
      <Unauthenticated>
        <a className="btn" href="/login">
          Sign in
        </a>
      </Unauthenticated>
    </>
  );
}
```

Note: Keep using the existing auth provider setup in `app/root.tsx`; these components only handle conditional UI.

## UI Verification

- Use Playwright MCP to interactively verify UI before and after changes.
- Default dev server: `http://localhost:5173` (start with `pnpm dev:web`).

## Data Access Example

```tsx
import { api } from "@moru/convex/_generated/api";
import { useQuery } from "convex/react";

export function JobsList() {
  const jobs = useQuery(api.jobs.listAll);
  if (jobs === undefined) return <div>Loading…</div>;
  return (
    <ul>
      {jobs.map((j) => (
        <li key={j._id}>{j.name}</li>
      ))}
    </ul>
  );
}
```

### Streaming Loader Pattern

- Route loaders can call Convex via `ConvexHttpClient` and return unresolved Promises. Pair the loader result with `<Suspense>` + `<Await>` to show skeleton UI immediately while the promise resolves.
- For auth-gated screens, combine `<AuthLoading>` with the same skeleton component to avoid blank flashes while Clerk hydrates.
