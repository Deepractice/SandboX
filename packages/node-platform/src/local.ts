/**
 * NodeLocalSandbox — local execution via spawn + fs.
 * Default cwd: ~/.deepractice/sandbox/<sandboxId>/
 */

import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExecOptions, ExecResult, FileInfo, ProcessInfo, Sandbox } from "@sandboxxjs/core";

export class NodeLocalSandbox implements Sandbox {
  readonly rootDir: string;
  private processes = new Map<string, { pid: number; command: string; status: string }>();

  constructor(sandboxId?: string) {
    const id = sandboxId ?? `local-${Date.now()}`;
    this.rootDir = join(homedir(), ".deepractice", "sandbox", id);
  }

  async exec(command: string, options?: ExecOptions): Promise<ExecResult> {
    await this.ensureDir();
    return new Promise((resolve) => {
      const child = spawn("sh", ["-c", command], {
        cwd: options?.cwd ?? this.rootDir,
        timeout: options?.timeout ?? 60_000,
        env: { ...process.env },
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
        resolve({ stdout, stderr, exitCode: exitCode ?? 1, success: (exitCode ?? 1) === 0 });
      });

      child.on("error", (err: Error) => {
        resolve({ stdout, stderr: err.message, exitCode: 1, success: false });
      });
    });
  }

  async startProcess(command: string, options?: { cwd?: string }): Promise<ProcessInfo> {
    await this.ensureDir();
    const child = spawn("sh", ["-c", command], {
      cwd: options?.cwd ?? this.rootDir,
      detached: true,
      stdio: "ignore",
      env: { ...process.env },
    });
    child.unref();

    const procId = `proc_${child.pid}`;
    this.processes.set(procId, { pid: child.pid!, command, status: "running" });

    child.on("close", () => {
      const proc = this.processes.get(procId);
      if (proc) proc.status = "exited";
    });

    return { id: procId, pid: child.pid!, command, status: "running" };
  }

  async killProcess(processId: string): Promise<void> {
    const proc = this.processes.get(processId);
    if (proc?.pid) {
      try {
        process.kill(proc.pid, "SIGTERM");
      } catch {}
      proc.status = "killed";
    }
  }

  async listProcesses(): Promise<ProcessInfo[]> {
    return Array.from(this.processes.entries()).map(([id, p]) => ({
      id,
      pid: p.pid,
      command: p.command,
      status: p.status,
    }));
  }

  async readFile(path: string): Promise<string> {
    return readFile(this.resolve(path), "utf-8");
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.ensureDir();
    await writeFile(this.resolve(path), content, "utf-8");
  }

  async listFiles(path: string): Promise<FileInfo[]> {
    const entries = await readdir(this.resolve(path), { withFileTypes: true });
    return Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(this.resolve(path), entry.name);
        const type: FileInfo["type"] = entry.isDirectory()
          ? "directory"
          : entry.isSymbolicLink()
            ? "symlink"
            : "file";
        let size: number | undefined;
        if (type === "file") {
          try {
            const s = await stat(fullPath);
            size = s.size;
          } catch {}
        }
        return { name: entry.name, type, size };
      })
    );
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await mkdir(this.resolve(path), { recursive: options?.recursive ?? true });
  }

  async deleteFile(path: string): Promise<void> {
    await rm(this.resolve(path), { recursive: true, force: true });
  }

  async destroy(): Promise<void> {
    for (const [id] of this.processes) {
      await this.killProcess(id);
    }
    this.processes.clear();
  }

  private resolve(path: string): string {
    // If absolute, use as-is; otherwise resolve relative to rootDir
    return path.startsWith("/") ? path : join(this.rootDir, path);
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }
}
