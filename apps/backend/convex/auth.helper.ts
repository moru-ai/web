import { UnauthenticatedError } from "errors/unauthenticated";
import { GenericCtx } from "./_generated/server";

export const getUserIdentityOrThrow = async (ctx: GenericCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null || !identity.id) {
    throw new UnauthenticatedError();
  }

  return identity;
};
