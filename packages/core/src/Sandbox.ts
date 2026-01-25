/**
 * Base Sandbox class - delegates to Isolator for execution
 */

import { nanoid } from "nanoid";
import type {
  SandboxConfig,
  Sandbox as ISandbox,
  ShellResult,
  ExecuteResult,
  EvaluateResult,
} from "./types.js";
import { Isolator } from "./isolators/Isolator.js";
import { NoopIsolator } from "./isolators/NoopIsolator.js";
import { SrtIsolator } from "./isolators/SrtIsolator.js";
import { CloudflareContainerIsolator } from "./isolators/CloudflareContainerIsolator.js";
import { SandboxError } from "./errors.js";

export class BaseSandbox implements ISandbox {
  public readonly id: string;
  protected isolator: Isolator;
  protected config: SandboxConfig;

  constructor(config: SandboxConfig) {
    this.id = `sandbox-${nanoid()}`;
    this.config = config;
    this.isolator = this.createIsolator(config);
  }

  private createIsolator(config: SandboxConfig): Isolator {
    const { isolator: isolatorType, runtime } = config;

    switch (isolatorType) {
      case "noop":
        return new NoopIsolator(runtime);
      case "srt":
        return new SrtIsolator(runtime);
      case "cloudflare":
        return new CloudflareContainerIsolator(runtime);
      case "e2b":
        throw new SandboxError(`Isolator "e2b" not yet implemented`);
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
   * Execute code (script mode)
   */
  async execute(code: string): Promise<ExecuteResult> {
    return this.isolator.execute(code, {
      timeout: this.config.limits?.timeout,
    });
  }

  /**
   * Evaluate expression (REPL mode)
   */
  async evaluate(expr: string): Promise<EvaluateResult> {
    return this.isolator.evaluate(expr, {
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
