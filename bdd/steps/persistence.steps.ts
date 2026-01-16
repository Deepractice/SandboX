/**
 * Step definitions for state persistence tests
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import {
  createSandbox,
  buildStateLog,
  loadStateLog,
  type NodeSandbox,
  type StateLog,
} from "sandboxxjs";
import { createStateStore, type StateStore } from "@sandboxxjs/state";
import type { SandboxWorld } from "./common.steps.js";

// Extend SandboxWorld with persistence fields
interface PersistenceWorld extends SandboxWorld {
  store?: StateStore;
  builtLog?: StateLog;
  loadedLog?: StateLog;
}

// StateStore management
Given("I create a StateStore", function (this: PersistenceWorld) {
  this.store = createStateStore({ type: "memory" });
});

When("I create a new StateStore instance", function (this: PersistenceWorld) {
  // For memory store, create new instance (simulating restart)
  this.store = createStateStore({ type: "memory" });
});

// Save StateLog to store
When(
  "I save the StateLog to store with key {string}",
  async function (this: PersistenceWorld, key: string) {
    const log = (this.sandbox as any).getStateLog();
    assert.ok(log, "StateLog should exist");

    if (!this.store) {
      this.store = createStateStore({ type: "memory" });
    }

    await this.store.saveLog(key, log.toJSON());
  }
);

// Build StateLog manually
When("I build a StateLog with file write and env set", function (this: PersistenceWorld) {
  this.builtLog = buildStateLog()
    .fs.write("config.json", '{"test": true}')
    .env.set("BUILD_ENV", "test");
});

When(
  "I save the log to store with key {string}",
  async function (this: PersistenceWorld, key: string) {
    assert.ok(this.builtLog, "Built log should exist");
    await this.store!.saveLog(key, this.builtLog.toJSON());
  }
);

When(
  "I load the log from store with key {string}",
  async function (this: PersistenceWorld, key: string) {
    const json = await this.store!.loadLog(key);
    assert.ok(json, `Log "${key}" should exist in store`);
    this.loadedLog = loadStateLog(json);
  }
);

// Create new sandbox from stored StateLog
When(
  "I create a new sandbox from stored StateLog {string}",
  async function (this: PersistenceWorld, key: string) {
    const json = await this.store!.loadLog(key);
    assert.ok(json, `StateLog "${key}" should exist in store`);

    const restoredLog = loadStateLog(json);

    this.sandbox = createSandbox({
      runtime: "node",
      isolator: "local",
      state: {
        initializeLog: restoredLog,
      },
    }) as NodeSandbox;

    // Wait for replay to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
);

// Assertions
Then("the loaded log should have {int} entries", function (this: PersistenceWorld, count: number) {
  assert.ok(this.loadedLog, "Loaded log should exist");
  assert.equal(this.loadedLog.getEntries().length, count, `Expected ${count} entries`);
});
