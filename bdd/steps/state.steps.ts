/**
 * Step definitions for state (env and storage) tests
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import { createSandbox, type NodeSandbox } from "sandboxxjs";
import type { SandboxWorld } from "./common.steps.js";

// Environment variable steps

When(
  "I set environment variable {string} to {string}",
  function (this: SandboxWorld, key: string, value: string) {
    this.sandbox!.env.set(key, value);
  }
);

When("I delete environment variable {string}", function (this: SandboxWorld, key: string) {
  this.sandbox!.env.delete(key);
});

Then(
  "environment variable {string} should be {string}",
  function (this: SandboxWorld, key: string, expected: string) {
    const value = this.sandbox!.env.get(key);
    assert.equal(value, expected, `Expected env "${key}" to be "${expected}", got "${value}"`);
  }
);

Then("environment variable {string} should exist", function (this: SandboxWorld, key: string) {
  const exists = this.sandbox!.env.has(key);
  assert.ok(exists, `Expected env "${key}" to exist`);
});

Then("environment variable {string} should not exist", function (this: SandboxWorld, key: string) {
  const exists = this.sandbox!.env.has(key);
  assert.ok(!exists, `Expected env "${key}" to not exist`);
});

// Storage steps

When(
  "I set storage item {string} to {string}",
  function (this: SandboxWorld, key: string, value: string) {
    this.sandbox!.storage.setItem(key, value);
  }
);

When("I remove storage item {string}", function (this: SandboxWorld, key: string) {
  this.sandbox!.storage.removeItem(key);
});

When("I clear storage", function (this: SandboxWorld) {
  this.sandbox!.storage.clear();
});

Then(
  "storage item {string} should be {string}",
  function (this: SandboxWorld, key: string, expected: string) {
    const value = this.sandbox!.storage.getItem(key);
    assert.equal(value, expected, `Expected storage "${key}" to be "${expected}", got "${value}"`);
  }
);

Then("storage item {string} should be null", function (this: SandboxWorld, key: string) {
  const value = this.sandbox!.storage.getItem(key);
  assert.equal(value, null, `Expected storage "${key}" to be null, got "${value}"`);
});

Then("storage should contain keys {string}", function (this: SandboxWorld, keysStr: string) {
  const expectedKeys = keysStr.split(",").sort();
  const actualKeys = this.sandbox!.storage.keys().sort();
  assert.deepEqual(
    actualKeys,
    expectedKeys,
    `Expected storage keys ${expectedKeys.join(",")}, got ${actualKeys.join(",")}`
  );
});

// Special Given for env initialization
Given(
  "I create a sandbox with {string} runtime and {string} isolator and env {string}",
  function (this: SandboxWorld, runtime: string, isolator: string, envStr: string) {
    const [key, value] = envStr.split("=");
    this.sandbox = createSandbox({
      runtime: runtime as "shell" | "node" | "python",
      isolator: isolator as "local" | "cloudflare" | "e2b" | "docker",
      state: {
        env: { [key]: value },
      },
    }) as NodeSandbox;
  }
);
