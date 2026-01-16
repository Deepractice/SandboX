/**
 * Local Isolator using child_process via execa
 */

import { execa } from "execa";
import * as fs from "fs/promises";
import * as path from "path";
import { Isolator, type ShellOptions } from "./Isolator.js";
import type { ShellResult } from "../types.js";
import { ExecutionError, TimeoutError, FileSystemError } from "../errors.js";

export class LocalIsolator extends Isolator {
  private workDir: string;

  constructor() {
    super();
    // Create temp work directory
    this.workDir = path.join(process.cwd(), ".sandbox", `session-${Date.now()}`);
  }

  /**
   * Execute shell command
   */
  async shell(command: string, options: ShellOptions = {}): Promise<ShellResult> {
    const { timeout = 30000, env = {} } = options;
    const startTime = Date.now();

    // Ensure work directory exists
    await fs.mkdir(this.workDir, { recursive: true });

    try {
      const result = await execa("sh", ["-c", command], {
        cwd: this.workDir,
        env: { ...process.env, ...env },
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB output limit
        reject: false, // Don't throw on non-zero exit
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
      throw new ExecutionError(`Shell execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Upload file to sandbox
   */
  async upload(filePath: string, data: string | Buffer): Promise<void> {
    try {
      const fullPath = path.join(this.workDir, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, data);
    } catch (error) {
      throw new FileSystemError(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Download file from sandbox
   */
  async download(filePath: string): Promise<string | Buffer> {
    try {
      const fullPath = path.join(this.workDir, filePath);
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
