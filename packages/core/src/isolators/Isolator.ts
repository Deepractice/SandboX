/**
 * Abstract Isolator base class
 */

import type { ExecuteOptions, ExecuteResult, FileSystem } from "../types.js";

export abstract class Isolator {
  abstract execute(options: ExecuteOptions): Promise<ExecuteResult>;
  abstract getFileSystem(): FileSystem;
  abstract destroy(): Promise<void>;
}
