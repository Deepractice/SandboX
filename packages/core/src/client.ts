/**
 * SandboxClient — the agent that runs inside every sandbox environment.
 *
 * Step 2-3 of the lifecycle: Prepare → Register.
 *
 * After allocation, the sandbox environment starts a SandboxClient.
 * The client connects to the service via WebSocket, registers itself,
 * and then listens for commands (exec, fs, process operations).
 *
 * The client is platform-agnostic. Platform differences are injected
 * via SandboxProvider, which supplies Executor, FileSystem, and
 * ProcessManager components:
 *   - node-provider: child_process + node:fs
 *   - web-provider: @webcontainer/api
 *   - Future: Docker, SSH, etc.
 *
 * Lifecycle: Allocate → Prepare → Register → Ready → Command
 *                       ^^^^^^^^^^^^^^^^^
 */

/**
 * Connection options for a sandbox-client.
 */
export interface SandboxClientOptions {
  /** WebSocket URL of the sandbox service registry */
  wsUrl: string;
  /** Sandbox identifier */
  sandboxId: string;
  /** Authentication token */
  token: string;
  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatInterval?: number;
}

/**
 * SandboxClient — connects to service, receives commands, executes via provider components.
 *
 * Usage:
 *   const provider = new NodeProvider();            // or WebContainerProvider
 *   const client = createSandboxClient(provider);
 *   await client.connect({ wsUrl, sandboxId, token });
 *   // Client is now registered and listening for commands
 */
export interface SandboxClient {
  /** Connect to the sandbox service and register */
  connect(options: SandboxClientOptions): Promise<void>;
  /** Disconnect from the service */
  disconnect(): Promise<void>;
  /** Whether the client is connected and registered */
  readonly connected: boolean;
}
