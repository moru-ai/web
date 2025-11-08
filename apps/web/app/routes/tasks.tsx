import type { Route } from "./+types/tasks";
import { authMiddleware } from "~/middlewares/auth-middleware";
import { useParams } from "react-router";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export default function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="mx-auto min-h-screen max-w-5xl py-12">
      <section className="space-y-4">
        <header>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Task</p>
          <h1 className="text-3xl font-semibold tracking-tight">Task {id}</h1>
        </header>
        <div className="border-border/50 text-muted-foreground rounded-2xl border border-dashed p-6">
          Task details view coming soon.
        </div>
      </section>
    </main>
  );
}
