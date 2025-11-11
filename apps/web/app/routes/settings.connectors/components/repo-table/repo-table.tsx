import { useState, useEffect } from "react";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
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

type GithubInstallation = Doc<"github_installations">;

export function RepoTable({ installation }: { installation: GithubInstallation }) {
  const { data } = useSuspenseQuery(
    convexQuery(api.git.listReposByInstallation, {
      installationId: installation.installationId,
      paginationOpts: { numItems: 10, cursor: null },
    }),
  );

  // Initialize state from initial query result
  const [cursor, setCursor] = useState<string | null>(data?.continueCursor ?? null);
  const [repositories, setRepositories] = useState<Doc<"remote_repositories">[]>(data?.page ?? []);
  const [isDone, setIsDone] = useState(data?.isDone ?? false);

  // Update state when data changes (e.g., when installation changes)
  useEffect(() => {
    if (data) {
      setRepositories(data.page ?? []);
      setCursor(data.continueCursor ?? null);
      setIsDone(data.isDone ?? false);
    }
  }, [data]);

  // Load More query (only runs when manually triggered)
  const { refetch: loadMore, isFetching: isLoadingMore } = useQuery({
    ...convexQuery(api.git.listReposByInstallation, {
      installationId: installation.installationId,
      paginationOpts: { numItems: 10, cursor },
    }),
    enabled: false, // Only run when manually triggered
  });

  const handleLoadMore = async () => {
    if (!cursor || isDone) return;

    const result = await loadMore();
    if (result.data) {
      const newPage = result.data.page ?? [];
      setRepositories((prev) => [...prev, ...newPage]);
      setCursor(result.data.continueCursor ?? null);
      setIsDone(result.data.isDone ?? false);
    }
  };

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
            {repositories.length > 0 ? (
              repositories.map((repo) => (
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
      {!isDone && (
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
