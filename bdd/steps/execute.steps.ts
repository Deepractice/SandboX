/**
 * Step definitions for code execution tests
 */

import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import type { SandboxWorld } from "./common.steps.js";

When("I execute code {string}", async function (this: SandboxWorld, code) {
  try {
    this.executeResult = await this.sandbox!.execute({ code });
    this.executeError = undefined;
  } catch (error) {
    this.executeError = error as Error;
    this.executeResult = undefined;
  }
});

When(
  "I execute code {string} with timeout {int}",
  async function (this: SandboxWorld, code, timeout) {
    try {
      this.executeResult = await this.sandbox!.execute({ code, timeout });
      this.executeError = undefined;
    } catch (error) {
      this.executeError = error as Error;
      this.executeResult = undefined;
    }
  }
);

When(
  "I execute code {string} with env {string}",
  async function (this: SandboxWorld, code, envStr) {
    const [key, value] = envStr.split("=");
    const env = { [key]: value };

    try {
      this.executeResult = await this.sandbox!.execute({ code, env });
      this.executeError = undefined;
    } catch (error) {
      this.executeError = error as Error;
      this.executeResult = undefined;
    }
  }
);

Then("the execution should succeed", function (this: SandboxWorld) {
  assert.ok(this.executeResult, "Expected execution result");
  assert.equal(this.executeResult.success, true, "Expected execution to succeed");
});

Then("the execution should fail", function (this: SandboxWorld) {
  assert.ok(this.executeResult, "Expected execution result");
  assert.equal(this.executeResult.success, false, "Expected execution to fail");
});

Then("the execution should timeout", function (this: SandboxWorld) {
  assert.ok(this.executeError, "Expected execution error");
  assert.equal(this.executeError.name, "TimeoutError", "Expected timeout error");
});

Then("the stdout should contain {string}", function (this: SandboxWorld, expected) {
  assert.ok(this.executeResult, "Expected execution result");
  assert.ok(this.executeResult.stdout, "Expected stdout");
  assert.ok(
    this.executeResult.stdout.includes(expected),
    `Expected stdout to contain "${expected}", got "${this.executeResult.stdout}"`
  );
});

Then("the stderr should contain {string}", function (this: SandboxWorld, expected) {
  assert.ok(this.executeResult, "Expected execution result");
  assert.ok(this.executeResult.stderr, "Expected stderr");
  assert.ok(
    this.executeResult.stderr.includes(expected),
    `Expected stderr to contain "${expected}", got "${this.executeResult.stderr}"`
  );
});
