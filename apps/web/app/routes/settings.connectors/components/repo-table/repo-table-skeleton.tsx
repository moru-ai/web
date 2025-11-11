export function RepoTableSkeleton() {
  return (
    <div className="border-border overflow-hidden rounded-lg border p-4">
      <div className="space-y-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="bg-foreground/10 h-10 w-full animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
