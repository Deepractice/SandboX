/**
 * Factory function for creating Sandbox instances
 */

import { BaseSandbox, withState, type SandboxConfig, type StateSandbox } from "@sandboxxjs/core";

/**
 * Create sandbox with state (fs, env, storage)
 */
export function createSandbox(config: SandboxConfig): StateSandbox {
  const SandboxWithState = withState(BaseSandbox);
  return new SandboxWithState(config);
}
