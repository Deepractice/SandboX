/**
 * @sandboxxjs/state
 * State management layer with StateLog
 */

// State implementations
export { StateFS } from "./StateFS.js";
export { StateEnv } from "./StateEnv.js";
export { StateStorage } from "./StateStorage.js";

// StateLog (functional API)
export { buildStateLog, loadStateLog } from "./StateLog.js";

// Types
export type {
  Sandbox,
  ShellResult,
  FileSystem,
  Environment,
  Storage,
  WithState,
  StateLog,
  StateLogEntry,
} from "./types.js";

// Errors
export { StateError, FileSystemError } from "./errors.js";
