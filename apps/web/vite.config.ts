import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: "./app/server/app.ts",
        }
      : undefined,
  },
  resolve: {
    alias: {
      // Ensure runtime/bundler resolves to backend Convex artifacts during dev/build
      "@moru/convex/_generated/api": fileURLToPath(
        new URL("../backend/convex/_generated/api.js", import.meta.url),
      ),
    },
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));
