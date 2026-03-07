/**
 * Sandbox — the unified interface for sandbox operations.
 *
 * Step 5 of the lifecycle: Command.
 *
 * Consumers get a Sandbox instance and operate on it.
 * They never need to know if it's a cloud container, a browser WebContainer,
 * or any other sandbox type. All commands are routed through the registry
 * to the connected sandbox-client.
 *
 * Lifecycle: Allocate → Prepare → Register → Ready → Command
 *                                                     ^^^^^^^
 */

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface ProcessInfo {
  id: string;
  pid?: number;
  command: string;
  status: string;
}

export interface FileInfo {
  name: string;
  type: "file" | "directory" | "symlink";
  size?: number;
}

export interface Sandbox {
  exec(command: string, options?: ExecOptions): Promise<ExecResult>;
  startProcess(command: string, options?: { cwd?: string }): Promise<ProcessInfo>;
  killProcess(processId: string): Promise<void>;
  listProcesses(): Promise<ProcessInfo[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path: string): Promise<FileInfo[]>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exposePort(port: number, hostname: string): Promise<{ url: string }>;
  destroy(): Promise<void>;
}
