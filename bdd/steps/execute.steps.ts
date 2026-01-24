/**
 * Step definitions for code execution tests
 */

import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import type { SandboxWorld } from "./common.steps.js";

When("I run shell command {string}", async function (this: SandboxWorld, command: string) {
  try {
    this.executeResult = await this.sandbox!.shell(command);
    this.executeError = undefined;
  } catch (error) {
    this.executeError = error as Error;
    this.executeResult = undefined;
  }
});

When("I execute code {string}", async function (this: SandboxWorld, code: string) {
  try {
    this.executeResult = await this.sandbox!.execute(code);
    this.executeError = undefined;
  } catch (error) {
    this.executeError = error as Error;
    this.executeResult = undefined;
  }
});

When("I evaluate expression {string}", async function (this: SandboxWorld, expr: string) {
  try {
    this.evaluateResult = await this.sandbox!.evaluate(expr);
    this.executeError = undefined;
  } catch (error) {
    this.executeError = error as Error;
    this.evaluateResult = undefined;
  }
});

When(
  "I execute code {string} with timeout {int}",
  async function (this: SandboxWorld, code: string, timeout: number) {
    try {
      // Execute with timeout via shell
      const result = await this.sandbox!.shell(
        `timeout ${timeout / 1000} node -e '${code.replace(/'/g, "'\\''")}'`
      );
      this.executeResult = {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      };
      this.executeError = undefined;
    } catch (error) {
      this.executeError = error as Error;
      this.executeResult = undefined;
    }
  }
);

When(
  "I execute code {string} with env {string}",
  async function (this: SandboxWorld, code: string, envStr: string) {
    const [key, value] = envStr.split("=");

    try {
      // Execute with env via shell
      const escapedCode = code.replace(/'/g, "'\\''");
      const result = await this.sandbox!.shell(`${key}=${value} node -e '${escapedCode}'`);
      this.executeResult = {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      };
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

Then("the execution should throw an error", function (this: SandboxWorld) {
  assert.ok(this.executeError, "Expected execution to throw an error");
});

Then("the error message should contain {string}", function (this: SandboxWorld, expected: string) {
  assert.ok(this.executeError, "Expected an error");
  assert.ok(
    this.executeError.message.includes(expected),
    `Expected error message to contain "${expected}", got "${this.executeError.message}"`
  );
});

Then("the evaluation should return {string}", function (this: SandboxWorld, expected: string) {
  assert.ok(this.evaluateResult, "Expected evaluation result");
  assert.equal(this.evaluateResult.value, expected, `Expected value "${expected}"`);
});

Then("the execution should timeout", function (this: SandboxWorld) {
  // With timeout command, it returns exit code 124 on timeout
  assert.ok(this.executeResult, "Expected execution result");
  assert.equal(this.executeResult.exitCode, 124, "Expected timeout exit code");
});

Then("the stdout should contain {string}", function (this: SandboxWorld, expected: string) {
  assert.ok(this.executeResult, "Expected execution result");
  assert.ok(this.executeResult.stdout, "Expected stdout");
  assert.ok(
    this.executeResult.stdout.includes(expected),
    `Expected stdout to contain "${expected}", got "${this.executeResult.stdout}"`
  );
});

Then("the stderr should contain {string}", function (this: SandboxWorld, expected: string) {
  assert.ok(this.executeResult, "Expected execution result");
  assert.ok(this.executeResult.stderr, "Expected stderr");
  assert.ok(
    this.executeResult.stderr.includes(expected),
    `Expected stderr to contain "${expected}", got "${this.executeResult.stderr}"`
  );
});
