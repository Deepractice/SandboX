/**
 * StateStore - Persistence for StateLog and Blobs
 */

import { createResourceX, deepracticeHandler, type ResourceX } from "resourcexjs";
import type { StateLogEntry } from "./types.js";

export interface StateStore {
  // Log operations
  saveLog(key: string, data: string): Promise<void>;
  loadLog(key: string): Promise<string | null>;
  deleteLog(key: string): Promise<void>;
  listLogs(): Promise<string[]>;

  // Blob operations
  saveBlob(ref: string, data: Buffer): Promise<void>;
  loadBlob(ref: string): Promise<Buffer | null>;
  deleteBlob(ref: string): Promise<void>;

  // AOF operations
  appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void>;
}

export interface StateStoreOptions {
  type: "memory" | "resourcex";
}

/**
 * Memory implementation for testing
 */
class MemoryStateStore implements StateStore {
  private logs = new Map<string, string>();
  private blobs = new Map<string, Buffer>();
  private entries = new Map<string, StateLogEntry[]>();

  async saveLog(key: string, data: string): Promise<void> {
    this.logs.set(key, data);
  }

  async loadLog(key: string): Promise<string | null> {
    // Check if we have entries (JSON Lines)
    const entries = this.entries.get(key);
    if (entries && entries.length > 0) {
      return JSON.stringify(entries);
    }
    // Fallback to logs (JSON array)
    return this.logs.get(key) ?? null;
  }

  async deleteLog(key: string): Promise<void> {
    this.logs.delete(key);
    this.entries.delete(key);
  }

  async listLogs(): Promise<string[]> {
    const keys = new Set([...this.logs.keys(), ...this.entries.keys()]);
    return [...keys];
  }

  async saveBlob(ref: string, data: Buffer): Promise<void> {
    this.blobs.set(ref, data);
  }

  async loadBlob(ref: string): Promise<Buffer | null> {
    return this.blobs.get(ref) ?? null;
  }

  async deleteBlob(ref: string): Promise<void> {
    this.blobs.delete(ref);
  }

  async appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void> {
    const entries = this.entries.get(sandboxId) ?? [];
    entries.push(entry);
    this.entries.set(sandboxId, entries);
  }
}

/**
 * ResourceX implementation for production
 * Uses deepractice:// transport → ~/.deepractice/sandbox/
 */
class ResourceXStateStore implements StateStore {
  private rx: ResourceX;
  private basePath: string;

  constructor() {
    this.rx = createResourceX({
      transports: [deepracticeHandler()],
    });
    // Get base path from home directory
    const os = require("os");
    const path = require("path");
    this.basePath = path.join(os.homedir(), ".deepractice/sandbox");
  }

  private logUrl(key: string): string {
    return `@text:deepractice://sandbox/state-logs/${key}.json`;
  }

  private logPath(sandboxId: string): string {
    const path = require("path");
    return path.join(this.basePath, "state-logs", `${sandboxId}.jsonl`);
  }

  private blobUrl(ref: string): string {
    return `@binary:deepractice://sandbox/blobs/${ref}`;
  }

  async saveLog(key: string, data: string): Promise<void> {
    await this.rx.deposit(this.logUrl(key), data);
  }

  async loadLog(key: string): Promise<string | null> {
    const fs = require("fs/promises");

    // Try loading from JSON Lines file first
    const jsonlPath = this.logPath(key);
    try {
      const content = await fs.readFile(jsonlPath, "utf-8");
      // JSON Lines → JSON Array
      const entries = content
        .trim()
        .split("\n")
        .filter((line: string) => line)
        .map((line: string) => JSON.parse(line));
      return JSON.stringify(entries);
    } catch {
      // Fallback to ResourceX (old JSON format)
      try {
        const exists = await this.rx.exists(this.logUrl(key));
        if (!exists) return null;
        const resource = await this.rx.resolve(this.logUrl(key));
        return resource.content as string;
      } catch {
        return null;
      }
    }
  }

  async deleteLog(key: string): Promise<void> {
    const fs = require("fs/promises");

    // Delete JSON Lines file
    try {
      await fs.unlink(this.logPath(key));
    } catch {
      // Ignore
    }

    // Delete old JSON file
    try {
      const exists = await this.rx.exists(this.logUrl(key));
      if (exists) {
        await this.rx.delete(this.logUrl(key));
      }
    } catch {
      // Ignore errors
    }
  }

  async listLogs(): Promise<string[]> {
    // TODO: Implement when ResourceX supports list
    return [];
  }

  async appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void> {
    const fs = require("fs/promises");
    const path = require("path");

    const filePath = this.logPath(sandboxId);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Append one line of JSON (true AOF)
    const line = JSON.stringify(entry) + "\n";
    await fs.appendFile(filePath, line, "utf-8");
  }

  async saveBlob(ref: string, data: Buffer): Promise<void> {
    await this.rx.deposit(this.blobUrl(ref), data);
  }

  async loadBlob(ref: string): Promise<Buffer | null> {
    try {
      const exists = await this.rx.exists(this.blobUrl(ref));
      if (!exists) return null;
      const resource = await this.rx.resolve(this.blobUrl(ref));
      return resource.content as Buffer;
    } catch {
      return null;
    }
  }

  async deleteBlob(ref: string): Promise<void> {
    try {
      const exists = await this.rx.exists(this.blobUrl(ref));
      if (exists) {
        await this.rx.delete(this.blobUrl(ref));
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Create a StateStore instance
 */
export function createStateStore(options: StateStoreOptions): StateStore {
  if (options.type === "memory") {
    return new MemoryStateStore();
  }

  if (options.type === "resourcex") {
    return new ResourceXStateStore();
  }

  throw new Error(`StateStore type "${options.type}" not implemented`);
}
