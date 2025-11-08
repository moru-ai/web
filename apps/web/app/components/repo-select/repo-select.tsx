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
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

interface RepoSelectProps {
  onRepoSelect?: (repoFullName: string | null) => void;
}

type RepoSelectHandler = RepoSelectProps["onRepoSelect"];
type RepoSelectHandlerFn = NonNullable<RepoSelectHandler>;

function RepoListContent({ value, onSelect }: { value: string; onSelect: RepoSelectHandlerFn }) {
  const { data: repositories } = useSuspenseQuery(convexQuery(api.git.listRepositories, {}));

  return (
    <>
      <CommandEmpty>No repository found.</CommandEmpty>
      <CommandGroup>
        {repositories.map((repository) => (
          <CommandItem
            key={repository.fullName}
            value={repository.fullName}
            onSelect={(currentValue) => {
              const newValue = currentValue === value ? "" : currentValue;
              onSelect(newValue || null);
            }}
          >
            {repository.name}
            <Check
              className={cn("ml-auto", value === repository.fullName ? "opacity-100" : "opacity-0")}
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

function RepoSelectTrigger({ value }: { value: string }) {
  const { data: repositories } = useSuspenseQuery(convexQuery(api.git.listRepositories, {}));

  return (
    <span className="overflow-hidden text-ellipsis">
      {value
        ? repositories.find((repository) => repository.fullName === value)?.name
        : "Select repository..."}
    </span>
  );
}

export function RepoSelect({ onRepoSelect }: RepoSelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleSelect: RepoSelectHandlerFn = (repoFullName) => {
    setValue(repoFullName || "");
    setOpen(false);
    onRepoSelect?.(repoFullName);
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
