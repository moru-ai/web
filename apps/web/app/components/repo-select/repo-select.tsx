/**
 * Repository Selection Dropdown Component
 *
 * Design Decision: Uses Convex native hooks instead of TanStack Query
 * - We use `usePaginatedQuery` from Convex for seamless integration with cursor-based pagination
 * - Loading and error states are handled internally within the component
 * - This approach provides better real-time updates and reduces external dependencies
 * - See AGENTS.md "Pagination and Data Fetching" section for more details
 */

import { useState, useRef } from "react";

import { Check, ChevronDown } from "lucide-react";
import { usePaginatedQuery } from "convex/react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Spinner } from "~/components/ui/spinner";
import { ErrorBoundary } from "~/components/ui/error-boundary";
import type { Doc, Id } from "@moru/convex/_generated/dataModel";
import { api } from "@moru/convex/_generated/api";
import { useInfiniteScroll } from "~/hooks/use-infinite-scroll";

interface RepoSelectProps {
  onSelect?: (repository: Doc<"remote_repositories"> | null) => void;
}

type RepoSelectHandler = RepoSelectProps["onSelect"];
type RepoSelectHandlerFn = NonNullable<RepoSelectHandler>;

function RepoListContent({
  value,
  onSelect,
  listRef,
  searchQuery,
}: {
  value: Id<"remote_repositories"> | null;
  onSelect: RepoSelectHandlerFn;
  listRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.git.listRepositoriesPaginated,
    {},
    { initialNumItems: 20 },
  );

  const handleLoadMore = () => {
    if (status === "CanLoadMore") {
      loadMore(10);
    }
  };

  const isLoadingMore = status === "LoadingMore";
  const isDone = status !== "CanLoadMore" && status !== "LoadingMore";

  useInfiniteScroll(listRef, handleLoadMore, isDone, isLoadingMore, searchQuery.trim().length > 0);

  // Show loading spinner for initial load
  if (status === "LoadingFirstPage") {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <CommandEmpty>No repository found.</CommandEmpty>
      <CommandGroup>
        {results.map((repository) => (
          <CommandItem
            key={repository._id}
            value={repository._id}
            onSelect={() => {
              const isSameRepo = repository._id === value;
              onSelect(isSameRepo ? null : repository);
            }}
          >
            {repository.name}
            <Check
              className={cn("ml-auto", value === repository._id ? "opacity-100" : "opacity-0")}
            />
          </CommandItem>
        ))}
      </CommandGroup>
      {isLoadingMore && (
        <div className="flex items-center justify-center p-2">
          <Spinner className="size-4" />
        </div>
      )}
    </>
  );
}

function RepoSelectTrigger({ selectedRepo }: { selectedRepo: Doc<"remote_repositories"> | null }) {
  return (
    <span className="overflow-hidden text-ellipsis">
      {selectedRepo ? selectedRepo.name : "Select repository..."}
    </span>
  );
}

export function RepoSelect({ onSelect }: RepoSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Doc<"remote_repositories"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const handleSelect: RepoSelectHandlerFn = (repository) => {
    setSelectedRepo(repository);
    setOpen(false);
    onSelect?.(repository);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <RepoSelectTrigger selectedRepo={selectedRepo} />
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search repository..."
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList ref={listRef}>
            {open && (
              <ErrorBoundary>
                <RepoListContent
                  value={selectedRepo?._id ?? null}
                  onSelect={handleSelect}
                  listRef={listRef}
                  searchQuery={searchQuery}
                />
              </ErrorBoundary>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
