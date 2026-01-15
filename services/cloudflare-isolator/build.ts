/**
 * Build script - compile server to binaries for multiple platforms
 */

import { $ } from "bun";
import * as path from "path";

const platforms = [
  { os: "darwin", arch: "arm64" },
  { os: "darwin", arch: "x64" },
  { os: "linux", arch: "x64" },
];

const outputDir = "./dist/bin";

// Ensure output directory exists
await $`mkdir -p ${outputDir}`;

console.log("Building cloudflare-isolator binaries...\n");

for (const { os, arch } of platforms) {
  const target = `bun-${os}-${arch}`;
  const outputName = `cloudflare-isolator-${os}-${arch}${os === "windows" ? ".exe" : ""}`;
  const outputPath = path.join(outputDir, outputName);

  console.log(`Building for ${os}-${arch}...`);

  try {
    await $`bun build --compile --target=${target} ./src/server.ts --outfile ${outputPath}`;
    console.log(`  ✓ ${outputName}`);
  } catch (error) {
    console.error(`  ✗ Failed to build ${os}-${arch}`);
    if (os === "linux") {
      console.log(`  Note: Cross-compilation to Linux may not work on macOS`);
    }
  }
}

// Build CLI wrapper
console.log("\nBuilding CLI wrapper...");
await $`bun build ./src/cli.ts --outfile ./dist/cli.js --target node`;
console.log("  ✓ cli.js");

console.log("\n✓ Build complete");
console.log(`Binaries saved to: ${outputDir}/`);
