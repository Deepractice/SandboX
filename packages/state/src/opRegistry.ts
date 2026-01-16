/**
 * Operation Registry - Single source of truth for all state operations
 *
 * This registry drives both replay and recording:
 * - replay: uses `replay` function to execute op on target
 * - record: uses `args` to map method parameters to StateLogEntry args
 */

import type { WithState } from "./types.js";

export interface OpConfig {
  /** Namespace: 'fs' | 'env' | 'storage' */
  namespace: "fs" | "env" | "storage";
  /** Actual method name on the interface */
  method: string;
  /** Parameter names for args mapping */
  args: string[];
  /** Replay function */
  replay: (target: WithState, args: Record<string, unknown>) => void | Promise<void>;
}

/**
 * All registered operations
 */
export const opRegistry: Record<string, OpConfig> = {
  // File system operations
  "fs.write": {
    namespace: "fs",
    method: "write",
    args: ["path", "data"],
    replay: async (target, args) => {
      await target.fs.write(args.path as string, args.data as string);
    },
  },
  "fs.delete": {
    namespace: "fs",
    method: "delete",
    args: ["path"],
    replay: async (target, args) => {
      await target.fs.delete(args.path as string);
    },
  },

  // Environment operations
  "env.set": {
    namespace: "env",
    method: "set",
    args: ["key", "value"],
    replay: (target, args) => {
      target.env.set(args.key as string, args.value as string);
    },
  },
  "env.delete": {
    namespace: "env",
    method: "delete",
    args: ["key"],
    replay: (target, args) => {
      target.env.delete(args.key as string);
    },
  },

  // Storage operations
  "storage.set": {
    namespace: "storage",
    method: "setItem",
    args: ["key", "value"],
    replay: (target, args) => {
      target.storage.setItem(args.key as string, args.value as string);
    },
  },
  "storage.delete": {
    namespace: "storage",
    method: "removeItem",
    args: ["key"],
    replay: (target, args) => {
      target.storage.removeItem(args.key as string);
    },
  },
  "storage.clear": {
    namespace: "storage",
    method: "clear",
    args: [],
    replay: (target) => {
      target.storage.clear();
    },
  },
};

/**
 * Find op by namespace and method name
 */
export function findOp(namespace: string, method: string): string | undefined {
  for (const [op, config] of Object.entries(opRegistry)) {
    if (config.namespace === namespace && config.method === method) {
      return op;
    }
  }
  return undefined;
}

/**
 * Convert method arguments to StateLogEntry args
 */
export function argsToEntry(op: string, methodArgs: unknown[]): Record<string, unknown> {
  const config = opRegistry[op];
  if (!config) return {};

  const entry: Record<string, unknown> = {};
  config.args.forEach((name, index) => {
    entry[name] = methodArgs[index];
  });
  return entry;
}

/**
 * Get all ops for a namespace
 */
export function getOpsForNamespace(namespace: string): string[] {
  return Object.entries(opRegistry)
    .filter(([_, config]) => config.namespace === namespace)
    .map(([op]) => op);
}
