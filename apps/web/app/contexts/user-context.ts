import { createContext } from "react-router";
import type { User } from "@clerk/react-router/server";

export const userContext = createContext<User>();
