/**
 * State mixin - adds state capabilities (fs, env, storage)
 */

import type {
  Sandbox,
  SandboxConfig,
  SandboxConstructor,
  WithState,
  FileSystem,
  Environment,
  Storage,
} from "../types.js";
import { StateFS } from "../state/StateFS.js";
import { StateEnv } from "../state/StateEnv.js";
import { StateStorage } from "../state/StateStorage.js";

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
