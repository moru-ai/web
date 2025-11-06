import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("create-task", "routes/create-task.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("settings", "routes/settings.tsx", [
    index("routes/settings.connectors.tsx"),
    route("github", "routes/settings.github.tsx"),
  ]),
  // Resource routes for GitHub App integration
  route("api/github/callback", "routes/api.github.callback.tsx"),
  route("api/github/disconnect", "routes/api.github.disconnect.tsx"),
  route("api/github/branches", "routes/api.github.branches.tsx"),
] satisfies RouteConfig;
