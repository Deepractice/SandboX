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
  // Mixins
  withFS,
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
  type ResourceLimits,
  type NodeConfig,
  type PythonConfig,
  type WithFS,
  type WithExecute,
  type NodeSandbox,
  type PythonSandbox,
  type FSSandbox,
  // Errors
  SandboxError,
  ExecutionError,
  TimeoutError,
  IsolationError,
  FileSystemError,
} from "@sandboxxjs/core";
