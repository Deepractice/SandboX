/**
 * StateStorage - Key-value storage state implementation
 * In-memory storage (can be swapped for Redis/File backend later)
 */

import type { Storage } from "./types.js";

export class StateStorage implements Storage {
  private data: Map<string, string>;

  constructor(initial?: Record<string, string>) {
    this.data = new Map(Object.entries(initial ?? {}));
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  keys(): string[] {
    return [...this.data.keys()];
  }
}
