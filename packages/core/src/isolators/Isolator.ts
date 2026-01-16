/**
 * Abstract Isolator base class
 */

import type { ShellResult } from "../types.js";

export interface ShellOptions {
  timeout?: number;
  env?: Record<string, string>;
}

export abstract class Isolator {
  /**
   * Execute shell command in isolated environment
   */
  abstract shell(command: string, options?: ShellOptions): Promise<ShellResult>;

  /**
   * Upload file to isolated environment
   */
  abstract upload(data: Buffer, remotePath: string): Promise<void>;

  /**
   * Download file from isolated environment
   */
  abstract download(remotePath: string): Promise<Buffer>;

  /**
   * Destroy isolator and cleanup resources
   */
  abstract destroy(): Promise<void>;
}
