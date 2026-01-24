/**
 * Python Execute mixin - adds execute and evaluate capabilities for Python
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
 * Add Python execute and evaluate capabilities to sandbox
 */
export function withPythonExecute<T extends Sandbox>(
  Base: SandboxConstructor<T>
): SandboxConstructor<T & WithExecute & WithEvaluate> {
  return class extends (Base as any) {
    private pythonChecked = false;

    constructor(config: SandboxConfig) {
      super(config);
    }

    private async ensurePython(): Promise<void> {
      if (!this.pythonChecked) {
        const check = await this.shell("which python3");
        if (!check.success) {
          throw new ExecutionError(
            "Python 3 is not installed. Please install Python 3 or use a different isolator (cloudflare/e2b)."
          );
        }
        this.pythonChecked = true;
      }
    }

    /**
     * Execute code as a script (stdout mode)
     * Use print() to output results
     * Throws ExecutionError if code fails
     */
    async execute(code: string): Promise<ExecuteResult> {
      await this.ensurePython();

      // Escape single quotes in code
      const escapedCode = code.replace(/'/g, "'\\''");
      const result = await this.shell(`python3 -c '${escapedCode}'`);

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
     * Returns the value of the expression
     */
    async evaluate(expr: string): Promise<EvaluateResult> {
      await this.ensurePython();

      // Use JSON to safely pass the expression and get the result
      const exprJson = JSON.stringify(expr);
      // Python wrapper: eval the expression and print the result
      const wrapper = `print(eval(${exprJson}))`;
      const escapedWrapper = wrapper.replace(/'/g, "'\\''");
      const result = await this.shell(`python3 -c '${escapedWrapper}'`);

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
