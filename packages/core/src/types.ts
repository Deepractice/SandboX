/**
 * Core type definitions for SandboX
 */

import type { WithState, StateLog } from "@sandboxxjs/state";

// ============================================
// Configuration Types
// ============================================

export type IsolatorType = "local" | "cloudflare" | "e2b" | "docker";
export type Runtime = "shell" | "node" | "python";

export interface StateConfig {
  /** Simple environment variable initialization */
  env?: Record<string, string>;

  /** Initialize state from StateLog */
  initializeLog?: StateLog;

  /** Enable state recording */
  enableRecord?: boolean;
}

export interface SandboxConfig {
  /** Isolator type */
  isolator: IsolatorType;

  /** Runtime type (default: shell) */
  runtime?: Runtime;

  /** Resource limits */
  limits?: ResourceLimits;

  /** State configuration */
  state?: StateConfig;

  /** Node-specific configuration */
  node?: NodeConfig;

  /** Python-specific configuration */
  python?: PythonConfig;
}

export interface ResourceLimits {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Memory limit in bytes */
  memory?: number;
  /** CPU limit as percentage */
  cpu?: number;
}

export interface NodeConfig {
  /** Package manager */
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  /** Node version */
  version?: string;
}

export interface PythonConfig {
  /** Python version */
  version?: string;
  /** Whether to use virtual environment */
  useVenv?: boolean;
}

// ============================================
// Base Sandbox Interface
// ============================================

/**
 * Base Sandbox interface - 4 core APIs
 */
export interface Sandbox {
  /** Execute shell command */
  shell(command: string): Promise<ShellResult>;

  /** Upload file to sandbox */
  upload(data: Buffer, remotePath: string): Promise<void>;

  /** Download file from sandbox */
  download(remotePath: string): Promise<Buffer>;

  /** Destroy sandbox */
  destroy(): Promise<void>;
}

/**
 * Shell execution result
 */
export interface ShellResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code */
  exitCode: number;
  /** Execution time in milliseconds */
  executionTime: number;
}

// ============================================
// Mixin Capability Interfaces
// ============================================

/**
 * Code execution capability
 */
export interface WithExecute {
  execute(code: string): Promise<ExecuteResult>;
}

export interface ExecuteResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Exit code */
  exitCode: number;
  /** Execution time in milliseconds */
  executionTime: number;
}

// ============================================
// Composed Types
// ============================================

/** Node sandbox = Base + State + Execute */
export type NodeSandbox = Sandbox & WithState & WithExecute;

/** Python sandbox = Base + State + Execute */
export type PythonSandbox = Sandbox & WithState & WithExecute;

/** Sandbox with State only */
export type StateSandbox = Sandbox & WithState;

// ============================================
// Mixin Constructor Types
// ============================================

/** Sandbox constructor type */
export type SandboxConstructor<T extends Sandbox = Sandbox> = new (config: SandboxConfig) => T;

/** Mixin function type */
export type SandboxMixin<T extends Sandbox, U> = (
  Base: SandboxConstructor<T>
) => SandboxConstructor<T & U>;
