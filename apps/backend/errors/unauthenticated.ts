export class UnauthenticatedError extends Error {
  constructor(message = "Unauthenticated") {
    super(message);
    this.name = "UnauthenticatedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isUnauthenticatedError = (error: unknown): error is UnauthenticatedError =>
  error instanceof Error && error.name === "UnauthenticatedError";
