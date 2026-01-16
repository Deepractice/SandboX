/**
 * StateStore - Persistence for StateLog and Blobs
 */

import { createResourceX, deepracticeHandler, type ResourceX } from "resourcexjs";

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

  async saveLog(key: string, data: string): Promise<void> {
    this.logs.set(key, data);
  }

  async loadLog(key: string): Promise<string | null> {
    return this.logs.get(key) ?? null;
  }

  async deleteLog(key: string): Promise<void> {
    this.logs.delete(key);
  }

  async listLogs(): Promise<string[]> {
    return [...this.logs.keys()];
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
}

/**
 * ResourceX implementation for production
 * Uses deepractice:// transport → ~/.deepractice/sandbox/
 */
class ResourceXStateStore implements StateStore {
  private rx: ResourceX;

  constructor() {
    this.rx = createResourceX({
      transports: [deepracticeHandler()],
    });
  }

  private logUrl(key: string): string {
    return `@text:deepractice://sandbox/state-logs/${key}.json`;
  }

  private blobUrl(ref: string): string {
    return `@binary:deepractice://sandbox/blobs/${ref}`;
  }

  async saveLog(key: string, data: string): Promise<void> {
    await this.rx.deposit(this.logUrl(key), data);
  }

  async loadLog(key: string): Promise<string | null> {
    try {
      const exists = await this.rx.exists(this.logUrl(key));
      if (!exists) return null;
      const resource = await this.rx.resolve(this.logUrl(key));
      return resource.content as string;
    } catch {
      return null;
    }
  }

  async deleteLog(key: string): Promise<void> {
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
