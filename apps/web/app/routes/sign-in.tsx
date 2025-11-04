import { SignInButton } from "@clerk/react-router";

import { Button } from "~/components/ui/button";

const highlights = [
  "Spawn background coding agents with GitHub-connected tasks.",
  "Track job state across Convex, Redis, and BullMQ from one dashboard.",
  "Review generated diffs and open Pull Requests directly in Moru.",
];

export function meta() {
  return [
    { title: "Sign In — Moru" },
    {
      name: "description",
      content: "Authenticate with Moru to orchestrate AI coding agents and manage active jobs.",
    },
  ];
}

export default function SignIn() {
  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <section className="space-y-8 text-center">
          <p className="border-border bg-card/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm">
            <span className="bg-foreground/70 size-2 rounded-full" aria-hidden="true" />
            Codex agents are warming up
          </p>
          <div className="space-y-4">
            <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
              Moru keeps your agents shipping code while you sleep
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Queue tasks, iterate via chat, and sync straight to GitHub. This UI will grow into the
              command center for every Codex run.
            </p>
          </div>
          <div className="text-muted-foreground grid gap-4 text-left sm:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="border-border bg-card/60 rounded-xl border p-5 shadow-lg shadow-black/10 dark:shadow-white/10"
              >
                <p className="text-sm leading-relaxed">{highlight}</p>
              </div>
            ))}
          </div>
          <SignInButton forceRedirectUrl={"/"}>
            <Button className="rounded-full px-6 shadow-lg shadow-black/10 dark:shadow-white/10">
              Log in to start building
            </Button>
          </SignInButton>
        </section>
      </main>
    </>
  );
}
