/**
 * Core type definitions for SandboX
 */

import type { WithState, StateLog } from "@sandboxxjs/state";

// ============================================
// Configuration Types
// ============================================

export type IsolatorType = "noop" | "srt" | "cloudflare" | "e2b";
export type RuntimeType = "node" | "python";

export interface StateConfig {
  /** Simple environment variable initialization */
  env?: Record<string, string>;

  /** Initialize state from StateLog */
  initializeLog?: StateLog;

  /** Enable state recording */
  enableRecord?: boolean;

  /** Store type (default: resourcex, test: memory) */
  store?: "resourcex" | "memory";
}

export interface SandboxConfig {
  /** Isolator type */
  isolator: IsolatorType;

  /** Runtime type */
  runtime: RuntimeType;

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
 * Base Sandbox interface - core APIs
 */
export interface Sandbox {
  /** Unique sandbox ID */
  readonly id: string;

  /** Execute shell command */
  shell(command: string): Promise<ShellResult>;

  /** Execute code (script mode - stdout) */
  execute(code: string): Promise<ExecuteResult>;

  /** Evaluate expression (REPL mode - return value) */
  evaluate(expr: string): Promise<EvaluateResult>;

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

/**
 * Code execution result (same as ShellResult)
 */
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

/**
 * Expression evaluation result
 */
export interface EvaluateResult {
  /** Expression result value (as string) */
  value: string;
  /** Execution time in milliseconds */
  executionTime: number;
}

// ============================================
// Composed Types
// ============================================

/** Sandbox with State (fs, env, storage) */
export type StateSandbox = Sandbox & WithState;

// ============================================
// Constructor Types
// ============================================

/** Sandbox constructor type */
export type SandboxConstructor<T extends Sandbox = Sandbox> = new (config: SandboxConfig) => T;
