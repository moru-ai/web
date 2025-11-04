import { getAuth, clerkClient } from "@clerk/react-router/server";
import { ConvexHttpClient } from "convex/browser";
import { MiddlewareFunction, redirect } from "react-router";

import { convexClientContext } from "~/contexts/convex-client";

type Args = Parameters<MiddlewareFunction>[0];

export const convexClientWithAuthMiddleware = async (args: Args) => {
  const auth = await getAuth(args);

  if (!auth.sessionId) {
    throw redirect("/sign-in");
  }
  const token = await clerkClient(args).sessions.getToken(auth.sessionId, "convex");
  const client = new ConvexHttpClient(process.env.CONVEX_URL!, { auth: token.jwt });

  const { context } = args;

  context.set(convexClientContext, client);
};
