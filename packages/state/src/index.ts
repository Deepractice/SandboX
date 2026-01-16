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
export { replayStateLog } from "./replayStateLog.js";
export { createState, type CreateStateOptions, type StateResult } from "./createState.js";

// Persistence
export { createStateStore, type StateStore, type StateStoreOptions } from "./StateStore.js";
export { createStateAssets, type StateAssets, type AssetsSandbox } from "./StateAssets.js";

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
