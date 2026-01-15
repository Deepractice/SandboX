/**
 * Main Sandbox class
 */

import type {
  SandboxConfig,
  ExecuteOptions,
  ExecuteResult,
  FileSystem,
  EventHandler,
} from "./types.js";
import { Isolator } from "./isolators/Isolator.js";
import { LocalIsolator } from "./isolators/LocalIsolator.js";
import { CloudflareContainerIsolator } from "./isolators/CloudflareContainerIsolator.js";
import { Runtime } from "./runtimes/Runtime.js";
import { GenericRuntime } from "./runtimes/GenericRuntime.js";
import { SandboxError } from "./errors.js";

export class Sandbox {
  private isolator: Isolator;
  private runtime: Runtime;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  public fs: FileSystem;

  constructor(config: SandboxConfig) {
    // Initialize isolator
    this.isolator = this.createIsolator(config.isolator, config.runtime);
    this.fs = this.isolator.getFileSystem();

    // Initialize runtime
    this.runtime = this.createRuntime(config.runtime, this.isolator);
  }

  private createIsolator(
    isolatorType: SandboxConfig["isolator"],
    runtime: SandboxConfig["runtime"]
  ): Isolator {
    switch (isolatorType) {
      case "local":
        return new LocalIsolator(runtime);
      case "cloudflare":
        return new CloudflareContainerIsolator(runtime);
      case "e2b":
      case "firecracker":
      case "docker":
        throw new SandboxError(`Isolator "${isolatorType}" not yet implemented`);
      default:
        throw new SandboxError(`Unknown isolator type: ${isolatorType}`);
    }
  }

  private createRuntime(_runtimeType: SandboxConfig["runtime"], isolator: Isolator): Runtime {
    // Use GenericRuntime for all runtimes - isolator handles the specifics
    return new GenericRuntime(isolator);
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    this.emit("execute:start", options);

    try {
      const result = await this.runtime.execute(options);
      this.emit("execute:success", result);
      return result;
    } catch (error) {
      this.emit("execute:error", error);
      throw error;
    } finally {
      this.emit("execute:complete");
    }
  }

  async writeFile(filePath: string, data: string): Promise<void> {
    return this.fs.write(filePath, data);
  }

  async readFile(filePath: string): Promise<string> {
    return this.fs.read(filePath);
  }

  async destroy(): Promise<void> {
    await this.runtime.cleanup();
    await this.isolator.destroy();
    this.eventHandlers.clear();
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }
}
