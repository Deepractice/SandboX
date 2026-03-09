/**
 * Platform — dependency injection for platform-specific implementations.
 *
 * Each platform provides factory methods for the three roles.
 * Core defines what, Platform defines how.
 *
 * Implementations:
 *   - @sandboxxjs/node-platform: Node.js (spawn + fs + ws)
 *   - @deepractice/sandbox-cloudflare: Cloudflare Workers (DO + Container)
 */

import type { Broker, BrokerConfig } from "./broker";
import type { Client, ClientConfig } from "./client";
import type { Sandbox } from "./sandbox";
import type { RunConfig, ServeConfig, Worker } from "./worker";

export interface Platform {
  /** Create a local Sandbox (no network, direct execution) */
  createLocal(): Sandbox;

  /** Create a Client that connects to a remote Worker or Broker */
  createClient(config: ClientConfig): Promise<Client>;

  /** Create a Worker that serves or runs */
  createWorker(): WorkerBuilder;

  /** Create a Broker */
  createBroker(config: BrokerConfig): Promise<Broker>;
}

export interface WorkerBuilder {
  /** Start as a server, listen for direct connections */
  serve(config: ServeConfig): Promise<Worker>;
  /** Connect to a Broker and register */
  run(config: RunConfig): Promise<Worker>;
}
