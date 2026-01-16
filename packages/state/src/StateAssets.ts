/**
 * StateAssets - Binary file upload/download with persistence
 */

import { createHash } from "crypto";
import type { StateStore } from "./StateStore.js";

export interface AssetsSandbox {
  upload(data: Buffer, remotePath: string): Promise<void>;
  download(remotePath: string): Promise<Buffer>;
}

export interface StateAssets {
  uploadBuffer(data: Buffer, remotePath: string): Promise<string>;
  downloadBuffer(remotePath: string, options?: { persist?: boolean }): Promise<Buffer | string>;
  list(): string[];
}

export interface CreateStateAssetsOptions {
  sandbox: AssetsSandbox;
  store: StateStore;
}

/**
 * Generate sha256 ref for data
 */
function generateRef(data: Buffer): string {
  const hash = createHash("sha256").update(data).digest("hex");
  return `sha256-${hash}`;
}

class StateAssetsImpl implements StateAssets {
  private sandbox: AssetsSandbox;
  private store: StateStore;
  private uploadedPaths: Set<string> = new Set();

  constructor(options: CreateStateAssetsOptions) {
    this.sandbox = options.sandbox;
    this.store = options.store;
  }

  async uploadBuffer(data: Buffer, remotePath: string): Promise<string> {
    // Generate ref
    const ref = generateRef(data);

    // Upload to sandbox
    await this.sandbox.upload(data, remotePath);

    // Store blob for persistence
    await this.store.saveBlob(ref, data);

    // Track uploaded path
    this.uploadedPaths.add(remotePath);

    return ref;
  }

  async downloadBuffer(
    remotePath: string,
    options?: { persist?: boolean }
  ): Promise<Buffer | string> {
    // Download from sandbox
    const data = await this.sandbox.download(remotePath);

    // Optionally persist
    if (options?.persist) {
      const ref = generateRef(data);
      await this.store.saveBlob(ref, data);
      return ref;
    }

    return data;
  }

  list(): string[] {
    return [...this.uploadedPaths];
  }
}

/**
 * Create StateAssets instance
 */
export function createStateAssets(options: CreateStateAssetsOptions): StateAssets {
  return new StateAssetsImpl(options);
}
