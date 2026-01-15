/**
 * Local Isolator using child_process via execa
 */

import { execa } from "execa";
import * as fs from "fs/promises";
import * as path from "path";
import { Isolator } from "./Isolator.js";
import type { ExecuteOptions, ExecuteResult, FileSystem } from "../types.js";
import { ExecutionError, TimeoutError, FileSystemError } from "../errors.js";

export class LocalIsolator extends Isolator {
  private workDir: string;
  private runtime: string;

  constructor(runtime: string = "node") {
    super();
    this.runtime = runtime;
    // Create temp work directory
    this.workDir = path.join(process.cwd(), ".sandbox", `session-${Date.now()}`);
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const { code, env = {}, timeout = 30000 } = options;
    const startTime = Date.now();

    // Ensure work directory exists
    await fs.mkdir(this.workDir, { recursive: true });

    try {
      // Build command based on runtime
      const command = this.buildCommand(code);

      // Execute with execa
      const result = await execa(command[0], command.slice(1), {
        cwd: this.workDir,
        env: { ...process.env, ...env },
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB output limit
        reject: true, // Throw on timeout/error
        all: true, // Combine stdout and stderr
      });

      return {
        success: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode || 0,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      // execa throws on timeout or spawn errors
      if (error.timedOut) {
        throw new TimeoutError(`Execution timed out after ${timeout}ms`);
      }

      // Non-zero exit code
      if (error.exitCode !== undefined) {
        return {
          success: false,
          stdout: error.stdout || "",
          stderr: error.stderr || "",
          exitCode: error.exitCode,
          metadata: {
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        };
      }

      throw new ExecutionError(`Execution failed: ${error.message}`);
    }
  }

  /**
   * Build command array based on runtime
   */
  private buildCommand(code: string): string[] {
    switch (this.runtime) {
      case "node":
        return ["node", "--eval", code];
      case "python":
        return ["python3", "-c", code];
      case "bash":
        return ["bash", "-c", code];
      default:
        throw new ExecutionError(`Unsupported runtime: ${this.runtime}`);
    }
  }

  getFileSystem(): FileSystem {
    return {
      write: async (filePath: string, data: string): Promise<void> => {
        try {
          const fullPath = path.join(this.workDir, filePath);
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, data, "utf-8");
        } catch (error) {
          throw new FileSystemError(`Failed to write file: ${(error as Error).message}`);
        }
      },

      read: async (filePath: string): Promise<string> => {
        try {
          const fullPath = path.join(this.workDir, filePath);
          return await fs.readFile(fullPath, "utf-8");
        } catch (error) {
          throw new FileSystemError(`Failed to read file: ${(error as Error).message}`);
        }
      },

      list: async (dirPath: string): Promise<string[]> => {
        try {
          const fullPath = path.join(this.workDir, dirPath);
          return await fs.readdir(fullPath);
        } catch (error) {
          throw new FileSystemError(`Failed to list directory: ${(error as Error).message}`);
        }
      },

      delete: async (filePath: string): Promise<void> => {
        try {
          const fullPath = path.join(this.workDir, filePath);
          await fs.rm(fullPath, { recursive: true, force: true });
        } catch (error) {
          throw new FileSystemError(`Failed to delete: ${(error as Error).message}`);
        }
      },

      exists: async (filePath: string): Promise<boolean> => {
        try {
          const fullPath = path.join(this.workDir, filePath);
          await fs.access(fullPath);
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  async destroy(): Promise<void> {
    try {
      await fs.rm(this.workDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Failed to clean up work directory: ${(error as Error).message}`);
    }
  }
}
