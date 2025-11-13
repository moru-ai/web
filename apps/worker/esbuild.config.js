import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { glob } from "glob";

const entryPoints = await glob([path.resolve("./src/**/*.ts")]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const convexGeneratedDir = path.join(repoRoot, "apps/backend/convex/_generated");

build({
  entryPoints,
  outdir: "dist",
  target: "node20",
  platform: "node",
  bundle: true,
  minify: false,
  sourcemap: false,
  format: "esm",
  packages: "external",
  plugins: [
    {
      name: "convex-generated-alias",
      setup(build) {
        build.onResolve({ filter: /^@moru\/convex\/_generated\/api$/ }, () => {
          return {
            path: path.join(convexGeneratedDir, "api.js"),
          };
        });
      },
    },
    {
      name: "log-files",
      setup(build) {
        // This onLoad hook will trigger for all files (because of the /.*/ filter)
        build.onLoad({ filter: /.*/ }, async (args) => {
          console.log("Loading file:", args.path);
          // Returning undefined allows the default loader to take over
          return;
        });
      },
    },
  ],
});
