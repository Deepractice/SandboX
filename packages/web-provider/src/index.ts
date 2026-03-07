/**
 * @sandboxxjs/web-provider — WebContainer provider for sandboxxjs.
 *
 * Implements SandboxProvider using @webcontainer/api.
 * Runs inside the browser. Bootstrap handles WebContainer.boot().
 *
 * Usage:
 *   import { WebContainerProvider } from "@sandboxxjs/web-provider";
 *   import { createSandboxClient } from "@sandboxxjs/core";
 *
 *   const client = createSandboxClient(new WebContainerProvider());
 *   await client.connect({ wsUrl, sandboxId, token });
 */

export { WebContainerBootstrap } from "./web-container-bootstrap";
export { WebContainerExecutor } from "./web-container-executor";
export { WebContainerFileSystem } from "./web-container-filesystem";
export { WebContainerProcessManager } from "./web-container-process-manager";
export { WebContainerProvider } from "./web-container-provider";
