import { ErrorBoundary, Suspense } from "@suspensive/react";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { authMiddleware } from "~/middlewares/auth-middleware";
import type { Route } from "./+types/settings.connectors";

type GithubInstallation = Doc<"github_installations">;

const githubAppSlug = import.meta.env.VITE_GITHUB_APP_SLUG as string | undefined;
const githubClientRedirectTo =
  (import.meta.env.VITE_GITHUB_CLIENT_REDIRECT_TO as string) || "/settings";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export default function ConnectorsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Connectors</h1>
      <ErrorBoundary fallback={GitHubCardError}>
        <Suspense fallback={<GitHubCardSkeleton />}>
          <GitHubCard />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function GitHubCard() {
  const { data: installation } = useSuspenseQuery(convexQuery(api.git.getGithubInstallation, {}));
  const connected = Boolean(installation);

  return (
    <div className="border-border bg-card/50 rounded-lg border p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">GitHub</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Sync repositories through your GitHub App installation.
          </p>
        </div>
        {connected ? (
          <span className="border-success bg-success/10 text-success rounded-full border px-2.5 py-1 text-xs font-medium">
            Connected
          </span>
        ) : (
          <span className="border-failed bg-failed/15 text-failed rounded-full border px-2.5 py-1 text-xs font-medium">
            Not connected
          </span>
        )}
      </div>
      {installation ? <GithubConnected installation={installation} /> : <GithubNotConnected />}
    </div>
  );
}

function GithubConnected({ installation }: { installation: GithubInstallation }) {
  const installationId = installation.installationId;
  const slug = githubAppSlug;
  const clientRedirectTo = githubClientRedirectTo;

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="border-foreground/40 text-foreground hover:bg-foreground/10 focus-visible:bg-foreground/10"
        >
          <a
            href={
              slug
                ? `https://github.com/apps/${slug}/installations/select_target?state=${encodeURIComponent(
                    JSON.stringify({ client_redirect_to: clientRedirectTo }),
                  )}`
                : "https://github.com/apps"
            }
            target="_blank"
            rel="noreferrer"
          >
            Settings
          </a>
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="bg-red-600 text-white hover:bg-red-500"
          onClick={async () => {
            if (!installationId) return;
            const res = await fetch("/api/github/disconnect", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ installationId }),
            });
            if (res.ok) {
              window.location.reload();
            } else {
              const text = await res.text();
              alert(text || "Failed to disconnect");
            }
          }}
        >
          Disconnect
        </Button>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-muted-foreground text-sm font-semibold">Repositories</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!installationId}
            onClick={async () => {
              if (!installationId) return;
              await fetch("/api/github/refresh", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ installationId }),
              });
            }}
          >
            Refresh
          </Button>
        </div>
        <ErrorBoundary fallback={RepoTableError}>
          <Suspense fallback={<RepoTableSkeleton />}>
            <RepoTable installation={installation} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}

function GithubNotConnected() {
  const installUrl = githubAppSlug
    ? `https://github.com/apps/${githubAppSlug}/installations/new`
    : undefined;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {installUrl ? (
        <Button asChild className="text-background">
          <a href={installUrl}>Connect GitHub App</a>
        </Button>
      ) : (
        <span className="text-sm text-amber-400">Set VITE_GITHUB_APP_SLUG to enable Connect</span>
      )}
    </div>
  );
}

function RepoTable({ installation }: { installation: GithubInstallation }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.git.listReposByInstallation, {
      installationId: installation.installationId,
      paginationOpts: { numItems: 50, cursor: null },
    }),
  );

  const repositories = data.page ?? [];

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-card/50">
          <TableRow>
            <TableHead className="px-3">Repository</TableHead>
            <TableHead className="px-3">Visibility</TableHead>
            <TableHead className="px-3">Default Branch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repositories.length > 0 ? (
            repositories.map((repo) => (
              <TableRow key={repo._id}>
                <TableCell className="text-foreground font-medium">{repo.fullName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {repo.visibility ?? (repo.private ? "private" : "public")}
                </TableCell>
                <TableCell className="text-muted-foreground">{repo.defaultBranch ?? "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                No repositories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function RepoTableSkeleton() {
  return (
    <div className="border-border overflow-hidden rounded-lg border p-4">
      <div className="space-y-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="bg-foreground/10 h-10 w-full animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

function RepoTableError({ error }: { error: Error }) {
  return (
    <div className="border-border bg-card/50 text-failed rounded-lg border p-4 text-sm">
      {error.message || "Unable to load repositories right now."}
    </div>
  );
}

function GitHubCardSkeleton() {
  return (
    <div className="border-border bg-card/50 rounded-lg border p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="bg-foreground/10 h-5 w-28 rounded" />
          <div className="bg-foreground/5 h-4 w-64 rounded" />
        </div>
        <div className="border-border bg-foreground/5 h-6 w-20 rounded-full border" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="bg-foreground/10 h-9 w-36 rounded" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="bg-foreground/10 h-4 w-32 rounded" />
        <RepoTableSkeleton />
      </div>
    </div>
  );
}

function GitHubCardError({ error }: { error: Error }) {
  return (
    <div className="border-border bg-card/50 text-failed rounded-lg border p-5 text-sm">
      Unable to load GitHub connection details right now.{" "}
      {error.message || "Please refresh to try again."}
    </div>
  );
}
