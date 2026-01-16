/**
 * State mixin - adds state capabilities (fs, env, storage)
 */

import type { Sandbox, SandboxConfig, SandboxConstructor } from "../types.js";
import {
  createState,
  replayStateLog,
  type FileSystem,
  type Environment,
  type Storage,
  type WithState,
  type StateLog,
} from "@sandboxxjs/state";

/**
 * Add state capabilities to sandbox
 */
export function withState<T extends Sandbox>(
  Base: SandboxConstructor<T>
): SandboxConstructor<T & WithState> {
  return class extends (Base as any) {
    fs: FileSystem;
    env: Environment;
    storage: Storage;
    private stateLog?: StateLog;

    constructor(config: SandboxConfig) {
      super(config);

      const stateConfig = config.state;

      // Create state instances (with optional recording)
      const state = createState({
        sandbox: this,
        env: stateConfig?.env,
        enableRecord: stateConfig?.enableRecord,
      });

      this.fs = state.fs;
      this.env = state.env;
      this.storage = state.storage;
      this.stateLog = state.stateLog;

      // Replay initializeLog if provided
      if (stateConfig?.initializeLog) {
        replayStateLog(stateConfig.initializeLog, this);
      }
    }

    /**
     * Get recorded StateLog (if recording enabled)
     */
    getStateLog(): StateLog | undefined {
      return this.stateLog;
    }
  } as SandboxConstructor<T & WithState>;
}
