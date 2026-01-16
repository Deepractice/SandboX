/**
 * Node Execute mixin - adds execute capability for Node.js
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
 * Add Node.js execute capability to sandbox
 */
export function withNodeExecute<T extends Sandbox>(
  Base: SandboxConstructor<T>
): SandboxConstructor<T & WithExecute> {
  return class extends (Base as any) {
    private nodeChecked = false;

    constructor(config: SandboxConfig) {
      super(config);
    }

    async execute(code: string): Promise<ExecuteResult> {
      // Check if Node.js is available (only once per instance)
      if (!this.nodeChecked) {
        const check = await this.shell("which node");
        if (!check.success) {
          throw new ExecutionError(
            "Node.js is not installed. Please install Node.js or use a different isolator (cloudflare/e2b)."
          );
        }
        this.nodeChecked = true;
      }

      // Escape single quotes in code
      const escapedCode = code.replace(/'/g, "'\\''");
      const result = await this.shell(`node -e '${escapedCode}'`);

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
