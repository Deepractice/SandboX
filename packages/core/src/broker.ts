/**
 * Broker — the intermediary between Client and Worker.
 *
 * A Broker is the classic message broker pattern:
 *   - To Clients: it's a Server (accepts connections, receives commands)
 *   - To Workers: it's a Client (forwards commands, receives results)
 *
 * Four responsibilities:
 *   1. Registry — knows which Workers are online
 *   2. Router — finds the right Worker for a sandboxId
 *   3. Discovery — Workers register themselves, Clients discover Workers
 *   4. Proxy — transparently forwards Sandbox API calls
 *
 * Usage:
 *   createSandbox(node()).broker({ port: 8080 })
 */

export interface BrokerConfig {
  /** Port to listen on */
  port: number;
  /** Hostname to bind (default: "0.0.0.0") */
  hostname?: string;
}

export interface WorkerInfo {
  sandboxId: string;
  connectedAt: number;
}

export interface Broker {
  /** Stop the broker */
  stop(): Promise<void>;
  /** Whether the broker is running */
  readonly running: boolean;
  /** List connected workers */
  workers(): WorkerInfo[];
}
