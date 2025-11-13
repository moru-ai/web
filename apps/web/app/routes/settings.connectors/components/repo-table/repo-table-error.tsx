export function RepoTableError({ error }: { error: Error }) {
  return (
    <div className="border-border bg-card/50 text-failed rounded-lg border p-4 text-sm">
      {error.message || "Unable to load repositories right now."}
    </div>
  );
}
