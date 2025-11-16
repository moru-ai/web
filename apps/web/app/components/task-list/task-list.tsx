import { useMemo } from "react";
import { Link } from "react-router";
import { api } from "@moru/convex/_generated/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
const skeletonRows = Array.from({ length: 4 }, (_, index) => index);

const RELATIVE_TIME_UNITS: Array<{ max: number; unit: Intl.RelativeTimeFormatUnit; div: number }> =
  [
    { max: 60, unit: "second", div: 1 },
    { max: 60 * 60, unit: "minute", div: 60 },
    { max: 60 * 60 * 24, unit: "hour", div: 60 * 60 },
    { max: 60 * 60 * 24 * 7, unit: "day", div: 60 * 60 * 24 },
    { max: 60 * 60 * 24 * 30, unit: "week", div: 60 * 60 * 24 * 7 },
    { max: 60 * 60 * 24 * 365, unit: "month", div: 60 * 60 * 24 * 30 },
    { max: Infinity, unit: "year", div: 60 * 60 * 24 * 365 },
  ];

function formatRelativeTime(value: number, formatter: Intl.RelativeTimeFormat) {
  const now = Date.now();
  const delta = Math.max(0, now - value) / 1000;
  for (const { max, unit, div } of RELATIVE_TIME_UNITS) {
    if (delta < max) {
      const count = Math.round(-delta / div);
      return formatter.format(count, unit);
    }
  }
  return formatter.format(0, "second");
}

export function TaskListSkeleton() {
  return (
    <div className="rounded-2xl p-4">
      <div className="bg-foreground/10 mb-4 h-6 w-32 rounded" />
      <ul className="divide-border/30 divide-y">
        {skeletonRows.map((row) => (
          <li key={row} className="py-4">
            <div className="bg-foreground/10 mb-2 h-4 w-48 rounded" />
            <div className="bg-foreground/10 h-3 w-32 rounded" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TaskList() {
  const { data: tasks } = useSuspenseQuery(convexQuery(api.tasks.listTasksForUser, {}));
  const relativeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }),
    [],
  );

  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground rounded-2xl p-6 text-center text-sm">
        No tasks yet. Submit a prompt above to kick things off.
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4">
      <div className="border-border/40 text-muted-foreground mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wide">
        Tasks
      </div>
      <ul className="divide-border/40 divide-y">
        {tasks.map((task) => (
          <li key={task.taskId} className="py-1">
            <Link
              to={`/tasks/${task.taskId}`}
              className="hover:bg-foreground/5 focus-visible:bg-foreground/10 block rounded-2xl px-4 py-3 transition-colors focus-visible:outline-none"
            >
              <div className="text-base font-semibold">{task.title?.trim() || "Untitled task"}</div>
              <div className="text-muted-foreground text-sm">
                {formatRelativeTime(task.createdAt, relativeFormatter)} ·{" "}
                {task.repoFullName ?? "Unknown repo"} ·{" "}
                <span className="font-mono text-xs tracking-wide">{task.branch}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
