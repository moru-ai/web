export function GitHubCardError({ error }: { error: Error }) {
  return (
    <div className="border-border bg-card/50 text-failed rounded-lg border p-5 text-sm">
      Unable to load GitHub connection details right now.{" "}
      {error.message || "Please refresh to try again."}
    </div>
  );
}
