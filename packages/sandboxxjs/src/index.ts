/**
 * sandboxjs
 * Secure code execution sandbox for AI agents
 */

export { createSandbox } from "./createSandbox.js";
export { SandboxManager } from "./SandboxManager.js";

// Re-export core types and classes
export {
  // Classes
  BaseSandbox,
  // Isolators
  NoopIsolator,
  SrtIsolator,
  CloudflareContainerIsolator,
  // State implementations
  StateFS,
  StateEnv,
  StateStorage,
  buildStateLog,
  loadStateLog,
  type StateLog,
  type StateLogEntry,
  // Mixins
  withState,
  // Types
  type Sandbox,
  type SandboxConfig,
  type StateConfig,
  type RuntimeType,
  type IsolatorType,
  type ShellResult,
  type ExecuteResult,
  type EvaluateResult,
  type FileSystem,
  type Environment,
  type Storage,
  type ResourceLimits,
  type NodeConfig,
  type PythonConfig,
  type WithState,
  type StateSandbox,
  // Errors
  SandboxError,
  ExecutionError,
  TimeoutError,
  IsolationError,
  FileSystemError,
  StateError,
} from "@sandboxxjs/core";
