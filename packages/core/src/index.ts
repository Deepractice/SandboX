/**
 * @sandboxxjs/core — Sandbox abstraction framework.
 *
 * Unified lifecycle for any sandbox environment:
 *
 *   Allocate → Prepare → Register → Ready → Command
 *
 *   1. Allocator provisions resources, returns SandboxContainer (status: pending)
 *   2. Sandbox environment starts, sandbox-client prepares
 *   3. sandbox-client connects to Registry via WebSocket, registers
 *   4. Registry marks sandbox as ready
 *   5. Router dispatches commands through Registry to sandbox-client
 *
 * Platform differences are injected via SandboxProvider:
 *   - @sandboxxjs/node-provider: child_process + node:fs
 *   - @sandboxxjs/web-provider: @webcontainer/api
 *   - Future: Docker, SSH, WASM, etc.
 */

// Allocator — Step 1: Allocate
export type {
  AllocateRequest,
  SandboxAllocator,
  SandboxContainer,
  SandboxContainerType,
  SandboxStatus,
} from "./allocator";

// Client — Step 2-3: Prepare + Register
export type { SandboxClient, SandboxClientOptions } from "./client";
export { createSandboxClient } from "./create-client";
// Provider — Platform capability injection
export type {
  SandboxExecutor,
  SandboxFileSystem,
  SandboxProcessManager,
  SandboxProvider,
} from "./provider";
// Registry — Step 3-4: Register + Ready
export type { SandboxConnection, SandboxRegistry } from "./registry";
// Router — Step 5: Command (RPC dispatch)
export type { SandboxRouter } from "./router";

// Sandbox — Step 5: Command (consumer-facing)
export type { ExecOptions, ExecResult, FileInfo, ProcessInfo, Sandbox } from "./sandbox";
