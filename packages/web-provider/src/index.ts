/**
 * WebContainer provider for sandboxxjs.
 *
 * Implements SandboxProvider using @webcontainer/api.
 * Runs inside the browser.
 *
 * Usage:
 *   import { WebContainerProvider } from "@sandboxxjs/web-provider";
 *   import { createSandboxClient } from "@sandboxxjs/core";
 *   import { WebContainer } from "@webcontainer/api";
 *
 *   const wc = await WebContainer.boot({ coep: "credentialless" });
 *   const client = createSandboxClient(new WebContainerProvider(wc));
 */

export type { WebContainer, WebContainerFS, WebContainerProcess } from "./types";
export { WebContainerExecutor } from "./web-container-executor";
export { WebContainerFileSystem } from "./web-container-filesystem";
export { WebContainerProcessManager } from "./web-container-process-manager";
export { WebContainerProvider } from "./web-container-provider";
