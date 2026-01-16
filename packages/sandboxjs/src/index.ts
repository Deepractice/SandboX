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
  // State implementations
  StateFS,
  StateEnv,
  StateStorage,
  StateLog,
  type StateLogEntry,
  // Mixins
  withState,
  withNodeExecute,
  withPythonExecute,
  // Types
  type Sandbox,
  type SandboxConfig,
  type Runtime,
  type IsolatorType,
  type ShellResult,
  type ExecuteResult,
  type FileSystem,
  type Environment,
  type Storage,
  type ResourceLimits,
  type NodeConfig,
  type PythonConfig,
  type WithState,
  type WithExecute,
  type NodeSandbox,
  type PythonSandbox,
  type StateSandbox,
  // Errors
  SandboxError,
  ExecutionError,
  TimeoutError,
  IsolationError,
  FileSystemError,
  StateError,
} from "@sandboxxjs/core";
