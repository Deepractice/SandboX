/**
 * Core type definitions for SandboX
 */

// ============================================
// Configuration Types
// ============================================

export type IsolatorType = "local" | "cloudflare" | "e2b" | "docker";
export type Runtime = "shell" | "node" | "python";

export interface SandboxConfig {
  /** Isolator type */
  isolator: IsolatorType;

  /** Runtime type (default: shell) */
  runtime?: Runtime;

  /** Resource limits */
  limits?: ResourceLimits;

  /** Initial environment variables */
  env?: Record<string, string>;

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
 * Base Sandbox interface - 2 core APIs
 */
export interface Sandbox {
  /** Execute shell command */
  shell(command: string): Promise<ShellResult>;

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
// State Layer Interfaces
// ============================================

/**
 * File system operations
 */
export interface FileSystem {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  list(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
}

/**
 * Environment variables
 */
export interface Environment {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  has(key: string): boolean;
  delete(key: string): void;
  keys(): string[];
  all(): Record<string, string>;
}

/**
 * Key-value storage
 */
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  keys(): string[];
}

// ============================================
// Mixin Capability Interfaces
// ============================================

/**
 * State capability (fs + env + storage)
 */
export interface WithState {
  fs: FileSystem;
  env: Environment;
  storage: Storage;
}

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
