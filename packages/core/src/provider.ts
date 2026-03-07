/**
 * SandboxProvider — platform capability injection.
 *
 * Provider is a component factory that supplies platform-specific
 * implementations of Bootstrap, Executor, FileSystem, and ProcessManager.
 *
 * The core layer (createSandboxClient) only depends on this interface.
 * Platform differences are isolated in provider implementations:
 *   - node-provider: child_process + node:fs (bootstrap is no-op)
 *   - web-provider: @webcontainer/api (bootstrap boots WebContainer)
 *   - Future: Docker, SSH, etc.
 */

import type { ExecOptions, ExecResult, FileInfo, ProcessInfo } from "./sandbox";

/**
 * Bootstrap component — Step 2: Prepare.
 *
 * Initializes the sandbox environment before other components can work.
 * For cloud containers this is a no-op (container is already running).
 * For WebContainer this boots the runtime in the browser.
 */
export interface SandboxBootstrap {
  boot(): Promise<void>;
}

/**
 * Command execution component.
 */
export interface SandboxExecutor {
  exec(command: string, options?: ExecOptions): Promise<ExecResult>;
}

/**
 * File system component.
 */
export interface SandboxFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path: string): Promise<FileInfo[]>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  deleteFile(path: string): Promise<void>;
}

/**
 * Process management component.
 */
export interface SandboxProcessManager {
  start(command: string, options?: { cwd?: string }): Promise<ProcessInfo>;
  kill(processId: string): Promise<void>;
  list(): Promise<ProcessInfo[]>;
}

/**
 * SandboxProvider — the component factory.
 *
 * Each platform implements this interface to provide its components.
 * createSandboxClient(provider) calls bootstrap.boot() first,
 * then obtains other components and dispatches incoming messages.
 */
export interface SandboxProvider {
  createBootstrap(): SandboxBootstrap;
  createExecutor(): SandboxExecutor;
  createFileSystem(): SandboxFileSystem;
  createProcessManager(): SandboxProcessManager;
}
