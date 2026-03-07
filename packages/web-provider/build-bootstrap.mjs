import { build } from "esbuild";

await build({
  entryPoints: ["src/bootstrap.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  outfile: "dist/bootstrap.js",
  minify: true,
});
