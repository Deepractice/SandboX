/**
 * Cloudflare Container Isolator
 * Manages cloudflare-isolator binary and forwards execution requests
 */

import { spawn, type ChildProcess } from "child_process";
import { createServer } from "net";
import { createRequire } from "module";
import { Isolator, type ShellOptions } from "./Isolator.js";
import type { ShellResult } from "../types.js";
import { ExecutionError, FileSystemError } from "../errors.js";

const require = createRequire(import.meta.url);

export class CloudflareContainerIsolator extends Isolator {
  private serverProcess?: ChildProcess;
  private serverUrl?: string;
  private isReady = false;

  constructor() {
    super();
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
      // Resolve the cli.js from @sandboxxjs/cloudflare-isolator package
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

    // Find free port
    const port = await this.findFreePort();
    this.serverUrl = `http://localhost:${port}`;

    // Get binary path (cli.js)
    const cliPath = this.getBinaryPath();

    // Start server via cli.js
    this.serverProcess = spawn("node", [cliPath], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(port) },
    });

    // Log output for debugging (optional)
    this.serverProcess.stdout?.on("data", (_data) => {
      // Silently consume or log if needed
    });

    this.serverProcess.stderr?.on("data", (data) => {
      console.error(`[server] ${data.toString().trim()}`);
    });

    // Wait for server to be ready
    await this.waitForReady(this.serverUrl);
    this.isReady = true;
  }

  /**
   * Execute shell command
   */
  async shell(command: string, options: ShellOptions = {}): Promise<ShellResult> {
    const { timeout = 30000, env = {} } = options;
    const startTime = Date.now();

    // Ensure server is running
    await this.ensureServerRunning();

    try {
      // Call server to execute shell command
      const response = await fetch(`${this.serverUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: command,
          runtime: "bash",
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
      throw new ExecutionError(`Shell execution failed: ${(error as Error).message}`);
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
