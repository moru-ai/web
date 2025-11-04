// https://github.com/vercel/vercel/issues/13327#issuecomment-3387978746
// eslint-disable-next-line import/no-unresolved
import * as build from "virtual:react-router/server-build";
import { createRequestHandler, RouterContextProvider } from "react-router";

const handler = createRequestHandler(build);

export default (req: Request) => handler(req, new RouterContextProvider());
