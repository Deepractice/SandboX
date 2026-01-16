/**
 * Create state instances with optional recording
 */

import type { FileSystem, Environment, Storage, StateLog, Sandbox } from "./types.js";
import { StateFS } from "./StateFS.js";
import { StateEnv } from "./StateEnv.js";
import { StateStorage } from "./StateStorage.js";
import { buildStateLog } from "./StateLog.js";
import { findOp, argsToEntry } from "./opRegistry.js";

type StateNamespace = "fs" | "env" | "storage";

export interface CreateStateOptions {
  /** Sandbox instance for fs operations */
  sandbox: Sandbox;
  /** Initial environment variables */
  env?: Record<string, string>;
  /** Enable recording to StateLog */
  enableRecord?: boolean;
}

export interface StateResult {
  fs: FileSystem;
  env: Environment;
  storage: Storage;
  stateLog?: StateLog;
}

/**
 * Create a recording proxy for a state interface
 */
function createRecordingProxy<T extends object>(
  target: T,
  namespace: StateNamespace,
  log: StateLog
): T {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop as keyof T];

      if (typeof value !== "function") {
        return value;
      }

      const method = prop as string;
      const op = findOp(namespace, method);

      // No op registered = read-only method, don't record
      if (!op) {
        return value.bind(obj);
      }

      // Return wrapped function that records
      return (...args: unknown[]) => {
        const result = (value as Function).apply(obj, args);

        const record = () => {
          const entryArgs = argsToEntry(op, args);
          (log as any).recordEntry(op, entryArgs);
        };

        if (result instanceof Promise) {
          return result.then((res) => {
            record();
            return res;
          });
        } else {
          record();
          return result;
        }
      };
    },
  });
}

/**
 * Create state instances
 */
export function createState(options: CreateStateOptions): StateResult {
  const { sandbox, env, enableRecord } = options;

  // Create base instances
  const baseFS = new StateFS(sandbox);
  const baseEnv = new StateEnv(env);
  const baseStorage = new StateStorage();

  // No recording, return base instances
  if (!enableRecord) {
    return {
      fs: baseFS,
      env: baseEnv,
      storage: baseStorage,
    };
  }

  // Recording enabled, wrap with Proxy
  const stateLog = buildStateLog();

  return {
    fs: createRecordingProxy(baseFS, "fs", stateLog),
    env: createRecordingProxy(baseEnv, "env", stateLog),
    storage: createRecordingProxy(baseStorage, "storage", stateLog),
    stateLog,
  };
}
