/**
 * Shared step definitions
 */

import { Given, setWorldConstructor } from "@cucumber/cucumber";
import { createSandbox, type Sandbox, type ExecuteResult } from "sandboxjs";

export class SandboxWorld {
  sandbox?: Sandbox;
  executeResult?: ExecuteResult;
  executeError?: Error;
  fileContent?: string;
}

setWorldConstructor(SandboxWorld);

Given(
  "I create a sandbox with {string} runtime and {string} isolator",
  function (this: SandboxWorld, runtime, isolator) {
    this.sandbox = createSandbox({
      runtime: runtime as "bash" | "node" | "python" | "docker",
      isolator: isolator as "local" | "e2b" | "firecracker" | "docker",
    });
  }
);
