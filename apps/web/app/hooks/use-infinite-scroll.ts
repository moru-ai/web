import { useEffect } from "react";

/**
 * Infinite scroll hook that triggers a callback when the user scrolls near the bottom of a list.
 *
 * @param listRef - Ref to the scrollable container element
 * @param onLoadMore - Callback function to load more items
 * @param isDone - Whether all items have been loaded
 * @param isLoading - Whether a load operation is currently in progress
 * @param disabled - Whether infinite scroll should be disabled (e.g., when searching)
 */
export function useInfiniteScroll(
  listRef: React.RefObject<HTMLDivElement | null>,
  onLoadMore: () => void,
  isDone: boolean,
  isLoading: boolean,
  disabled: boolean,
) {
  useEffect(() => {
    // Disable infinite scroll when disabled (e.g., when searching)
    if (disabled) return;

    const list = listRef.current;
    if (!list) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = list;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Load more when within 100px of bottom
      if (distanceFromBottom < 100 && !isDone && !isLoading) {
        onLoadMore();
      }
    };

    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, [listRef, onLoadMore, isDone, isLoading, disabled]);
}
