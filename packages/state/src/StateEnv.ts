/**
 * StateEnv - Environment variables state implementation
 * In-memory storage with controlled access
 */

import type { Environment } from "./types.js";

export class StateEnv implements Environment {
  private vars: Map<string, string>;

  constructor(initial?: Record<string, string>) {
    this.vars = new Map(Object.entries(initial ?? {}));
  }

  get(key: string): string | undefined {
    return this.vars.get(key);
  }

  set(key: string, value: string): void {
    this.vars.set(key, value);
  }

  has(key: string): boolean {
    return this.vars.has(key);
  }

  delete(key: string): void {
    this.vars.delete(key);
  }

  keys(): string[] {
    return [...this.vars.keys()];
  }

  all(): Record<string, string> {
    return Object.fromEntries(this.vars);
  }
}
