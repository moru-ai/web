/**
 * Branch Selection Dropdown Component
 *
 * Design Decision: Uses TanStack Query for external API calls
 * - We use `useSuspenseInfiniteQuery` from TanStack Query to fetch from our API route
 * - TanStack Query provides better caching, retry logic, and state management for API calls
 * - Suspense boundaries handle loading states declaratively
 * - See AGENTS.md "Pagination and Data Fetching" section for more details
 */

import { useState, useEffect } from "react";

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
import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchBranches, type Branch } from "~/lib/api/github";

interface BranchSelectProps {
  repoFullName: string | null;
  onSelect?: (branchName: string | null) => void;
}

function BranchListContent({
  repoFullName,
  value,
  onSelect,
}: {
  repoFullName: string;
  value: string;
  onSelect: (branchName: string | null) => void;
}) {
  const { data } = useSuspenseQuery({
    queryKey: ["branches", repoFullName],
    queryFn: () => fetchBranches(repoFullName),
  });

  const branches: Branch[] = data.branches || [];

  return (
    <>
      <CommandEmpty>No branch found.</CommandEmpty>
      <CommandGroup>
        {branches.map((branch) => (
          <CommandItem
            key={branch.name}
            value={branch.name}
            onSelect={(currentValue) => {
              const newValue = currentValue === value ? "" : currentValue;
              onSelect(newValue || null);
            }}
          >
            {branch.name}
            {branch.protected && (
              <span className="text-muted-foreground ml-2 text-xs">(protected)</span>
            )}
            <Check className={cn("ml-auto", value === branch.name ? "opacity-100" : "opacity-0")} />
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

function BranchListError({ error }: { error: Error }) {
  return (
    <div className="text-destructive p-4 text-sm">{error.message || "Failed to load branches"}</div>
  );
}

export function BranchSelect({ repoFullName, onSelect }: BranchSelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Reset branch selection when repository changes
  useEffect(() => {
    setValue("");
    setOpen(false);
    onSelect?.(null);
  }, [repoFullName, onSelect]);

  if (!repoFullName) {
    return null;
  }

  const handleSelect = (branchName: string | null) => {
    setValue(branchName || "");
    setOpen(false);
    onSelect?.(branchName);
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
          <span className="overflow-hidden text-ellipsis">{value || "Select branch..."}</span>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search branch..."
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {open && (
              <ErrorBoundary fallback={BranchListError}>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-4">
                      <Spinner />
                    </div>
                  }
                >
                  <BranchListContent
                    repoFullName={repoFullName}
                    value={value}
                    onSelect={handleSelect}
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
