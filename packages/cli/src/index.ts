/**
 * @sandboxxjs/cli
 * CLI for SandboX
 */

import { createSandbox } from "sandboxxjs";
import * as fs from "fs/promises";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command) {
    showHelp();
    process.exit(0);
  }

  switch (command) {
    case "run":
      await runCommand(args.slice(1));
      break;
    case "list":
      await listCommand();
      break;
    case "destroy":
      await destroyCommand(args.slice(1));
      break;
    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

async function runCommand(args: string[]) {
  const runtime = args[0];
  const filePath = args[1];

  if (!runtime || !filePath) {
    console.error("Usage: sandbox run <runtime> <file>");
    console.error("Example: sandbox run node script.js");
    process.exit(1);
  }

  if (!["bash", "node", "python"].includes(runtime)) {
    console.error(`Invalid runtime: ${runtime}`);
    console.error("Valid runtimes: bash, node, python");
    process.exit(1);
  }

  try {
    const code = await fs.readFile(filePath, "utf-8");

    // For bash, use node runtime with shell() method
    if (runtime === "bash") {
      const sandbox = createSandbox({ runtime: "node", isolator: "none" });
      console.log(`Running ${filePath} with shell...`);
      const result = await sandbox.shell(`sh ${filePath}`);

      if (result.success) {
        console.log("\nOutput:");
        if (result.stdout) console.log(result.stdout);
      } else {
        console.error("\nError:");
        if (result.stderr) console.error(result.stderr);
        process.exit(result.exitCode || 1);
      }

      await sandbox.destroy();
      return;
    }

    // For node/python, use execute()
    console.log(`Running ${filePath} with ${runtime} runtime...`);

    const sandbox = createSandbox({
      runtime: runtime as "node" | "python",
      isolator: "none",
    });

    const result = await sandbox.execute(code);

    if (result.success) {
      console.log("\nOutput:");
      if (result.stdout) console.log(result.stdout);
    } else {
      console.error("\nError:");
      if (result.stderr) console.error(result.stderr);
      process.exit(result.exitCode || 1);
    }

    await sandbox.destroy();
  } catch (error) {
    console.error("Failed to run sandbox:", (error as Error).message);
    process.exit(1);
  }
}

async function listCommand() {
  console.log("TODO: List active sandboxes");
  // TODO: Implement sandbox listing using SandboxManager
}

async function destroyCommand(args: string[]) {
  const id = args[0];
  if (!id) {
    console.error("Usage: sandbox destroy <id>");
    process.exit(1);
  }
  console.log(`TODO: Destroy sandbox ${id}`);
  // TODO: Implement sandbox destruction using SandboxManager
}

function showHelp() {
  console.log(`
SandboX CLI - Secure code execution sandbox

Usage:
  sandbox run <runtime> <file>    Run code in a sandbox
  sandbox list                    List active sandboxes
  sandbox destroy <id>            Destroy a sandbox
  sandbox help                    Show this help

Runtimes:
  bash      - Bash shell
  node      - Node.js
  python    - Python

Examples:
  sandbox run node script.js
  sandbox run python script.py
  sandbox run bash script.sh
  `);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
