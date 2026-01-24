/**
 * Shared step definitions
 */

import { Given, After, setWorldConstructor } from "@cucumber/cucumber";
import {
  createSandbox,
  type NodeSandbox,
  type ExecuteResult,
  type EvaluateResult,
} from "sandboxxjs";

export class SandboxWorld {
  sandbox?: NodeSandbox;
  executeResult?: ExecuteResult;
  evaluateResult?: EvaluateResult;
  executeError?: Error;
  fileContent?: string;
}

setWorldConstructor(SandboxWorld);

Given(
  "I create a sandbox with {string} runtime and {string} isolator",
  function (this: SandboxWorld, runtime: string, isolator: string) {
    this.sandbox = createSandbox({
      runtime: runtime as "shell" | "node" | "python",
      isolator: isolator as "local" | "cloudflare" | "e2b" | "docker",
    }) as NodeSandbox;
  }
);

After(async function (this: SandboxWorld) {
  if (this.sandbox) {
    await this.sandbox.destroy();
  }
});
