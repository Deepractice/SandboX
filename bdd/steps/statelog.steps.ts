/**
 * Step definitions for StateLog integration tests
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import {
  createSandbox,
  buildStateLog,
  loadStateLog,
  type StateSandbox,
  type StateLog,
} from "sandboxxjs";
import type { SandboxWorld } from "./common.steps.js";

// Extend SandboxWorld with StateLog fields
interface StateLogWorld extends SandboxWorld {
  builtStateLog?: StateLog;
  exportedJSON?: string;
}

// Build StateLog
Given(
  "I build a StateLog with operations:",
  function (this: StateLogWorld, dataTable: { hashes: () => Array<Record<string, string>> }) {
    const log = buildStateLog();

    for (const row of dataTable.hashes()) {
      const { op, path, data, key, value } = row;

      if (op === "fs.write" && path && data) {
        log.fs.write(path, data);
      } else if (op === "fs.delete" && path) {
        log.fs.delete(path);
      } else if (op === "env.set" && key && value) {
        log.env.set(key, value);
      } else if (op === "env.delete" && key) {
        log.env.delete(key);
      } else if (op === "storage.set" && key && value) {
        log.storage.set(key, value);
      } else if (op === "storage.delete" && key) {
        log.storage.delete(key);
      } else if (op === "storage.clear") {
        log.storage.clear();
      }
    }

    this.builtStateLog = log;
  }
);

// Create sandbox with StateLog
When("I create sandbox with the StateLog", function (this: StateLogWorld) {
  this.sandbox = createSandbox({
    runtime: "node",
    isolator: "noop",
    state: {
      initializeLog: this.builtStateLog!,
    },
  });
  // Sync operations (env, storage) are applied immediately
  // For fs operations, call init() separately
});

// Complete async initialization
When("I call init to complete async initialization", async function (this: StateLogWorld) {
  await (this.sandbox as StateSandbox).init();
});

// Create sandbox with recording enabled
Given("I create a sandbox with state recording enabled", function (this: StateLogWorld) {
  this.sandbox = createSandbox({
    runtime: "node",
    isolator: "noop",
    state: {
      enableRecord: true,
    },
  });
});

// Check StateLog entries
Then("the StateLog should have {int} entries", function (this: StateLogWorld, count: number) {
  const log = (this.sandbox as any).getStateLog();
  assert.ok(log, "StateLog should exist");
  assert.equal(log.getEntries().length, count, `Expected ${count} entries`);
});

Then(
  "StateLog entry {int} should be {string}",
  function (this: StateLogWorld, index: number, expectedOp: string) {
    const log = (this.sandbox as any).getStateLog();
    const entries = log.getEntries();
    assert.ok(entries[index], `Entry ${index} should exist`);
    assert.equal(entries[index].op, expectedOp, `Expected entry ${index} to be "${expectedOp}"`);
  }
);

// Serialization
When("I export the StateLog as JSON", function (this: StateLogWorld) {
  const log = (this.sandbox as any).getStateLog();
  // toJSON() now returns array, JSON.stringify for string
  this.exportedJSON = JSON.stringify(log.toJSON());
});

Then("the JSON should be valid", function (this: StateLogWorld) {
  assert.ok(this.exportedJSON, "JSON should exist");
  assert.doesNotThrow(() => JSON.parse(this.exportedJSON!), "JSON should be valid");
});

Then("loading the JSON should restore the StateLog", function (this: StateLogWorld) {
  // loadStateLog accepts both string and array
  const restored = loadStateLog(this.exportedJSON!);
  const entries = restored.getEntries();
  assert.ok(entries.length > 0, "Restored log should have entries");
  assert.equal(entries[0].op, "fs.write", "First entry should be fs.write");
});
