/**
 * Sandbox — the unified interface for sandbox operations.
 *
 * This is the ONE interface that all roles share.
 * Whether you're a Client, Worker, or Broker — you produce or consume Sandbox.
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
  destroy(): Promise<void>;
}
