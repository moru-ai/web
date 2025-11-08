import { useState } from "react";

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
import { api } from "@moru/convex/_generated/api";
import type { Doc, Id } from "@moru/convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

interface RepoSelectProps {
  onSelect?: (repository: Doc<"remote_repositories"> | null) => void;
}

type RepoSelectHandler = RepoSelectProps["onSelect"];
type RepoSelectHandlerFn = NonNullable<RepoSelectHandler>;

function RepoListContent({
  value,
  onSelect,
}: {
  value: Id<"remote_repositories"> | null;
  onSelect: RepoSelectHandlerFn;
}) {
  const { data: repositories } = useSuspenseQuery(convexQuery(api.git.listRepositories, {}));

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

function RepoSelectTrigger({ value }: { value: Id<"remote_repositories"> | null }) {
  const { data: repositories } = useSuspenseQuery(convexQuery(api.git.listRepositories, {}));
  const selected = repositories.find((repository) => repository._id === value);

  return (
    <span className="overflow-hidden text-ellipsis">
      {selected ? selected.name : "Select repository..."}
    </span>
  );
}

export function RepoSelect({ onSelect }: RepoSelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Id<"remote_repositories"> | null>(null);

  const handleSelect: RepoSelectHandlerFn = (repository) => {
    setValue(repository?._id ?? null);
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
          <Suspense fallback={<span>Loading...</span>}>
            <RepoSelectTrigger value={value} />
          </Suspense>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search repository..." className="h-9" />
          <CommandList>
            {open && (
              <ErrorBoundary fallback={RepoListError}>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-4">
                      <Spinner />
                    </div>
                  }
                >
                  <RepoListContent value={value} onSelect={handleSelect} />
                </Suspense>
              </ErrorBoundary>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
