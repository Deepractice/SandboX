/**
 * @sandboxxjs/core — interfaces and protocol for the SandboX framework.
 *
 * Three roles:
 *   Client — issues commands (connect)
 *   Broker — intermediary (registry + router + discovery + proxy)
 *   Worker — executes commands (serve or run)
 *
 * All roles share the Sandbox interface and JSON-RPC 2.0 protocol.
 * Platform implementations provide the concrete behavior.
 */

// Broker — intermediary between Client and Worker
export type { Broker, BrokerConfig, WorkerInfo } from "./broker";

// Client — command issuer
export type { Client, ClientConfig } from "./client";
// Sandbox — the shared operation interface
export type { ExecOptions, ExecResult, FileInfo, ProcessInfo, Sandbox } from "./sandbox";
// Worker — command executor
export type { RunConfig, ServeConfig, Worker } from "./worker";

// Platform SPI — re-exported from @sandboxxjs/core/platform
// Platform implementors should import from "@sandboxxjs/core/platform"
