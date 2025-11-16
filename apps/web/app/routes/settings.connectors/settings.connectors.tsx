import { ErrorBoundary, Suspense } from "@suspensive/react";
import { authMiddleware } from "~/middlewares/auth-middleware";
import type { Route } from "../+types/settings.connectors";
import { GitHubCard } from "./components/github-card/github-card";
import { GitHubCardSkeleton } from "./components/github-card/github-card-skeleton";
import { GitHubCardError } from "./components/github-card/github-card-error";

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
