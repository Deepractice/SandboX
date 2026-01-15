/**
 * Factory function for creating Sandbox instances
 */

import { Sandbox, type SandboxConfig } from "@sandboxxjs/core";

export function createSandbox(config: SandboxConfig): Sandbox {
  return new Sandbox(config);
}
