/**
 * Step definitions for binary file transfer (upload/download) tests
 */

import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import type { SandboxWorld } from "./common.steps.js";

// Extend SandboxWorld with assets fields
interface AssetsWorld extends SandboxWorld {
  downloadedData?: Buffer;
}

When(
  "I upload binary data {string} to {string}",
  async function (this: AssetsWorld, base64Data: string, remotePath: string) {
    const data = Buffer.from(base64Data, "base64");
    await this.sandbox!.upload(data, remotePath);
  }
);

When("I download binary file {string}", async function (this: AssetsWorld, remotePath: string) {
  this.downloadedData = await this.sandbox!.download(remotePath);
});

Then(
  "the downloaded data should be {string}",
  function (this: AssetsWorld, expectedBase64: string) {
    assert.ok(this.downloadedData, "Downloaded data should exist");
    const actualBase64 = this.downloadedData.toString("base64");
    assert.equal(
      actualBase64,
      expectedBase64,
      `Expected downloaded data to be "${expectedBase64}", got "${actualBase64}"`
    );
  }
);
