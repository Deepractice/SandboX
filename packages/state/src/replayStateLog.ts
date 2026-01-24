/**
 * Replay StateLog operations to a target
 */

import type { StateLog, WithState } from "./types.js";
import { opRegistry } from "./opRegistry.js";

/**
 * Replay StateLog operations to a target (async version)
 * Use this when you can await the result
 */
export async function replayStateLog(log: StateLog, target: WithState): Promise<void> {
  for (const entry of log.getEntries()) {
    const config = opRegistry[entry.op];
    if (config) {
      await config.replay(target, entry.args);
    }
  }
}

/**
 * Replay StateLog operations synchronously
 * Only env and storage operations are executed (fs operations are async and skipped)
 * Use this in constructors where await is not possible
 */
export function replayStateLogSync(log: StateLog, target: WithState): void {
  for (const entry of log.getEntries()) {
    const config = opRegistry[entry.op];
    if (config && config.namespace !== "fs") {
      // env and storage replays are synchronous
      config.replay(target, entry.args);
    }
  }
}
