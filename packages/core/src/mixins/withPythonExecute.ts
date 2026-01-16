/**
 * Python Execute mixin - adds execute capability for Python
 */

import type {
  Sandbox,
  SandboxConfig,
  SandboxConstructor,
  WithExecute,
  ExecuteResult,
} from "../types.js";
import { ExecutionError } from "../errors.js";

/**
 * Add Python execute capability to sandbox
 */
export function withPythonExecute<T extends Sandbox>(
  Base: SandboxConstructor<T>
): SandboxConstructor<T & WithExecute> {
  return class extends (Base as any) {
    private pythonChecked = false;

    constructor(config: SandboxConfig) {
      super(config);
    }

    async execute(code: string): Promise<ExecuteResult> {
      // Check if Python is available (only once per instance)
      if (!this.pythonChecked) {
        const check = await this.shell("which python3");
        if (!check.success) {
          throw new ExecutionError(
            "Python 3 is not installed. Please install Python 3 or use a different isolator (cloudflare/e2b)."
          );
        }
        this.pythonChecked = true;
      }

      // Escape single quotes in code
      const escapedCode = code.replace(/'/g, "'\\''");
      const result = await this.shell(`python3 -c '${escapedCode}'`);

      return {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      };
    }
  } as unknown as SandboxConstructor<T & WithExecute>;
}
