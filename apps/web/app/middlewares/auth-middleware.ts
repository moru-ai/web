import { getAuth, clerkClient } from "@clerk/react-router/server";
import { MiddlewareFunction, redirect } from "react-router";
import { userContext } from "~/contexts/user-context";

type Args = Parameters<MiddlewareFunction>[0];

export const authMiddleware = async (args: Args) => {
  const { isAuthenticated, userId } = await getAuth(args);

  if (!isAuthenticated) {
    throw redirect("/sign-in");
  }

  const { context } = args;

  const user = await clerkClient(args).users.getUser(userId);

  context.set(userContext, user);
};
