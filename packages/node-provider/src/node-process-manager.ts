import { spawn } from "node:child_process";
import type { ProcessInfo, SandboxProcessManager } from "@sandboxxjs/core";

export class NodeProcessManager implements SandboxProcessManager {
  private processes = new Map<string, { pid: number; command: string; status: string }>();
  private defaultCwd: string;

  constructor(options?: { cwd?: string }) {
    this.defaultCwd = options?.cwd ?? "/workspace";
  }

  async start(command: string, options?: { cwd?: string }): Promise<ProcessInfo> {
    const child = spawn("sh", ["-c", command], {
      cwd: options?.cwd ?? this.defaultCwd,
      detached: true,
      stdio: "ignore",
      env: { ...process.env, HOME: "/root" },
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

  async kill(processId: string): Promise<void> {
    const proc = this.processes.get(processId);
    if (proc?.pid) {
      try {
        process.kill(proc.pid, "SIGTERM");
      } catch {}
      proc.status = "killed";
    }
  }

  async list(): Promise<ProcessInfo[]> {
    return Array.from(this.processes.entries()).map(([id, p]) => ({
      id,
      pid: p.pid,
      command: p.command,
      status: p.status,
    }));
  }
}
