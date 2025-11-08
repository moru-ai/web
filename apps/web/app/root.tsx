import { ClerkProvider, SignedIn, UserButton } from '@clerk/react-router';
import { useAuth } from '@clerk/react-router';
import { rootAuthLoader, clerkMiddleware, getAuth, clerkClient } from '@clerk/react-router/server';
import { dark } from '@clerk/themes';
import { useMemo, type ReactNode } from 'react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { Authenticated, ConvexReactClient } from 'convex/react';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  isRouteErrorResponse,
  Links,
  Link,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import stylesheet from './app.css?url';
import type { Route } from './+types/root';
import { Toaster } from './components/ui/sonner';
import { useColorScheme } from './hooks/useColorScheme';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@400;600&display=swap',
  },
  { rel: 'stylesheet', href: stylesheet },
];

export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()];

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string, {
  unsavedChangesWarning: false,
});
const convexQueryClient = new ConvexQueryClient(convex);

const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});

convexQueryClient.connect(queryClient);

export async function loader(args: Route.LoaderArgs) {
  return await rootAuthLoader(args, async ({ request }) => {
    const { getToken } = request.auth;
    const token = await getToken({ template: 'convex' });
    console.log('convexQueryClient', convexQueryClient);

    convexQueryClient.serverHttpClient?.setAuth(token ?? '');
    return {
      token,
    };
  });
}

export function meta() {
  return [
    { title: 'Moru — AI Coding Agent' },
    {
      name: 'description',
      content:
        'Orchestrate background AI coding agents, monitor queues, and ship faster with Moru.',
    },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const systemScheme = useColorScheme();
  const appearance = useMemo(
    () => (systemScheme === 'dark' ? { baseTheme: dark } : undefined),
    [systemScheme],
  );

  return (
    <ClerkProvider loaderData={loaderData} appearance={appearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <QueryClientProvider client={queryClient}>
          <header className="border-border bg-background/60 flex items-center justify-between border-b px-6 py-4 backdrop-blur">
            <Link to="/" className="app-brand text-lg font-semibold tracking-tight">
              Moru
            </Link>
            <div className="flex items-center gap-3">
              <SignedIn>
                <Link
                  to="/settings"
                  className="text-foreground text-sm font-medium no-underline hover:opacity-80"
                >
                  Settings
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          <main>
            <Outlet />
          </main>
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = 'Unexpected error';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Not found' : 'Request error';
    details = error.statusText || details;
  } else if (error instanceof Error) {
    title = error.message.includes('VITE_CONVEX_URL') ? 'Configuration Error' : 'Unexpected error';
    details = error.message;
    if (import.meta.env.DEV) {
      stack = error.stack;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <section className="space-y-4">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{details}</p>
        {stack ? (
          <pre className="bg-card text-foreground max-h-[320px] w-full overflow-auto rounded-lg p-4 text-left text-xs">
            <code>{stack}</code>
          </pre>
        ) : null}
      </section>
    </main>
  );
}
