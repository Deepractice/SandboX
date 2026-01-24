/**
 * State mixin - adds state capabilities (fs, env, storage)
 */

import type { Sandbox, SandboxConfig, SandboxConstructor } from "../types.js";
import {
  createState,
  replayStateLogSync,
  replayStateLogFs,
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
    private initializeLog?: StateLog;
    private initialized = false;

    constructor(config: SandboxConfig) {
      super(config);

      const stateConfig = config.state;

      // Create state instances (with optional recording)
      const state = createState({
        sandbox: this as unknown as Sandbox,
        env: stateConfig?.env,
        enableRecord: stateConfig?.enableRecord,
        store: stateConfig?.store,
        sandboxId: (this as any).id,
      });

      this.fs = state.fs;
      this.env = state.env;
      this.storage = state.storage;
      this.stateLog = state.stateLog;

      // Save initializeLog for async init
      if (stateConfig?.initializeLog) {
        this.initializeLog = stateConfig.initializeLog;
        // Replay sync operations (env, storage) immediately
        replayStateLogSync(stateConfig.initializeLog, this as unknown as WithState);
      }
    }

    /**
     * Initialize async state operations (fs)
     * Call this after construction if initializeLog contains fs operations
     */
    async init(): Promise<void> {
      if (this.initialized) return;
      this.initialized = true;

      if (this.initializeLog) {
        await replayStateLogFs(this.initializeLog, this as unknown as WithState);
      }
    }

    /**
     * Get recorded StateLog (if recording enabled)
     */
    getStateLog(): StateLog | undefined {
      return this.stateLog;
    }
  } as unknown as SandboxConstructor<T & WithState>;
}
