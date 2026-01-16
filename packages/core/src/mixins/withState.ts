/**
 * State mixin - adds state capabilities (fs, env, storage)
 */

import type { Sandbox, SandboxConfig, SandboxConstructor } from "../types.js";
import {
  StateFS,
  StateEnv,
  StateStorage,
  buildStateLog,
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
    private recordingEnabled: boolean;

    constructor(config: SandboxConfig) {
      super(config);

      const stateConfig = config.state;
      this.recordingEnabled = stateConfig?.enableRecord ?? false;

      // Create base state instances
      const baseFS = new StateFS(this);
      const baseEnv = new StateEnv(stateConfig?.env);
      const baseStorage = new StateStorage();

      // If recording enabled, wrap with recording logic
      if (this.recordingEnabled) {
        this.stateLog = buildStateLog();
        this.fs = this.wrapFS(baseFS);
        this.env = this.wrapEnv(baseEnv);
        this.storage = this.wrapStorage(baseStorage);
      } else {
        this.fs = baseFS;
        this.env = baseEnv;
        this.storage = baseStorage;
      }

      // Replay initializeLog if provided
      if (stateConfig?.initializeLog) {
        this.replayStateLog(stateConfig.initializeLog);
      }
    }

    /**
     * Replay StateLog entries
     */
    private async replayStateLog(log: StateLog): Promise<void> {
      for (const entry of log.getEntries()) {
        const { op, args } = entry;

        if (op === "fs.write") {
          await this.fs.write(args.path as string, args.data as string);
        } else if (op === "fs.delete") {
          await this.fs.delete(args.path as string);
        } else if (op === "env.set") {
          this.env.set(args.key as string, args.value as string);
        } else if (op === "env.delete") {
          this.env.delete(args.key as string);
        } else if (op === "storage.set") {
          this.storage.setItem(args.key as string, args.value as string);
        } else if (op === "storage.delete") {
          this.storage.removeItem(args.key as string);
        } else if (op === "storage.clear") {
          this.storage.clear();
        }
      }
    }

    /**
     * Wrap FileSystem to record operations
     */
    private wrapFS(base: FileSystem): FileSystem {
      return {
        read: async (path: string) => base.read(path),
        write: async (path: string, data: string) => {
          await base.write(path, data);
          this.stateLog!.fs.write(path, data);
        },
        list: async (path: string) => base.list(path),
        exists: async (path: string) => base.exists(path),
        delete: async (path: string) => {
          await base.delete(path);
          this.stateLog!.fs.delete(path);
        },
      };
    }

    /**
     * Wrap Environment to record operations
     */
    private wrapEnv(base: Environment): Environment {
      return {
        get: (key: string) => base.get(key),
        set: (key: string, value: string) => {
          base.set(key, value);
          this.stateLog!.env.set(key, value);
        },
        has: (key: string) => base.has(key),
        delete: (key: string) => {
          base.delete(key);
          this.stateLog!.env.delete(key);
        },
        keys: () => base.keys(),
        all: () => base.all(),
      };
    }

    /**
     * Wrap Storage to record operations
     */
    private wrapStorage(base: Storage): Storage {
      return {
        getItem: (key: string) => base.getItem(key),
        setItem: (key: string, value: string) => {
          base.setItem(key, value);
          this.stateLog!.storage.set(key, value);
        },
        removeItem: (key: string) => {
          base.removeItem(key);
          this.stateLog!.storage.delete(key);
        },
        clear: () => {
          base.clear();
          this.stateLog!.storage.clear();
        },
        keys: () => base.keys(),
      };
    }

    /**
     * Get recorded StateLog (if recording enabled)
     */
    getStateLog(): StateLog | undefined {
      return this.stateLog;
    }
  } as SandboxConstructor<T & WithState>;
}
