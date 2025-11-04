# GitHub App Integration and Settings Page Plan

Goal: Allow users to connect a GitHub App from the web UI, fetch and persist repositories in Convex, and handle all GitHub API/webhook logic in the web app via React Router resource routes. Worker (MVP) only exposes a test route and consumes installed repositories from Convex.

## Scope

- Add a GitHub App connection flow (install/manage the app) and persist installation + repo data.
- Add a settings page in the web app to connect, view status, list/search repos, and select defaults.
- Worker (MVP): expose only a test route to list repos; defer production worker consumption and refresh to a later phase.
- Keep the Convex backend as the single source of truth for GitHub connections/repositories.

## References

- Architecture: apps/backend (Convex), apps/web (React Router), apps/worker (Fastify + BullMQ)
- Design cues: references/imgs/codex-screenshots
- Use context7 MCP to fetch latest docs while implementing:
  - GitHub Apps (installation flow, webhooks, JWT/installation tokens)
  - Octokit (@octokit/app, @octokit/rest)
  - Convex HTTP routing (http.js), actions, mutations, queries
  - React Router data routers and forms
  - Fastify route patterns

## High-Level Architecture

1. Backend (Convex) stores GitHub installations and repositories; no GitHub secrets or API calls in Convex.
2. Web handles the GitHub App install flow, callback, and webhook via React Router resource routes; it calls Convex mutations to persist data.
3. Worker reads repositories from Convex only (MVP); no direct GitHub calls.
4. Webhooks (optional but recommended) hit the web resource route to keep installation/repo lists in sync.

## Data Model (Convex schema additions)

Add tables and indexes (naming illustrative; finalize during implementation):

- github_installations
  - installationId: string
  - accountLogin: string
  - accountType: 'User' | 'Organization'
  - appSlug: string
  - userId: string | null // Clerk user ID that initiated the install (if available)
  - createdAt: number
  - updatedAt: number
  - Indexes: by installationId, by accountLogin

- github_repositories
  - repoId: number
  - fullName: string // owner/name
  - name: string
  - owner: string
  - private: boolean
  - defaultBranch: string | null
  - visibility: 'public' | 'private' | 'internal' | null
  - installationId: string // FK: github_installations.installationId
  - createdAt: number
  - updatedAt: number
  - Indexes: by installationId, by fullName, by repoId

- github_connections
  - userId: string // Clerk user ID
  - installationId: string
  - status: 'connected' | 'disconnected'
  - selectedRepoFullName: string | null // default selection for UI and worker
  - createdAt: number
  - updatedAt: number
  - Indexes: by userId, by installationId

Notes:

- Keep backend the source of truth; web/worker read via queries.
- If a team/workspace concept is introduced later, lift the relationship from userId → workspaceId.

## Environment & Secrets

- Do not specify env vars in this plan. After implementation, add a callout that documents the exact environment variables required to enable the GitHub App integration (web server), plus any Convex/worker configuration as applicable.
- Store GitHub App credentials only in the web app server environment; do not expose to the browser and do not store in Convex. Never commit secrets.

## Backend (Convex) Work

Convex acts as the system-of-record. It exposes queries and mutations only; all GitHub API interactions happen in the web app’s server (resource routes).

1. Queries/Mutations
   - query: `github/listInstallationsForUser` — join `github_connections` → `github_installations`.
   - query: `github/listReposByInstallation` — paginated listing from `github_repositories` by installationId (with search input).
   - mutation: `github/linkInstallationToUser` — upsert `github_connections` on callback.
   - mutation: `github/upsertInstallation` — upsert `github_installations` from webhook/callback payloads.
   - mutation: `github/upsertRepositories` — bulk upsert `github_repositories` after fetch in web resource route.
   - mutation: `github/saveSelectedRepo` — set `selectedRepoFullName` per user + installation.

2. Notes
   - No Convex actions for GitHub token minting or HTTP endpoints.
   - Web resource routes will validate and transform GitHub payloads, then call these mutations.
   - MVP: UI assumes one installation per user; backend may store multiple for future support, but UI will operate on a single installation.

## Web App Work

Routes/components (React Router):

- Add `/settings` layout with a left side navigation.
  - Left sidenav: show a single item "Connectors" (MVP).
  - Default child route: `/settings/connectors` listing available connectors.
