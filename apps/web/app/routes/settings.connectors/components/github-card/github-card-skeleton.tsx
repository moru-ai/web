import { RepoTableSkeleton } from "../repo-table/repo-table-skeleton";

export function GitHubCardSkeleton() {
  return (
    <div className="border-border bg-card/50 rounded-lg border p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="bg-foreground/10 h-5 w-28 rounded" />
          <div className="bg-foreground/5 h-4 w-64 rounded" />
        </div>
        <div className="border-border bg-foreground/5 h-6 w-20 rounded-full border" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="bg-foreground/10 h-9 w-36 rounded" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="bg-foreground/10 h-4 w-32 rounded" />
        <RepoTableSkeleton />
      </div>
    </div>
  );
}
