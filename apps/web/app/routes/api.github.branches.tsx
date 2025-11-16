import type { Route } from "./+types/api.github.branches";
import { authMiddleware } from "~/middlewares/auth-middleware";
import { convexClientWithAuthMiddleware } from "~/middlewares/convex-client";
import { convexClientContext } from "~/contexts/convex-client";
import { fetchRepositoryBranches } from "~/lib/github.server";

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
  convexClientWithAuthMiddleware,
];

export async function loader(args: Route.LoaderArgs) {
  const { request, context } = args;
  const client = context.get(convexClientContext);

  const url = new URL(request.url);
  const repoFullName = url.searchParams.get("repo_full_name");

  if (!repoFullName) {
    return Response.json({ error: "Missing repo_full_name parameter" }, { status: 400 });
  }

  try {
    const branches = await fetchRepositoryBranches({
      convexClient: client,
      repoFullName,
    });

    return Response.json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Failed to fetch branches: ${message}` }, { status: 500 });
  }
}