- Add `/settings/github` route for connector-specific configuration.
- Page: Settings → GitHub
  - Connect GitHub App CTA → GitHub App install URL derived from app configuration (+ state nonce)
  - Show installation status (account + installation id)
  - Repo browser: search, paginate, show visibility and default branch
  - Select default repo and Save (calls `github/saveSelectedRepo`)
  - Actions: Refresh from GitHub (call a web resource route that fetches via Octokit and then invokes `github/upsertRepositories`), Disconnect (mark `github_connections.status = 'disconnected'`)
  - Empty states and error handling
  - MVP: assume one installation per user (no installation selector) and show all repositories returned for that installation, including private.

UI Design:

- Follow existing app styling; reference screenshots in `references/imgs/codex-screenshots` for layout, toggles, section headers, and button hierarchy.
- Keep the page within sidebar patterns used on `routes/home.tsx` and existing CSS tokens.
- Add a Settings entry button in the header’s right side; validate via Playwright MCP.
- Settings page layout: left sidenav with only "Connectors" visible (MVP).
- Connectors page: render a GitHub connector section/card.
  - If not connected: show a single Connect button.
  - If connected: show Delete and Settings buttons.
  - Validate these states and navigation using Playwright MCP.

Data loading:

- Use Convex React client to load installations and repos.
- Use optimistic updates for Save; display toasts/snackbars on success/failure.

## Worker Service Work

Scope: Implement only a test route for now (no production worker integration yet). Worker only reads from Convex.

- Test route for validation: add `GET /internal/github/test-repos` to return a user's repositories from Convex.
  - Query params:
    - `user_id` (required): Clerk user ID whose repos to list (aggregate across linked installations).
  - Response JSON shape: `{ userId, installations: [{ installationId, count }], repositories: [{ id, full_name, private, default_branch, visibility }] }`.
  - Security: test/dev only; gate behind env flag or require `X-Internal-Token` header; disable in production.

## Flows

1. Connect (web)
   - User opens Settings (header right) → Connectors (left sidenav) → GitHub card → clicks Connect.
   - Redirects to GitHub App install URL.
   - GitHub redirects to web resource route `/api/github/callback` with `installation_id`.
   - Web resource route links installation to user via Convex mutations and fetches repos via Octokit; calls `github/upsertRepositories`.
   - UI updates GitHub card to connected state (Delete + Settings buttons). Settings navigates to `/settings/github` showing repos.

2. Refresh repositories (web)
   - Web: User clicks Refresh → calls web resource route `/api/github/refresh` which uses Octokit to fetch and upsert via Convex.
   - Worker: Deferred for now; only the test route exists in MVP.

3. Read repositories (web/worker)
   - Web reads from `github_repositories` query.
   - Worker has no production GitHub integration; use the test route only, which aggregates from Convex: `/internal/github/test-repos?user_id=...`.

4. Webhooks (optional but recommended)
   - Keep installation and repo sets up-to-date on GitHub-side changes.

## Security & Compliance

- Store only necessary GitHub metadata (no secrets in DB).
- Keep GitHub App credentials in the web app server environment only; do not expose to the browser or store in Convex.
- Verify webhook signatures in the web resource route; ignore unverified requests.
- Use short-lived installation tokens minted in the web server; do not persist tokens.
- Tie Convex user identity (Clerk) to connections; authorize reads/writes accordingly.

## Implementation Steps

1. Research & design

- Use context7 to pull GitHub App + Octokit + Convex HTTP routing docs.
- Finalize table names, field types, and indexes.

2. Backend

- Add schema tables.
- Add queries and mutations only (`linkInstallationToUser`, `upsertInstallation`, `upsertRepositories`, `saveSelectedRepo`, listing queries).
- Run `pnpm dev:backend` and `pnpm codegen`.

3. Web

- Add routes `/settings`, `/settings/github`.
- Add resource routes: `POST /api/github/webhook`, `GET /api/github/callback`, `POST /api/github/refresh`.
- Build Settings → GitHub page UI and data loaders.
- Add Connect/Refresh/Save flows.
- Verify with Playwright MCP (including header-right settings entry) and reference `references/imgs/codex-screenshots`.

4. Worker (MVP)

