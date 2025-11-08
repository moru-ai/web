import { Suspense } from "react";
import { useAuth } from "@clerk/react-router";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { Await, type LoaderFunctionArgs } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { convexClientWithAuthMiddleware } from "~/middlewares/convex-client";
import { authMiddleware } from "~/middlewares/auth-middleware";
import type { Route } from "./+types/settings.connectors";
import { convexClientContext } from "~/contexts/convex-client";
type InstallationConnection = {
  status: "connected" | "disconnected";
  installation?: { installationId: string; accountLogin: string };
};
type LoaderData = {
  githubInstallations:
    | Promise<InstallationConnection[] | undefined>
    | InstallationConnection[]
    | null;
};

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
  convexClientWithAuthMiddleware,
];

export async function loader(args: LoaderFunctionArgs): Promise<LoaderData> {
  const { context } = args;

  const client = context.get(convexClientContext);
  const githubInstallations = client.query(api.git.listInstallationsForUser) as Promise<
    InstallationConnection[] | undefined
  >;

  return { githubInstallations };
}

function GitHubCard({ connection }: { connection: InstallationConnection }) {
  const { userId } = useAuth();
  if (!userId) {
    throw new Error("GitHubCard rendered without an authenticated user.");
  }

  const connected = connection.status === "connected" && Boolean(connection.installation);
  const installation = connection.installation as
    | { installationId: string; accountLogin: string }
    | undefined;
  const installationId = installation?.installationId;
  const accountLogin = installation?.accountLogin;

  const slug = import.meta.env.VITE_GITHUB_APP_SLUG as string | undefined;
  const clientRedirectTo =
    (import.meta.env.VITE_GITHUB_CLIENT_REDIRECT_TO as string) || "/settings";
  const installUrl = slug ? `https://github.com/apps/${slug}/installations/new` : undefined;

  // Load repos for the current installation (first page)
  const { results, status, loadMore } = usePaginatedQuery(
    api.git.listReposByInstallation,
    installationId ? { installationId } : "skip",
    { initialNumItems: 10 },
  );
  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";
  const showLoadMore = canLoadMore || isLoadingMore;
  const isInitialLoading = status === "LoadingFirstPage";

  return (
    <div className="border-border bg-card/50 rounded-lg border p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">GitHub</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {accountLogin
              ? `Connected as @${accountLogin}`
              : "Connect your GitHub App to fetch repositories."}
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
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!connected ? (
          <>
            {installUrl ? (
              <Button asChild className="text-background">
                <a href={installUrl}>Connect GitHub App</a>
              </Button>
            ) : (
              <span className="text-sm text-amber-400">
                Set VITE_GITHUB_APP_SLUG to enable Connect
              </span>
            )}
          </>
        ) : (
          <>
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
                  // refresh UI
                  window.location.reload();
                } else {
                  const text = await res.text();
                  alert(text || "Failed to disconnect");
                }
              }}
            >
              Disconnect
            </Button>
          </>
        )}
      </div>
      {/* Installation metadata intentionally hidden per UX request */}
      {connected ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-muted-foreground text-sm font-semibold">Repositories</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
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
                {isInitialLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6">
                      <div className="space-y-3">
                        <div className="bg-foreground/10 h-4 w-48 rounded" />
                        <div className="bg-foreground/10 h-4 w-40 rounded" />
                        <div className="bg-foreground/10 h-4 w-32 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (results ?? []).length > 0 ? (
                  (results ?? []).map((r: Doc<"remote_repositories">) => (
                    <TableRow key={r._id}>
                      <TableCell className="text-foreground font-medium">{r.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.visibility ?? (r.private ? "private" : "public")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.defaultBranch ?? "-"}
                      </TableCell>
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
          {showLoadMore ? (
            <div className="mt-3 flex justify-center">
              <Button disabled={!canLoadMore} onClick={() => loadMore(10)}>
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
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
        <div className="border-border bg-foreground/5 h-32 rounded-lg border" />
      </div>
    </div>
  );
}

function GitHubCardError() {
  return (
    <div className="border-border bg-card/50 text-failed rounded-lg border p-5 text-sm">
      Unable to load GitHub connection details right now. Please refresh to try again.
    </div>
  );
}

function ConnectGitHubCard() {
  const slug = import.meta.env.VITE_GITHUB_APP_SLUG as string | undefined;
  const installUrl = slug ? `https://github.com/apps/${slug}/installations/new` : undefined;

  return (
    <div className="border-border bg-card/50 rounded-lg border p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">GitHub</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Connect your GitHub App to fetch repositories.
          </p>
        </div>
        <span className="border-failed bg-failed/15 text-failed rounded-full border px-2.5 py-1 text-xs font-medium">
          Not connected
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {installUrl ? (
          <Button asChild className="text-background">
            <a href={installUrl}>Connect GitHub App</a>
          </Button>
        ) : (
          <span className="text-sm text-amber-400">Set VITE_GITHUB_APP_SLUG to enable Connect</span>
        )}
      </div>
    </div>
  );
}

export default function ConnectorsPage({ loaderData }: { loaderData: LoaderData }) {
  const { githubInstallations } = loaderData;
  const liveConnections = useQuery(api.git.listInstallationsForUser, "skip") as
    | InstallationConnection[]
    | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Connectors</h1>
      <Authenticated>
        <AuthLoading>
          <GitHubCardSkeleton />
        </AuthLoading>
        <Suspense fallback={<GitHubCardSkeleton />}>
          <Await resolve={githubInstallations} errorElement={<GitHubCardError />}>
            {(connections: InstallationConnection[] | null | undefined) => {
              const effectiveConnections = liveConnections ?? connections ?? [];

              if (effectiveConnections.length === 0) {
                return <ConnectGitHubCard />;
              }

              return (
                <>
                  {effectiveConnections.map((connection, index) => (
                    <GitHubCard
                      key={connection.installation?.installationId ?? index}
                      connection={connection}
                    />
                  ))}
                </>
              );
            }}
          </Await>
        </Suspense>
      </Authenticated>
      <Unauthenticated>
        <p className="text-slate-400">Sign in to manage connectors.</p>
      </Unauthenticated>
    </div>
  );
}
