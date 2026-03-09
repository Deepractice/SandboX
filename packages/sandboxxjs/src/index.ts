/**
 * sandboxxjs — the user-facing SDK for SandboX.
 *
 * Usage:
 *   import { createSandbox } from "sandboxxjs"
 *   import { node } from "@sandboxxjs/node-platform"
 *
 *   // Local — direct execution, no network
 *   const sandbox = createSandbox(node())
 *   await sandbox.exec("bun test")
 *
 *   // Client — connect to remote Worker or Broker
 *   const client = await createSandbox(node()).connect("wss://...")
 *
 *   // Client — pure client mode, no platform needed (browser / Node.js 22+)
 *   const client = await createSandbox().connect("wss://...", { sandboxId: "xxx" })
 *
 *   // Worker — serve for direct connections
 *   const worker = await createSandbox(node()).serve({ port: 3100 })
 *
 *   // Worker — run and register with Broker
 *   const worker = await createSandbox(node()).run({ broker: "wss://...", token: "xxx" })
 *
 *   // Broker — registry + router + discovery + proxy
 *   const broker = await createSandbox(node()).broker({ port: 8080 })
 */

import type {
  Broker,
  BrokerConfig,
  Client,
  RunConfig,
  Sandbox,
  ServeConfig,
  Worker,
} from "@sandboxxjs/core";
import type { Platform } from "@sandboxxjs/core/platform";
import { connect } from "./client.js";

// Re-export all core types
export type {
  Broker,
  BrokerConfig,
  Client,
  ExecOptions,
  ExecResult,
  FileInfo,
  ProcessInfo,
  RunConfig,
  Sandbox,
  ServeConfig,
  Worker,
  WorkerInfo,
} from "@sandboxxjs/core";

// Re-export Platform SPI types
export type { Platform, WorkerBuilder } from "@sandboxxjs/core/platform";

// Re-export connect for direct usage
export { connect } from "./client.js";

export interface SandboxBuilder extends Sandbox {
  /** Connect to a remote Worker or Broker as a Client */
  connect(serverUrl: string, options?: { token?: string; sandboxId?: string }): Promise<Client>;

  /** Start a Worker that listens for direct connections */
  serve(config: ServeConfig): Promise<Worker>;

  /** Start a Worker that connects to a Broker */
  run(config: RunConfig): Promise<Worker>;

  /** Start a Broker (registry + router + discovery + proxy) */
  broker(config: BrokerConfig): Promise<Broker>;
}

function noPlatform(method: string): never {
  throw new Error(
    `${method}() requires a platform. Use createSandbox(node()) or createSandbox(cloudflare()).`
  );
}

/**
 * createSandbox — the single entry point for all SandboX operations.
 *
 * With platform: full functionality (local exec, connect, serve, run, broker).
 * Without platform: client-only mode (connect only, works in browser).
 */
export function createSandbox(platform?: Platform): SandboxBuilder {
  const local = platform?.createLocal();

  return {
    // Local Sandbox operations
    exec: (command, options) => (local ? local.exec(command, options) : noPlatform("exec")),
    startProcess: (command, options) =>
      local ? local.startProcess(command, options) : noPlatform("startProcess"),
    killProcess: (processId) => (local ? local.killProcess(processId) : noPlatform("killProcess")),
    listProcesses: () => (local ? local.listProcesses() : noPlatform("listProcesses")),
    readFile: (path) => (local ? local.readFile(path) : noPlatform("readFile")),
    writeFile: (path, content) =>
      local ? local.writeFile(path, content) : noPlatform("writeFile"),
    listFiles: (path) => (local ? local.listFiles(path) : noPlatform("listFiles")),
    mkdir: (path, options) => (local ? local.mkdir(path, options) : noPlatform("mkdir")),
    deleteFile: (path) => (local ? local.deleteFile(path) : noPlatform("deleteFile")),
    destroy: () => (local ? local.destroy() : noPlatform("destroy")),

    // Network modes
    connect: (serverUrl, options) =>
      platform
        ? platform.createClient({
            serverUrl,
            token: options?.token,
            sandboxId: options?.sandboxId,
          })
        : connect(serverUrl, options),

    serve: (config) => (platform ? platform.createWorker().serve(config) : noPlatform("serve")),

    run: (config) => (platform ? platform.createWorker().run(config) : noPlatform("run")),

    broker: (config) => (platform ? platform.createBroker(config) : noPlatform("broker")),
  };
}
