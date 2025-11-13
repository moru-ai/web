/**
 * Repository Table Component for Settings Page
 *
 * Design Decision: Uses Convex native hooks instead of TanStack Query
 * - We use `usePaginatedQuery` from Convex for seamless integration with cursor-based pagination
 * - Loading and error states are handled internally within the component
 * - This approach provides better real-time updates and reduces external dependencies
 * - See AGENTS.md "Pagination and Data Fetching" section for more details
 */

import { usePaginatedQuery } from "convex/react";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ErrorBoundary } from "~/components/ui/error-boundary";

type GithubInstallation = Doc<"github_installations">;

function RepoTableContent({ installation }: { installation: GithubInstallation }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.git.listReposByInstallation,
    {
      installationId: installation.installationId,
    },
    { initialNumItems: 10 },
  );

  const handleLoadMore = () => {
    if (status === "CanLoadMore") {
      loadMore(10);
    }
  };

  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  // Show loading spinner for initial load
  if (status === "LoadingFirstPage") {
    return (
      <div className="border-border flex items-center justify-center rounded-lg border p-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="bg-card/50">
            <TableRow>
              <TableHead className="px-3">Repository</TableHead>
              <TableHead className="px-3">Visibility</TableHead>
              <TableHead className="px-3">Default Branch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length > 0 ? (
              results.map((repo) => (
                <TableRow key={repo._id}>
                  <TableCell className="text-foreground font-medium">{repo.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {repo.visibility ?? (repo.private ? "private" : "public")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {repo.defaultBranch ?? "-"}
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
      {canLoadMore && (
        <div className="border-t-border flex justify-center border-t p-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore ? (
              <>
                <Spinner className="mr-2" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export function RepoTable({ installation }: { installation: GithubInstallation }) {
  return (
    <ErrorBoundary>
      <RepoTableContent installation={installation} />
    </ErrorBoundary>
  );
}
