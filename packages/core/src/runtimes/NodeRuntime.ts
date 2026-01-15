/**
 * Node.js Runtime implementation
 */

import { Runtime } from "./Runtime.js";
import type { ExecuteOptions, ExecuteResult } from "../types.js";
import { Backend } from "../backends/Backend.js";

export class NodeRuntime extends Runtime {
  constructor(private backend: Backend) {
    super();
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    // For Node runtime, we delegate to the backend
    return this.backend.execute(options);
  }

  async prepare(): Promise<void> {
    // TODO: Setup Node.js environment
    // For now, just a placeholder
  }

  async cleanup(): Promise<void> {
    // TODO: Cleanup Node.js environment
    // For now, just a placeholder
  }
}
