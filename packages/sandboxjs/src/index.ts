/**
 * sandboxjs
 * Secure code execution sandbox for AI agents
 */

export { createSandbox } from "./createSandbox.js";
export { SandboxManager } from "./SandboxManager.js";

// Re-export core types and classes
export {
  Sandbox,
  type SandboxConfig,
  type Runtime,
  type Backend,
  type ExecuteOptions,
  type ExecuteResult,
  type FileSystem,
  type ResourceLimits,
  type IsolationConfig,
  SandboxError,
  ExecutionError,
  TimeoutError,
  IsolationError,
  FileSystemError,
} from "@sandboxjs/core";
