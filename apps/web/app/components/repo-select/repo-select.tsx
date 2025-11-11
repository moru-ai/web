import { useState, useRef } from "react";

import { Check, ChevronDown } from "lucide-react";
import { ErrorBoundary, Suspense } from "@suspensive/react";

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
import type { Doc, Id } from "@moru/convex/_generated/dataModel";
import { useInfiniteRepositories } from "~/hooks/use-infinite-repositories";
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
  const { repositories, isLoadingMore, handleLoadMore, isDone } = useInfiniteRepositories(20, 10);

  useInfiniteScroll(listRef, handleLoadMore, isDone, isLoadingMore, searchQuery.trim().length > 0);

  return (
    <>
      <CommandEmpty>No repository found.</CommandEmpty>
      <CommandGroup>
        {repositories.map((repository) => (
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

function RepoListError({ error }: { error: Error }) {
  return (
    <div className="text-destructive p-4 text-sm">
      {error.message || "Failed to load repositories"}
    </div>
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
              <ErrorBoundary fallback={RepoListError}>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-4">
                      <Spinner />
                    </div>
                  }
                >
                  <RepoListContent
                    value={selectedRepo?._id ?? null}
                    onSelect={handleSelect}
                    listRef={listRef}
                    searchQuery={searchQuery}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
