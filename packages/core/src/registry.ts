/**
 * SandboxRegistry — accepts sandbox-client connections and manages lifecycle.
 *
 * Step 3-4 of the lifecycle: Register → Ready.
 *
 * When a sandbox-client connects via WebSocket and sends a register message,
 * the registry:
 *   1. Validates the token
 *   2. Binds the WebSocket connection to the sandboxId
 *   3. Updates the sandbox status from "pending" to "ready"
 *   4. Provides the command routing channel
 *
 * The registry also handles disconnection, heartbeat, and reconnection.
 *
 * Lifecycle: Allocate → Prepare → Register → Ready → Command
 *                                 ^^^^^^^^^^^^^^^^^
 */

export interface SandboxConnection {
  sandboxId: string;
  connectedAt: number;
}

export interface SandboxRegistry {
  /** Check if a sandbox-client is connected and ready */
  has(sandboxId: string): boolean;
  /** List all active connections */
  connections(): SandboxConnection[];
}
