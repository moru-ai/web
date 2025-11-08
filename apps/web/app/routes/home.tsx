import type { Route } from './+types/home';
import { PromptInput } from '~/components/ui/prompt-input';
import { TaskList, TaskListSkeleton } from '~/components/task-list/task-list';
import { authMiddleware } from '~/middlewares/auth-middleware';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { Authenticated, AuthLoading } from 'convex/react';

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function meta() {
  return [
    { title: 'Moru — Launch Coding Agents' },
    {
      name: 'description',
      content: 'Kick off AI-driven coding tasks, monitor queues, and prepare production-ready PRs.',
    },
  ];
}

export default function Home() {
  return (
    <>
      <main className="mx-auto min-h-screen max-w-5xl py-12">
        <section className="space-y-4 text-left">
          <Authenticated>
            <div className="space-y-4">
              <ErrorBoundary fallback={<div>Error loading prompt input</div>}>
                <Suspense fallback={<div>Loading...</div>}>
                  <PromptInput />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary fallback={<div>Error loading tasks</div>}>
                <Suspense fallback={<TaskListSkeleton />}>
                  <TaskList />
                </Suspense>
              </ErrorBoundary>
            </div>
          </Authenticated>
          <AuthLoading>hello</AuthLoading>
        </section>
      </main>
    </>
  );
}
