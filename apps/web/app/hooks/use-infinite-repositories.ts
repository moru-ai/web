import { useState, useEffect, useCallback } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@moru/convex/_generated/api";
import type { Doc } from "@moru/convex/_generated/dataModel";

/**
 * Hook for paginated repository fetching with infinite scroll support.
 *
 * @param initialPageSize - Number of items to load initially
 * @param loadMoreSize - Number of items to load on each "Load More" action
 * @returns Object containing repositories, loading state, load more handler, and completion status
 */
export function useInfiniteRepositories(initialPageSize: number, loadMoreSize: number) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Doc<"remote_repositories">[]>([]);
  const [isDone, setIsDone] = useState(false);

  const { data } = useSuspenseQuery(
    convexQuery(api.git.listRepositoriesPaginated, {
      paginationOpts: { numItems: initialPageSize, cursor: null },
    }),
  );

  // Initialize state from initial query result
  useEffect(() => {
    if (data) {
      setRepositories(data.page ?? []);
      setCursor(data.continueCursor ?? null);
      setIsDone(data.isDone ?? false);
    }
  }, [data]);

  // Load More query (only runs when manually triggered)
  const { refetch: loadMore, isFetching: isLoadingMore } = useQuery({
    ...convexQuery(api.git.listRepositoriesPaginated, {
      paginationOpts: { numItems: loadMoreSize, cursor },
    }),
    enabled: false, // Only run when manually triggered
  });

  const handleLoadMore = useCallback(async () => {
    if (!cursor || isDone || isLoadingMore) return;

    const result = await loadMore();
    if (result.data) {
      const newPage = result.data.page ?? [];
      setRepositories((prev) => [...prev, ...newPage]);
      setCursor(result.data.continueCursor ?? null);
      setIsDone(result.data.isDone ?? false);
    }
  }, [cursor, isDone, isLoadingMore, loadMore]);

  return {
    repositories,
    isLoadingMore,
    handleLoadMore,
    isDone,
  };
}
