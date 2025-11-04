import { api } from "@moru/convex/_generated/api";
import { App } from "octokit";
import type { Route } from "./+types/api.github.disconnect";
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

export async function action(args: Route.ActionArgs) {
  const { request, context } = args;
  const client = context.get(convexClientContext);

  const body = await request.json().catch(() => ({}));
  let installationId = body.installationId as string | undefined;
  if (!installationId) return new Response("Missing installationId", { status: 400 });

  const appId = requiredEnv("GITHUB_APP_ID");
  const privateKey = requiredEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");

  const app = new App({ appId, privateKey });

  // Sanity check: ensure this server is authenticated as the expected app
  await app.octokit.rest.apps.getAuthenticated();

  // Verify the installation belongs to this app before attempting uninstall.
  // If not found, attempt to find the correct installation for the same account and fall back to that.
  let found = true;
  try {
    await app.octokit.request("GET /app/installations/{installation_id}", {
      installation_id: Number(installationId),
    });
  } catch {
    found = false;
  }

  if (!found) {
    // Fallback: find the user's installation account from Convex, then resolve the matching installation id for this app
    const installsForUser = (await client.query(api.git.listInstallationsForUser)) as Array<{
      installation?: { accountLogin?: string };
    }>;
    const accountLogin = installsForUser?.[0]?.installation?.accountLogin;

    const allInstalls = (await app.octokit.paginate(app.octokit.rest.apps.listInstallations, {
      per_page: 100,
    })) as Array<{ id: number; account?: { login?: string } }>;
    const match = allInstalls.find((i) => i.account?.login === accountLogin);
    if (!match) {
      // Already disconnected on GitHub: mark as disconnected in our DB as well.
      await client.mutation(api.git.disconnectInstallationForUser, {
        installationId,
        removeRepos: true,
      });
      return Response.json({ ok: true, alreadyDisconnected: true });
    }
    installationId = String(match.id);
  }

  // Uninstall the app installation on GitHub
  await app.octokit.request("DELETE /app/installations/{installation_id}", {
    installation_id: Number(installationId),
  });

  // Mark disconnected and optionally clean up repos in Convex
  await client.mutation(api.git.disconnectInstallationForUser, {
    installationId: installationId!,
    removeRepos: true,
  });

  return Response.json({ ok: true });
}

export function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}
