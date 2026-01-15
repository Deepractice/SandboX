/**
 * Cloudflare Container Isolator
 * Manages cloudflare-isolator binary and forwards execution requests
 */

import { spawn, type ChildProcess } from "child_process";
import { createServer } from "net";
import { createRequire } from "module";
import { Isolator } from "./Isolator.js";
import type { ExecuteOptions, ExecuteResult, FileSystem } from "../types.js";
import { ExecutionError, FileSystemError } from "../errors.js";

const require = createRequire(import.meta.url);

export class CloudflareContainerIsolator extends Isolator {
  private serverProcess?: ChildProcess;
  private serverUrl?: string;
  private isReady = false;
  private runtime: string;

  constructor(runtime: string = "node") {
    super();
    this.runtime = runtime;
  }

  /**
   * Find an available port
   */
  private async findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = createServer();
      server.listen(0, () => {
        const port = (server.address() as any).port;
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
      // Resolve the cli.js from @sandboxjs/cloudflare-isolator package
      return require.resolve("@sandboxjs/cloudflare-isolator");
    } catch {
      throw new ExecutionError("@sandboxjs/cloudflare-isolator not found. Run: bun install");
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
      // console.log(`[server] ${data.toString().trim()}`);
    });

    this.serverProcess.stderr?.on("data", (data) => {
      console.error(`[server] ${data.toString().trim()}`);
    });

    // Wait for server to be ready
    await this.waitForReady(this.serverUrl);
    this.isReady = true;
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    // Ensure server is running
    await this.ensureServerRunning();

    try {
      // Call server to execute code
      const response = await fetch(`${this.serverUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: options.code,
          runtime: this.runtime,
          env: options.env || {},
          timeout: options.timeout || 30000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new ExecutionError(`Server execution failed: ${error}`);
      }

      const result = await response.json();
      return result as ExecuteResult;
    } catch (error) {
      throw new ExecutionError(`Execution failed: ${(error as Error).message}`);
    }
  }

  getFileSystem(): FileSystem {
    // File system operations not yet implemented
    return {
      write: async () => {
        throw new FileSystemError("Filesystem not yet implemented for CloudflareContainerIsolator");
      },
      read: async () => {
        throw new FileSystemError("Filesystem not yet implemented for CloudflareContainerIsolator");
      },
      list: async () => {
        throw new FileSystemError("Filesystem not yet implemented for CloudflareContainerIsolator");
      },
      delete: async () => {
        throw new FileSystemError("Filesystem not yet implemented for CloudflareContainerIsolator");
      },
      exists: async () => {
        throw new FileSystemError("Filesystem not yet implemented for CloudflareContainerIsolator");
      },
    };
  }

  async destroy(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = undefined;
    }
    this.isReady = false;
    this.serverUrl = undefined;
  }
}
