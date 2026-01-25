/**
 * SRT Isolator - OS-level isolation via @anthropic-ai/sandbox-runtime
 * Uses Seatbelt (macOS) or bubblewrap (Linux) for sandboxing
 */

import { execa } from "execa";
import * as fs from "fs/promises";
import * as path from "path";
import { Isolator, type IsolatorOptions } from "./Isolator.js";
import type { ShellResult, ExecuteResult, EvaluateResult, RuntimeType } from "../types.js";
import { ExecutionError, TimeoutError, FileSystemError } from "../errors.js";

export class SrtIsolator extends Isolator {
  private workDir: string;
  private srtChecked = false;

  constructor(runtime: RuntimeType) {
    super(runtime);
    this.workDir = path.join(process.cwd(), ".sandbox", `session-${Date.now()}`);
  }

  /**
   * Ensure srt is installed
   */
  private async ensureSrt(): Promise<void> {
    if (this.srtChecked) return;

    try {
      await execa("srt", ["--version"]);
      this.srtChecked = true;
    } catch {
      throw new ExecutionError(
        "srt (sandbox-runtime) is not installed. Run: npm install -g @anthropic-ai/sandbox-runtime"
      );
    }
  }

  /**
   * Execute shell command with srt isolation
   */
  async shell(command: string, options: IsolatorOptions = {}): Promise<ShellResult> {
    await this.ensureSrt();
    const { timeout = 30000, env = {} } = options;
    return this.runCommand(command, timeout, env);
  }

  /**
   * Execute code (script mode) with srt isolation
   */
  async execute(code: string, options: IsolatorOptions = {}): Promise<ExecuteResult> {
    await this.ensureSrt();
    const { timeout = 30000, env = {} } = options;
    const command = this.buildExecuteCommand(code);
    const result = await this.runCommand(command, timeout, env);

    if (!result.success) {
      throw new ExecutionError(
        result.stderr || `Execution failed with exit code ${result.exitCode}`
      );
    }

    return result;
  }

  /**
   * Evaluate expression (REPL mode) with srt isolation
   */
  async evaluate(expr: string, options: IsolatorOptions = {}): Promise<EvaluateResult> {
    await this.ensureSrt();
    const { timeout = 30000, env = {} } = options;
    const command = this.buildEvaluateCommand(expr);
    const result = await this.runCommand(command, timeout, env);

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

  /**
   * Build execute command based on runtime
   */
  private buildExecuteCommand(code: string): string {
    const escapedCode = code.replace(/'/g, "'\\''");
    switch (this.runtime) {
      case "node":
        return `node -e '${escapedCode}'`;
      case "python":
        return `python3 -c '${escapedCode}'`;
      default:
        throw new ExecutionError(`Unknown runtime: ${this.runtime}`);
    }
  }

  /**
   * Build evaluate command based on runtime
   */
  private buildEvaluateCommand(expr: string): string {
    const escapedExpr = expr.replace(/'/g, "'\\''");
    switch (this.runtime) {
      case "node":
        return `node -p '${escapedExpr}'`;
      case "python":
        return `python3 -c 'print(${escapedExpr})'`;
      default:
        throw new ExecutionError(`Unknown runtime: ${this.runtime}`);
    }
  }

  /**
   * Run command with srt wrapper
   */
  private async runCommand(
    command: string,
    timeout: number,
    env: Record<string, string>
  ): Promise<ShellResult> {
    const startTime = Date.now();

    // Ensure work directory exists
    await fs.mkdir(this.workDir, { recursive: true });

    try {
      // Use srt to wrap the command execution
      const result = await execa("srt", ["--", "sh", "-c", command], {
        cwd: this.workDir,
        env: { ...process.env, ...env },
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        reject: false,
        all: true,
      });

      return {
        success: result.exitCode === 0,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode ?? 0,
        executionTime: Date.now() - startTime,
      };
    } catch (error: unknown) {
      if (error && typeof error === "object" && "timedOut" in error && error.timedOut) {
        throw new TimeoutError(`Execution timed out after ${timeout}ms`);
      }
      throw new ExecutionError(`Command execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Upload file to sandbox
   */
  async upload(data: Buffer, remotePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.workDir, remotePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, data);
    } catch (error) {
      throw new FileSystemError(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Download file from sandbox
   */
  async download(remotePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.workDir, remotePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new FileSystemError(`Failed to download file: ${(error as Error).message}`);
    }
  }

  /**
   * Destroy isolator and cleanup
   */
  async destroy(): Promise<void> {
    try {
      await fs.rm(this.workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
