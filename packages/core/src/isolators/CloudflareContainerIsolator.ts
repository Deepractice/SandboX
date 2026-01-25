/**
 * Cloudflare Container Isolator
 * Manages cloudflare-isolator service and forwards execution requests
 */

import { spawn, type ChildProcess } from "child_process";
import { createServer } from "net";
import { createRequire } from "module";
import { Isolator, type IsolatorOptions } from "./Isolator.js";
import type { ShellResult, ExecuteResult, EvaluateResult, RuntimeType } from "../types.js";
import { ExecutionError, FileSystemError } from "../errors.js";

const require = createRequire(import.meta.url);

export class CloudflareContainerIsolator extends Isolator {
  private serverProcess?: ChildProcess;
  private serverUrl?: string;
  private isReady = false;

  constructor(runtime: RuntimeType) {
    super(runtime);
  }

  /**
   * Find an available port
   */
  private async findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = createServer();
      server.listen(0, () => {
        const port = (server.address() as { port: number }).port;
        server.close(() => resolve(port));
      });
      server.on("error", reject);
    });
  }

  /**
   * Get binary path from installed package
   */
  private getBinaryPath(): string {
    try {
      return require.resolve("@sandboxxjs/cloudflare-isolator");
    } catch {
      throw new ExecutionError("@sandboxxjs/cloudflare-isolator not found. Run: bun install");
    }
  }

  /**
   * Wait for server to be ready
   */
  private async waitForReady(url: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${url}/health`);
        if (response.ok) {
          return;
        }
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new ExecutionError("Server failed to start after 30 seconds");
  }

  /**
   * Ensure server is running
   */
  private async ensureServerRunning(): Promise<void> {
    if (this.isReady) return;

    const port = await this.findFreePort();
    this.serverUrl = `http://localhost:${port}`;

    const cliPath = this.getBinaryPath();

    this.serverProcess = spawn("node", [cliPath], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(port) },
    });

    this.serverProcess.stdout?.on("data", () => {
      // Silently consume
    });

    this.serverProcess.stderr?.on("data", (data) => {
      console.error(`[cloudflare-isolator] ${data.toString().trim()}`);
    });

    await this.waitForReady(this.serverUrl);
    this.isReady = true;
  }

  /**
   * Execute shell command
   */
  async shell(command: string, options: IsolatorOptions = {}): Promise<ShellResult> {
    const { timeout = 30000, env = {} } = options;
    return this.callServer(command, "shell", timeout, env);
  }

  /**
   * Execute code (script mode)
   */
  async execute(code: string, options: IsolatorOptions = {}): Promise<ExecuteResult> {
    const { timeout = 30000, env = {} } = options;
    const result = await this.callServer(code, "execute", timeout, env);

    if (!result.success) {
      throw new ExecutionError(
        result.stderr || `Execution failed with exit code ${result.exitCode}`
      );
    }

    return result;
  }

  /**
   * Evaluate expression (REPL mode)
   */
  async evaluate(expr: string, options: IsolatorOptions = {}): Promise<EvaluateResult> {
    const { timeout = 30000, env = {} } = options;
    const result = await this.callServer(expr, "evaluate", timeout, env);

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
   * Call server to execute command
   */
  private async callServer(
    code: string,
    mode: "shell" | "execute" | "evaluate",
    timeout: number,
    env: Record<string, string>
  ): Promise<ShellResult> {
    const startTime = Date.now();

    await this.ensureServerRunning();

    try {
      const response = await fetch(`${this.serverUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          mode,
          runtime: this.runtime,
          env,
          timeout,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new ExecutionError(`Server execution failed: ${error}`);
      }

      const result = (await response.json()) as {
        success: boolean;
        stdout?: string;
        stderr?: string;
        exitCode?: number;
      };

      return {
        success: result.success,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode ?? (result.success ? 0 : 1),
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof ExecutionError) throw error;
      throw new ExecutionError(`Server call failed: ${(error as Error).message}`);
    }
  }

  /**
   * Upload file to sandbox
   */
  async upload(_data: Buffer, _remotePath: string): Promise<void> {
    throw new FileSystemError("Upload not yet implemented for CloudflareContainerIsolator");
  }

  /**
   * Download file from sandbox
   */
  async download(_remotePath: string): Promise<Buffer> {
    throw new FileSystemError("Download not yet implemented for CloudflareContainerIsolator");
  }

  /**
   * Destroy isolator and cleanup
   */
  async destroy(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = undefined;
    }
    this.isReady = false;
    this.serverUrl = undefined;
  }
}
