/**
 * @sandboxxjs/core
 * Core functionality for secure code execution
 */

// Base Sandbox
export { BaseSandbox } from "./Sandbox.js";

// Isolators
export { Isolator } from "./isolators/Isolator.js";
export { NoneIsolator } from "./isolators/NoneIsolator.js";
export { SrtIsolator } from "./isolators/SrtIsolator.js";
export { CloudflareContainerIsolator } from "./isolators/CloudflareContainerIsolator.js";
export { ForgeIsolator } from "./isolators/ForgeIsolator.js";

// Re-export from @sandboxxjs/state
export {
  StateFS,
  StateEnv,
  StateStorage,
  buildStateLog,
  loadStateLog,
  type StateLog,
  type StateLogEntry,
  type FileSystem,
  type Environment,
  type Storage,
  type WithState,
  StateError,
  FileSystemError,
} from "@sandboxxjs/state";

// Mixins
export { withState } from "./mixins/withState.js";

// Types
export * from "./types.js";

// Errors
export * from "./errors.js";
