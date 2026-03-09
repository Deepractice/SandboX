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
 *   const sandbox = await createSandbox(node()).connect("wss://...")
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

/**
 * createSandbox — the single entry point for all SandboX operations.
 *
 * Returns a SandboxBuilder that can be used directly (local execution)
 * or chained with .connect(), .serve(), .run(), .broker() for network modes.
 */
export function createSandbox(platform: Platform): SandboxBuilder {
  const local = platform.createLocal();

  return {
    // Local Sandbox operations — delegate to platform's local implementation
    exec: (command, options) => local.exec(command, options),
    startProcess: (command, options) => local.startProcess(command, options),
    killProcess: (processId) => local.killProcess(processId),
    listProcesses: () => local.listProcesses(),
    readFile: (path) => local.readFile(path),
    writeFile: (path, content) => local.writeFile(path, content),
    listFiles: (path) => local.listFiles(path),
    mkdir: (path, options) => local.mkdir(path, options),
    deleteFile: (path) => local.deleteFile(path),
    destroy: () => local.destroy(),

    // Network modes
    connect: (serverUrl, options) =>
      platform.createClient({
        serverUrl,
        token: options?.token,
        sandboxId: options?.sandboxId,
      }),

    serve: (config) => platform.createWorker().serve(config),

    run: (config) => platform.createWorker().run(config),

    broker: (config) => platform.createBroker(config),
  };
}
