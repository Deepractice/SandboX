/**
 * Shared step definitions
 */

import { Given, After, setWorldConstructor } from "@cucumber/cucumber";
import {
  createSandbox,
  type StateSandbox,
  type ExecuteResult,
  type EvaluateResult,
  type RuntimeType,
  type IsolatorType,
} from "sandboxxjs";

export class SandboxWorld {
  sandbox?: StateSandbox;
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
      runtime: runtime as RuntimeType,
      isolator: isolator as IsolatorType,
    });
  }
);

After(async function (this: SandboxWorld) {
  if (this.sandbox) {
    await this.sandbox.destroy();
  }
});
