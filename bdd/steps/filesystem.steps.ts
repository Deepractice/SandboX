/**
 * Step definitions for filesystem tests
 */

import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import type { SandboxWorld } from "./common.steps.js";

When("I write {string} to file {string}", async function (this: SandboxWorld, content, filePath) {
  await this.sandbox!.writeFile(filePath, content);
});

When("I read file {string}", async function (this: SandboxWorld, filePath) {
  this.fileContent = await this.sandbox!.readFile(filePath);
});

When("I delete file {string}", async function (this: SandboxWorld, filePath) {
  await this.sandbox!.fs.delete(filePath);
});

Then("the file content should be {string}", function (this: SandboxWorld, expected) {
  assert.equal(this.fileContent, expected, `Expected file content to be "${expected}"`);
});

Then("file {string} should exist", async function (this: SandboxWorld, filePath) {
  const exists = await this.sandbox!.fs.exists(filePath);
  assert.ok(exists, `Expected file "${filePath}" to exist`);
});

Then("file {string} should not exist", async function (this: SandboxWorld, filePath) {
  const exists = await this.sandbox!.fs.exists(filePath);
  assert.ok(!exists, `Expected file "${filePath}" to not exist`);
});

Then(
  "directory {string} should contain {string}",
  async function (this: SandboxWorld, dirPath, fileName) {
    const contents = await this.sandbox!.fs.list(dirPath);
    assert.ok(
      contents.includes(fileName),
      `Expected directory "${dirPath}" to contain "${fileName}"`
    );
  }
);
