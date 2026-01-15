/**
 * Core type definitions for SandboX
 */

export type Runtime = "bash" | "node" | "python" | "docker";
export type IsolatorType = "local" | "cloudflare" | "e2b" | "firecracker" | "docker";

export interface SandboxConfig {
  runtime: Runtime;
  isolator: IsolatorType;
  limits?: ResourceLimits;
  isolation?: IsolationConfig;
}

export interface ResourceLimits {
  timeout?: number; // milliseconds
  memory?: number; // MB
  cpu?: number; // percentage
}

export interface IsolationConfig {
  networkAccess?: boolean;
  fileSystemAccess?: boolean;
  envVars?: Record<string, string>;
}

export interface ExecuteOptions {
  code: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface ExecuteResult {
  success: boolean;
  data?: unknown;
  stdout?: string;
  stderr?: string;
  error?: string;
  exitCode?: number;
  metadata: {
    executionTime: number;
    timestamp: string;
  };
}

export interface FileSystem {
  write(path: string, data: string): Promise<void>;
  read(path: string): Promise<string>;
  list(path: string): Promise<string[]>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

export type EventHandler = (...args: unknown[]) => void;
