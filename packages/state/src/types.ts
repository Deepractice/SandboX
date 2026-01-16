/**
 * Type definitions for @sandboxxjs/state
 */

/**
 * Minimal Sandbox interface that State layer needs
 */
export interface Sandbox {
  shell(command: string): Promise<ShellResult>;
}

export interface ShellResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

/**
 * File system interface
 */
export interface FileSystem {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  list(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
}

/**
 * Environment variables interface
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
 * Key-value storage interface
 */
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  keys(): string[];
}

/**
 * State capability (fs + env + storage)
 */
export interface WithState {
  fs: FileSystem;
  env: Environment;
  storage: Storage;
}
