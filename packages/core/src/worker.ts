/**
 * Worker — the command executor.
 *
 * A Worker implements the Sandbox interface locally (spawn, fs, etc.)
 * and exposes it as a network service.
 *
 * Two modes:
 *   serve({ port }) — listen for direct Client connections
 *   run({ broker, token }) — connect to a Broker and register
 *
 * Usage:
 *   createSandbox(node()).serve({ port: 3100 })
 *   createSandbox(node()).run({ bridge: "wss://...", token: "xxx" })
 */

import type { Sandbox } from "./sandbox";

export interface ServeConfig {
  /** Port to listen on */
  port: number;
  /** Hostname to bind (default: "0.0.0.0") */
  hostname?: string;
}

export interface RunConfig {
  /** Broker URL to connect to */
  broker: string;
  /** Authentication token */
  token: string;
  /** Sandbox ID to register as */
  sandboxId?: string;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
}

export interface Worker extends Sandbox {
  /** Stop the worker (close server or disconnect from broker) */
  stop(): Promise<void>;
  /** Whether the worker is running */
  readonly running: boolean;
  /** The sandbox ID this worker is registered as */
  readonly sandboxId: string;
}
