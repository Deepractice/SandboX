/**
 * Minimal type definitions for @webcontainer/api.
 *
 * We define our own types instead of importing from @webcontainer/api
 * to avoid making it a hard dependency of sandboxxjs.
 * Consumers pass the real WebContainer instance at runtime.
 */

export interface WebContainerProcess {
  exit: Promise<number>;
  output: ReadableStream<string>;
  input: WritableStream<string>;
  kill(): void;
}

export interface WebContainerDirEnt {
  name: string;
  isFile(): boolean;
  isDirectory(): boolean;
}

export interface WebContainerFS {
  readFile(path: string, encoding: "utf-8"): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  readdir(path: string, options: { withFileTypes: true }): Promise<WebContainerDirEnt[]>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void | string>;
  rm(path: string, options?: { force?: boolean; recursive?: boolean }): Promise<void>;
}

export interface WebContainer {
  fs: WebContainerFS;
  spawn(command: string, args?: string[], options?: { cwd?: string }): Promise<WebContainerProcess>;
}
