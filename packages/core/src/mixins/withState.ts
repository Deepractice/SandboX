/**
 * State mixin - adds state capabilities (fs, env, storage)
 */

import type { Sandbox, SandboxConfig, SandboxConstructor } from "../types.js";
import {
  StateFS,
  StateEnv,
  StateStorage,
  type FileSystem,
  type Environment,
  type Storage,
  type WithState,
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

    constructor(config: SandboxConfig) {
      super(config);

      this.fs = new StateFS(this);
      this.env = new StateEnv(config.env);
      this.storage = new StateStorage();
    }
  } as SandboxConstructor<T & WithState>;
}
