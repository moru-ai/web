import type { ConvexHttpClient } from "convex/browser";
import { createContext } from "react-router";

export const convexClientContext = createContext<ConvexHttpClient>();
