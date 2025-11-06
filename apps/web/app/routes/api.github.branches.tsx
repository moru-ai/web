import { api } from "@moru/convex/_generated/api";
import { App } from "octokit";
import type { Route } from "./+types/api.github.branches";
import { authMiddleware } from "~/middlewares/auth-middleware";
import { convexClientWithAuthMiddleware } from "~/middlewares/convex-client";
import { convexClientContext } from "~/contexts/convex-client";

function requiredEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env: ${name}`);
  return val;
}

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

  // Parse owner/repo from repo_full_name
  const parts = repoFullName.split("/");
  if (parts.length !== 2) {
    return Response.json({ error: "Invalid repo_full_name format. Expected owner/repo" }, { status: 400 });
  }

  const [owner, repo] = parts;

  try {
    // Get user's GitHub installation
    const installation = await client.query(api.git.getInstallationByUserId, {});

    if (!installation || !installation.connected) {
      return Response.json({ error: "No connected GitHub installation found" }, { status: 404 });
    }

    // Initialize Octokit App
    const appId = requiredEnv("GITHUB_APP_ID");
    const privateKey = requiredEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
    const app = new App({ appId, privateKey });

    // Get installation Octokit instance
    const instOctokit = await app.getInstallationOctokit(Number(installation.installationId));

    // Fetch branches
    const branches = await instOctokit.paginate(
      instOctokit.rest.repos.listBranches,
      {
        owner,
        repo,
        per_page: 100,
      }
    );

    // Map branches to response format
    const mappedBranches = branches.map((branch) => ({
      name: branch.name,
      protected: branch.protected ?? false,
    }));

    return Response.json({ branches: mappedBranches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Failed to fetch branches: ${message}` }, { status: 500 });
  }
}

