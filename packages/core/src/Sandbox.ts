/**
 * Base Sandbox class - 4 core APIs (shell, upload, download, destroy)
 */

import type { SandboxConfig, Sandbox as ISandbox, ShellResult } from "./types.js";
import { Isolator } from "./isolators/Isolator.js";
import { LocalIsolator } from "./isolators/LocalIsolator.js";
import { CloudflareContainerIsolator } from "./isolators/CloudflareContainerIsolator.js";
import { SandboxError } from "./errors.js";

export class BaseSandbox implements ISandbox {
  protected isolator: Isolator;
  protected config: SandboxConfig;

  constructor(config: SandboxConfig) {
    this.config = config;
    this.isolator = this.createIsolator(config.isolator);
  }

  private createIsolator(isolatorType: SandboxConfig["isolator"]): Isolator {
    switch (isolatorType) {
      case "local":
        return new LocalIsolator();
      case "cloudflare":
        return new CloudflareContainerIsolator();
      case "e2b":
      case "docker":
        throw new SandboxError(`Isolator "${isolatorType}" not yet implemented`);
      default:
        throw new SandboxError(`Unknown isolator type: ${isolatorType}`);
    }
  }

  /**
   * Execute shell command
   */
  async shell(command: string): Promise<ShellResult> {
    return this.isolator.shell(command, {
      timeout: this.config.limits?.timeout,
    });
  }

  /**
   * Upload file to sandbox
   */
  async upload(data: Buffer, remotePath: string): Promise<void> {
    return this.isolator.upload(data, remotePath);
  }

  /**
   * Download file from sandbox
   */
  async download(remotePath: string): Promise<Buffer> {
    return this.isolator.download(remotePath);
  }

  /**
   * Destroy sandbox and cleanup resources
   */
  async destroy(): Promise<void> {
    return this.isolator.destroy();
  }
}
