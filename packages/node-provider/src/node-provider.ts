import type {
  SandboxExecutor,
  SandboxFileSystem,
  SandboxProcessManager,
  SandboxProvider,
} from "@sandboxxjs/core";
import { NodeExecutor } from "./node-executor";
import { NodeFileSystem } from "./node-filesystem";
import { NodeProcessManager } from "./node-process-manager";

export interface NodeProviderOptions {
  /** Default working directory for exec and process operations (default: "/workspace") */
  cwd?: string;
}

export class NodeProvider implements SandboxProvider {
  private options: NodeProviderOptions;

  constructor(options?: NodeProviderOptions) {
    this.options = options ?? {};
  }

  createExecutor(): SandboxExecutor {
    return new NodeExecutor({ cwd: this.options.cwd });
  }

  createFileSystem(): SandboxFileSystem {
    return new NodeFileSystem();
  }

  createProcessManager(): SandboxProcessManager {
    return new NodeProcessManager({ cwd: this.options.cwd });
  }
}
