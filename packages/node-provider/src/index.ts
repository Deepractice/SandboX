/**
 * @sandboxxjs/node-provider — Node.js provider for sandboxxjs.
 *
 * Implements SandboxProvider using child_process and node:fs.
 * Runs inside cloud containers (Cloudflare, Docker, etc.).
 *
 * Usage:
 *   import { NodeProvider } from "@sandboxxjs/node-provider";
 *   import { createSandboxClient } from "@sandboxxjs/core";
 *
 *   const client = createSandboxClient(new NodeProvider());
 *   await client.connect({ wsUrl, sandboxId, token });
 */

export { NodeExecutor } from "./node-executor";
export { NodeFileSystem } from "./node-filesystem";
export { NodeProcessManager } from "./node-process-manager";
export { NodeProvider } from "./node-provider";
