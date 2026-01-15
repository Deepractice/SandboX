/**
 * Abstract Runtime base class
 */

import type { ExecuteOptions, ExecuteResult } from "../types.js";

export abstract class Runtime {
  abstract execute(options: ExecuteOptions): Promise<ExecuteResult>;
  abstract prepare(): Promise<void>;
  abstract cleanup(): Promise<void>;
}
