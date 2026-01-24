/**
 * Node Execute mixin - adds execute and evaluate capabilities for Node.js
 */

import type {
  Sandbox,
  SandboxConfig,
  SandboxConstructor,
  WithExecute,
  WithEvaluate,
  ExecuteResult,
  EvaluateResult,
} from "../types.js";
import { ExecutionError } from "../errors.js";

/**
 * Add Node.js execute and evaluate capabilities to sandbox
 */
export function withNodeExecute<T extends Sandbox>(
  Base: SandboxConstructor<T>
): SandboxConstructor<T & WithExecute & WithEvaluate> {
  return class extends (Base as any) {
    private nodeChecked = false;

    constructor(config: SandboxConfig) {
      super(config);
    }

    private async ensureNode(): Promise<void> {
      if (!this.nodeChecked) {
        const check = await this.shell("which node");
        if (!check.success) {
          throw new ExecutionError(
            "Node.js is not installed. Please install Node.js or use a different isolator (cloudflare/e2b)."
          );
        }
        this.nodeChecked = true;
      }
    }

    /**
     * Execute code as a script (stdout mode)
     * Use console.log() to output results
     * Throws ExecutionError if code fails
     */
    async execute(code: string): Promise<ExecuteResult> {
      await this.ensureNode();

      // Escape single quotes in code
      const escapedCode = code.replace(/'/g, "'\\''");
      const result = await this.shell(`node -e '${escapedCode}'`);

      if (!result.success) {
        throw new ExecutionError(
          result.stderr || `Execution failed with exit code ${result.exitCode}`
        );
      }

      return {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
      };
    }

    /**
     * Evaluate expression and return its value (REPL mode)
     * Returns the value of the last expression
     */
    async evaluate(expr: string): Promise<EvaluateResult> {
      await this.ensureNode();

      // Escape single quotes in expression
      const escapedExpr = expr.replace(/'/g, "'\\''");
      // Use node -p to print the result of the expression
      const result = await this.shell(`node -p '${escapedExpr}'`);

      if (!result.success) {
        throw new ExecutionError(
          result.stderr || `Evaluation failed with exit code ${result.exitCode}`
        );
      }

      return {
        value: result.stdout.trim(),
        executionTime: result.executionTime,
      };
    }
  } as unknown as SandboxConstructor<T & WithExecute & WithEvaluate>;
}
