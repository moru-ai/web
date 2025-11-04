import { api } from "@moru/convex/_generated/api";
import { App } from "octokit";
import type { Route } from "./+types/api.github.callback";
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

  const installationId = url.searchParams.get("installation_id");

  if (!installationId) {
    return new Response("Missing installation_id", { status: 400 });
  }

  const appId = requiredEnv("GITHUB_APP_ID");
  const privateKey = requiredEnv("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
  const app = new App({ appId, privateKey });

  // Fetch app slug and installation metadata
  const [{ data: appData }, { data: inst }] = await Promise.all([
    app.octokit.rest.apps.getAuthenticated(),
    app.octokit.request("GET /app/installations/{installation_id}", {
      installation_id: Number(installationId),
    }),
  ]);

  const accountLogin = inst.account?.name ?? "unknown";
  const appSlug = appData?.slug ?? "unknown";

  // Upsert installation and link to user
  await client.mutation(api.git.upsertInstallation, {
    installationId,
    accountLogin,
    appSlug,
  });

  // Fetch repos for installation and upsert
  const instOctokit = await app.getInstallationOctokit(Number(installationId));
  const repos = await instOctokit.paginate(
    instOctokit.rest.apps.listReposAccessibleToInstallation,
    {
      per_page: 100,
    },
  );

  const mapped = repos.map((r) => ({
    repoId: r.id,
    fullName: r.full_name,
    name: r.name,
    owner: r.owner?.login ?? r.full_name?.split("/")?.[0] ?? "",
    private: !!r.private,
    defaultBranch: r.default_branch ?? null,
    visibility: r.visibility,
  }));
  await client.mutation(api.git.upsertRepositories, {
    installationId,
    repos: mapped,
  });

  // Respect optional state redirect
  let redirectTo = "/settings";
  const rawState = url.searchParams.get("state");

  if (rawState) {
    try {
      const st = JSON.parse(rawState);
      if (st && typeof st.client_redirect_to === "string") {
        redirectTo = st.client_redirect_to;
      }
    } catch {
      // ignore invalid state
    }
  }

  return new Response(null, { status: 302, headers: { Location: redirectTo } });
}
