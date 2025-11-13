import { ErrorBoundary, Suspense } from "@suspensive/react";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { RepoTable } from "../repo-table/repo-table";
import { RepoTableSkeleton } from "../repo-table/repo-table-skeleton";
import { RepoTableError } from "../repo-table/repo-table-error";

type GithubInstallation = Doc<"github_installations">;

const githubAppSlug = import.meta.env.VITE_GITHUB_APP_SLUG as string | undefined;
const githubClientRedirectTo =
  (import.meta.env.VITE_GITHUB_CLIENT_REDIRECT_TO as string) || "/settings";

export function GitHubCard() {
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
