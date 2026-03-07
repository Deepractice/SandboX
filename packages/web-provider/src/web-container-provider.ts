import type {
  SandboxBootstrap,
  SandboxExecutor,
  SandboxFileSystem,
  SandboxProcessManager,
  SandboxProvider,
} from "@sandboxxjs/core";
import { WebContainerBootstrap } from "./web-container-bootstrap";
import { WebContainerExecutor } from "./web-container-executor";
import { WebContainerFileSystem } from "./web-container-filesystem";
import { WebContainerProcessManager } from "./web-container-process-manager";

export class WebContainerProvider implements SandboxProvider {
  private bootstrap = new WebContainerBootstrap();

  createBootstrap(): SandboxBootstrap {
    return this.bootstrap;
  }

  createExecutor(): SandboxExecutor {
    return new WebContainerExecutor(this.bootstrap.getContainer());
  }

  createFileSystem(): SandboxFileSystem {
    return new WebContainerFileSystem(this.bootstrap.getContainer());
  }

  createProcessManager(): SandboxProcessManager {
    return new WebContainerProcessManager(this.bootstrap.getContainer());
  }
}