- Implement test-only GET route `/internal/github/test-repos` as described above.
- Defer other worker integrations (helpers, internal endpoints) to a later phase.

5. QA & Validation

- Local: `pnpm dev:web` and verify settings page flows.
- Use Playwright MCP to validate the header settings entry placement, Settings layout (left sidenav with Connectors), GitHub card state (not connected vs connected), navigation to `/settings/github`, and interactive flows.
- Simulate webhook deliveries to the web resource route with GitHub UI or `curl`.
- Validate worker test route responses (Convex-backed aggregation only):
  - `curl "http://localhost:4000/internal/github/test-repos?user_id=<clerk_user_id>"`

6. Deploy

- Configure GitHub App URLs to point to the web app resource routes:
  - Webhook URL → `https://<web-domain>/api/github/webhook`
  - Callback URL → `https://<web-domain>/api/github/callback`
- Add required GitHub App secrets to the web app environment (server-only). After implementation, include a callout listing the exact environment variables to set.
- Keep Convex free of GitHub secrets; only queries/mutations persist metadata.
- Confirm auto-deploys for backend/web/worker; no manual steps.

## Acceptance Criteria

- Users can connect a GitHub App from the settings page and see connection status.
- Settings page shows a left sidenav with a Connectors item (MVP), and a GitHub connector card that renders:
  - Not connected → Connect button
  - Connected → Delete and Settings buttons
- Repositories for an installation are persisted in Convex and listable in web.
- Users can select and save a default repository.
- Webhook correctly updates installations/repos when enabled.
- Worker exposes `GET /internal/github/test-repos` returning repositories for a given `user_id` (Convex-backed aggregation only).
- MVP constraints:
  - Per-user scoping only (no org/team workspace).
  - UI supports a single installation per user (no multi-install selector).
  - Show all repositories returned for the installation, including private.

## Decisions (MVP)

- Scoping: Per-user only; no org/team workspace.
- Installations: Do not support multiple installations per user in the UI; assume one.
- Visibility: Show all private repositories returned by the installation; no plan-based filtering yet.

---

Implementation Note Reminder

- When implementation is complete and validated, append an "Implementation Notes" section at the very end of this file summarizing:
  - The exact environment variables required to enable the GitHub App integration (web server),
  - The final resource routes and URLs used (webhook, callback, refresh),
  - The Convex queries/mutations added or modified,
  - The worker test route shape and any guards,
  - Any deployment or migration steps executed.

---

Implementation Notes (MVP wired)

- Environment variables (web server):
  - `CONVEX_URL` (existing) → Convex deployment URL
  - `GITHUB_APP_ID` → GitHub App ID
  - `GITHUB_APP_PRIVATE_KEY` → PEM private key (multiline allowed)
  - `GITHUB_APP_WEBHOOK_SECRET` → Webhook secret (enables signature verification)
  - `VITE_GITHUB_APP_SLUG` (client) → App slug for Connect URL

- Web resource routes:
  - `GET /api/github/callback` → upserts installation, links to user, fetches repos, redirects to `/settings/github`
  - `POST /api/github/refresh` → refreshes repos for `installationId`
  - `POST /api/github/webhook` → verifies signature (if secret set), upserts installation/repos

- Convex functions added (apps/backend/convex/github.ts):
  - Queries: `github/listInstallationsForUser`, `github/listReposByInstallation`
  - Mutations: `github/linkInstallationToUser`, `github/upsertInstallation`, `github/upsertRepositories`, `github/saveSelectedRepo`

- Schema added (apps/backend/convex/schema.ts):
  - `github_installations`, `github_repositories`, `github_connections` with indexes

- Web UI:
  - Settings layout `/settings` with Connectors and GitHub pages
  - GitHub Connect card shows state and links to install URL
  - GitHub settings page lists repos with pagination and refresh button

- Worker (MVP):
  - `GET /internal/github/test-repos?user_id=<clerk_user_id>`
    - Aggregates from Convex: lists installations, then paginates repos per installation

- Follow-ups:
  - Run `pnpm dev:backend` then `pnpm codegen` to regenerate Convex types used via the `@moru/convex/_generated/*` alias
  - Optionally implement Disconnect flow and default repo save UI
  - Enhance repo search (server-side index or client-side filtering)
