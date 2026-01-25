/**
 * Abstract Isolator base class
 */

import type { ShellResult, ExecuteResult, EvaluateResult, RuntimeType } from "../types.js";

export interface IsolatorOptions {
  timeout?: number;
  env?: Record<string, string>;
}

export abstract class Isolator {
  protected runtime: RuntimeType;

  constructor(runtime: RuntimeType) {
    this.runtime = runtime;
  }

  /**
   * Execute shell command in isolated environment
   */
  abstract shell(command: string, options?: IsolatorOptions): Promise<ShellResult>;

  /**
   * Execute code (script mode - stdout)
   * Command depends on runtime: node -e / python3 -c
   */
  abstract execute(code: string, options?: IsolatorOptions): Promise<ExecuteResult>;

  /**
   * Evaluate expression (REPL mode - return value)
   * Command depends on runtime: node -p / python3 -c 'print(...)'
   */
  abstract evaluate(expr: string, options?: IsolatorOptions): Promise<EvaluateResult>;

  /**
   * Upload file to isolated environment
   */
  abstract upload(data: Buffer, remotePath: string): Promise<void>;

  /**
   * Download file from isolated environment
   */
  abstract download(remotePath: string): Promise<Buffer>;

  /**
   * Destroy isolator and cleanup resources
   */
  abstract destroy(): Promise<void>;
}
