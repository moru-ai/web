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
- Components that need to read the current scheme should call `useColorScheme` (`app/hooks/useColorScheme`) instead of browser-global checks or third-party theme providers.
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

## Settings Connectors

- Settings → Connectors renders one card per provider and now sources repository lists from the aggregated `api.git.listRepositories` query, so backend changes to that query require regenerating Convex types before touching the UI.

## Pagination and Data Fetching

### Why We Don't Use TanStack Query for Pagination

For components that require pagination (repository lists, etc.), we use **Convex native hooks** (`usePaginatedQuery`) instead of TanStack Query. This decision was made for several reasons:

1. **Tight Integration**: Convex's `usePaginatedQuery` is specifically designed to work with Convex's cursor-based pagination system, providing seamless integration with backend queries.

2. **Simpler State Management**: Convex hooks handle loading, error, and pagination states internally, reducing the need for external state management libraries.

3. **Real-time Updates**: Convex hooks automatically subscribe to database changes, keeping paginated data fresh without manual cache invalidation.

4. **Consistency**: Using Convex's native patterns throughout the app creates a more consistent codebase and reduces dependency complexity.

### Pattern: Component-Level Loading and Error Handling

Instead of using external Suspense/ErrorBoundary components, paginated components handle their own loading and error states:

```tsx
import { usePaginatedQuery } from "convex/react";
import { api } from "@moru/convex/_generated/api";

export function MyPaginatedComponent() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.myQuery.paginated,
    {
      /* args */
    },
    { initialNumItems: 20 },
  );

  // Handle loading state
  if (status === "LoadingFirstPage") {
    return <Spinner />;
  }

  // Handle error state (if needed)
  // Note: Convex queries will throw errors that can be caught

  // Render data
  return (
    <div>
      {results.map((item) => (
        <div key={item._id}>{item.name}</div>
      ))}
      {status === "CanLoadMore" && <button onClick={() => loadMore(10)}>Load More</button>}
    </div>
  );
}
```

### Components Using This Pattern

- **[repo-select.tsx](app/components/repo-select/repo-select.tsx)**: Repository dropdown with infinite scroll
- **[repo-table.tsx](app/routes/settings.connectors/components/repo-table/repo-table.tsx)**: Settings page repository table with "Load More" button

### Pattern: TanStack Query with API Routes for External Data

For components that fetch external data (e.g., GitHub API) through our API routes, we use **TanStack Query** (`useSuspenseInfiniteQuery`):

```tsx
import { Suspense } from "react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

function MyDataList({ externalId }: { externalId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery({
    queryKey: ["myData", externalId],
    queryFn: async () => {
      const response = await fetch(`/api/my-endpoint?id=${encodeURIComponent(externalId)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      return await response.json();
    },
    getNextPageParam: () => undefined, // Adjust based on your pagination needs
    initialPageParam: 1,
  });

  // Get data from pages
  const items = data.pages[0]?.items || [];

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      {isFetchingNextPage && <Spinner />}
    </div>
  );
}

export function MyComponent({ externalId }: { externalId: string }) {
  return (
    <Suspense fallback={<Spinner />}>
      <MyDataList externalId={externalId} />
    </Suspense>
  );
}
```

**Why use TanStack Query for API route calls:**

- **Better Caching**: TanStack Query provides sophisticated caching strategies for API data
- **Automatic Retries**: Built-in retry logic for failed requests
- **Request Deduplication**: Multiple components requesting the same data only trigger one network request
- **Declarative Loading States**: Suspense boundaries handle loading UI cleanly
- **Server-Side Authentication**: API routes handle authentication and external API calls securely

**When to use:**

- Fetching data from external APIs (GitHub, etc.) through our API routes
- Data that changes frequently and benefits from caching strategies
- Components that need to fetch data that requires server-side authentication

**Components using this pattern:**

- **[branch-select.tsx](app/components/branch-select/branch-select.tsx)**: Branch dropdown (fetches from GitHub API via `/api/github/branches` route)
