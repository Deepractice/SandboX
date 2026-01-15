/**
 * Generic Runtime - delegates to isolator for all languages
 */

import { Runtime } from "./Runtime.js";
import type { ExecuteOptions, ExecuteResult } from "../types.js";
import { Isolator } from "../isolators/Isolator.js";

export class GenericRuntime extends Runtime {
  constructor(private isolator: Isolator) {
    super();
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    // Simply delegate to isolator
    return this.isolator.execute(options);
  }

  async prepare(): Promise<void> {
    // Generic runtime doesn't need special preparation
  }

  async cleanup(): Promise<void> {
    // Generic runtime doesn't need special cleanup
  }
}
