/**
 * @sandboxxjs/node-platform — Node.js platform for SandboX.
 *
 * Usage:
 *   import { createSandbox } from "sandboxxjs"
 *   import { node } from "@sandboxxjs/node-platform"
 *
 *   const sandbox = createSandbox(node())
 *   await sandbox.exec("echo hello")
 */

import type { Platform } from "@sandboxxjs/core/platform";
import { createNodeBroker } from "./broker.js";
import { createNodeClient } from "./client.js";
import { NodeLocalSandbox } from "./local.js";
import { createNodeWorkerBuilder } from "./worker.js";

export function node(): Platform {
  return {
    createLocal: () => new NodeLocalSandbox(),
    createClient: (config) => createNodeClient(config),
    createWorker: () => createNodeWorkerBuilder(),
    createBroker: (config) => createNodeBroker(config),
  };
}

export { NodeLocalSandbox } from "./local.js";
