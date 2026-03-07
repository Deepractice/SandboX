import type {
  SandboxExecutor,
  SandboxFileSystem,
  SandboxProcessManager,
  SandboxProvider,
} from "@sandboxxjs/core";
import type { WebContainer } from "./types";
import { WebContainerExecutor } from "./web-container-executor";
import { WebContainerFileSystem } from "./web-container-filesystem";
import { WebContainerProcessManager } from "./web-container-process-manager";

export class WebContainerProvider implements SandboxProvider {
  constructor(private wc: WebContainer) {}

  createExecutor(): SandboxExecutor {
    return new WebContainerExecutor(this.wc);
  }

  createFileSystem(): SandboxFileSystem {
    return new WebContainerFileSystem(this.wc);
  }

  createProcessManager(): SandboxProcessManager {
    return new WebContainerProcessManager(this.wc);
  }
}
