/**
 * Client — the command issuer.
 *
 * A Client connects to a Worker (directly) or Broker (via relay),
 * and gets back a Sandbox interface to issue commands.
 *
 * Usage:
 *   const sandbox = await createSandbox(node()).connect("wss://...")
 *   await sandbox.exec("bun test")
 */

import type { Sandbox } from "./sandbox";

export interface ClientConfig {
  /** Server URL to connect to (Worker or Broker) */
  serverUrl: string;
  /** Authentication token */
  token?: string;
  /** Target sandbox ID (required when connecting through Broker) */
  sandboxId?: string;
}

export interface Client extends Sandbox {
  /** Disconnect from the server */
  disconnect(): Promise<void>;
  /** Whether the client is connected */
  readonly connected: boolean;
}
