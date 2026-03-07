import { spawn } from "node:child_process";
import type { ExecOptions, ExecResult, SandboxExecutor } from "@sandboxxjs/core";

export class NodeExecutor implements SandboxExecutor {
  private defaultCwd: string;

  constructor(options?: { cwd?: string }) {
    this.defaultCwd = options?.cwd ?? "/workspace";
  }

  exec(command: string, options?: ExecOptions): Promise<ExecResult> {
    return new Promise((resolve) => {
      const child = spawn("sh", ["-c", command], {
        cwd: options?.cwd ?? this.defaultCwd,
        timeout: options?.timeout ?? 60_000,
        env: { ...process.env, HOME: "/root" },
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (exitCode: number | null) => {
        resolve({
          stdout,
          stderr,
          exitCode: exitCode ?? 1,
          success: (exitCode ?? 1) === 0,
        });
      });

      child.on("error", (err: Error) => {
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
          success: false,
        });
      });
    });
  }
}
