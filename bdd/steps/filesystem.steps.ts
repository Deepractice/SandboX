/**
 * Step definitions for filesystem tests
 */

import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import type { SandboxWorld } from "./common.steps.js";

When(
  "I write {string} to file {string}",
  async function (this: SandboxWorld, content: string, filePath: string) {
    await this.sandbox!.fs.write(filePath, content);
  }
);

When("I read file {string}", async function (this: SandboxWorld, filePath: string) {
  this.fileContent = await this.sandbox!.fs.read(filePath);
});

When("I delete file {string}", async function (this: SandboxWorld, filePath: string) {
  await this.sandbox!.fs.delete(filePath);
});

Then("the file content should be {string}", function (this: SandboxWorld, expected: string) {
  assert.equal(this.fileContent, expected, `Expected file content to be "${expected}"`);
});

Then("file {string} should exist", async function (this: SandboxWorld, filePath: string) {
  const exists = await this.sandbox!.fs.exists(filePath);
  assert.ok(exists, `Expected file "${filePath}" to exist`);
});

Then("file {string} should not exist", async function (this: SandboxWorld, filePath: string) {
  const exists = await this.sandbox!.fs.exists(filePath);
  assert.ok(!exists, `Expected file "${filePath}" to not exist`);
});

Then(
  "directory {string} should contain {string}",
  async function (this: SandboxWorld, dirPath: string, fileName: string) {
    const contents = await this.sandbox!.fs.list(dirPath);
    assert.ok(
      contents.includes(fileName),
      `Expected directory "${dirPath}" to contain "${fileName}", got: ${contents.join(", ")}`
    );
  }
);
