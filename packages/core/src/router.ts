/**
 * SandboxRouter — routes RPC methods to sandbox operations.
 *
 * Step 5 of the lifecycle: Command.
 *
 * The router is the external-facing RPC interface.
 * It combines the allocator (lifecycle) and registry (connections)
 * to provide a unified dispatch: method + params → result.
 *
 * Internally, it resolves the sandboxId from params, finds the
 * connected sandbox-client through the registry, and forwards
 * the command over WebSocket.
 *
 * Lifecycle: Allocate → Prepare → Register → Ready → Command
 *                                                     ^^^^^^^
 */

import type { Sandbox } from "./sandbox";

export interface SandboxRouter {
  /** Get a Sandbox handle by id — routes through registry to connected client */
  getSandbox(sandboxId: string): Sandbox;
  /** Dispatch an RPC method with params */
  dispatch(method: string, params: Record<string, unknown>): Promise<unknown>;
}
