/**
 * Replay StateLog operations to a target
 */

import type { StateLog, WithState } from "./types.js";
import { opRegistry } from "./opRegistry.js";

/**
 * Replay StateLog operations to a target
 */
export async function replayStateLog(log: StateLog, target: WithState): Promise<void> {
  for (const entry of log.getEntries()) {
    const config = opRegistry[entry.op];
    if (config) {
      await config.replay(target, entry.args);
    }
  }
}
