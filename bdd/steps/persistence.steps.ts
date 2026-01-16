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
  sandboxId?: string;
}

// StateStore management
Given("I create a StateStore", function (this: PersistenceWorld) {
  this.store = createStateStore({ type: "resourcex" });
});

When("I create a new StateStore instance", function (this: PersistenceWorld) {
  // For resourcex store, create new instance (simulating restart)
  this.store = createStateStore({ type: "resourcex" });
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

// Sandbox ID assertions
Then("the sandbox should have a unique ID", function (this: PersistenceWorld) {
  assert.ok(this.sandbox, "Sandbox should exist");
  assert.ok((this.sandbox as any).id, "Sandbox should have an ID");
  assert.equal(typeof (this.sandbox as any).id, "string", "ID should be a string");
  assert.ok((this.sandbox as any).id.length > 0, "ID should not be empty");
});

Then("the ID should match pattern {string}", function (this: PersistenceWorld, pattern: string) {
  assert.ok(this.sandbox, "Sandbox should exist");
  const id = (this.sandbox as any).id;
  const regex = new RegExp(pattern);
  assert.ok(regex.test(id), `ID "${id}" should match pattern "${pattern}"`);
});

// Auto-persist scenario
Given("I create a sandbox with enableRecord true", function (this: PersistenceWorld) {
  this.sandbox = createSandbox({
    runtime: "node",
    isolator: "local",
    state: {
      enableRecord: true,
    },
  }) as NodeSandbox;
  this.sandboxId = (this.sandbox as any).id;
});

Then(
  "the StateLog file should exist at {string}",
  async function (this: PersistenceWorld, pathPattern: string) {
    assert.ok(this.sandboxId, "Sandbox ID should exist");
    const os = await import("os");
    const fs = await import("fs/promises");

    // Replace {id} with actual sandbox ID and expand home directory
    const filePath = pathPattern.replace("{id}", this.sandboxId).replace("~", os.homedir());

    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    assert.ok(exists, `File should exist at ${filePath}`);
  }
);

Then(
  "the file should contain {int} lines",
  async function (this: PersistenceWorld, lineCount: number) {
    assert.ok(this.sandboxId, "Sandbox ID should exist");
    const os = await import("os");
    const path = await import("path");
    const fs = await import("fs/promises");

    const filePath = path.join(os.homedir(), ".agentvm/sandbox", this.sandboxId, "state.jsonl");
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content
      .trim()
      .split("\n")
      .filter((line) => line);
    assert.equal(lines.length, lineCount, `Expected ${lineCount} lines, got ${lines.length}`);
  }
);

// Memory store scenario
Given(
  "I create a sandbox with store {string}",
  function (this: PersistenceWorld, storeType: string) {
    this.sandbox = createSandbox({
      runtime: "node",
      isolator: "local",
      state: {
        enableRecord: true,
        store: storeType as "resourcex" | "memory",
      },
    }) as NodeSandbox;
    this.sandboxId = (this.sandbox as any).id;
  }
);

Then("no file should be created on disk", async function (this: PersistenceWorld) {
  assert.ok(this.sandboxId, "Sandbox ID should exist");
  const os = await import("os");
  const path = await import("path");
  const fs = await import("fs/promises");

  const filePath = path.join(os.homedir(), ".agentvm/sandbox", this.sandboxId, "state.jsonl");
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(!exists, `File should not exist at ${filePath} for memory store`);
});

Then("the StateLog should still record the operation", function (this: PersistenceWorld) {
  const log = (this.sandbox as any).getStateLog();
  assert.ok(log, "StateLog should exist");
  const entries = log.getEntries();
  assert.ok(entries.length > 0, "StateLog should have at least one entry");
});
