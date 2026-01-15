#!/usr/bin/env node

/**
 * CLI wrapper - selects the correct binary for current platform
 */

import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getBinaryPath(): string {
  const platform = process.platform;
  const arch = process.arch;

  let binaryName: string;
  if (platform === "darwin" && arch === "arm64") {
    binaryName = "cloudflare-isolator-darwin-arm64";
  } else if (platform === "darwin" && arch === "x64") {
    binaryName = "cloudflare-isolator-darwin-x64";
  } else if (platform === "linux" && arch === "x64") {
    binaryName = "cloudflare-isolator-linux-x64";
  } else {
    console.error(`Unsupported platform: ${platform}-${arch}`);
    process.exit(1);
  }

  // Binary is in ./bin/ relative to this cli.js (both in dist/)
  return path.join(__dirname, "bin", binaryName);
}

// Get binary and forward to it
const binaryPath = getBinaryPath();
const args = process.argv.slice(2);

const child = spawn(binaryPath, args, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
