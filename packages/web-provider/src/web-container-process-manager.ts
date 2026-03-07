import type { ProcessInfo, SandboxProcessManager } from "@sandboxxjs/core";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

export class WebContainerProcessManager implements SandboxProcessManager {
  private processes = new Map<
    string,
    { proc: WebContainerProcess; command: string; status: string }
  >();
  private nextId = 1;

  constructor(private wc: WebContainer) {}

  async start(command: string, options?: { cwd?: string }): Promise<ProcessInfo> {
    const proc = await this.wc.spawn("jsh", ["-c", command], {
      cwd: options?.cwd,
    });

    const procId = `proc_${this.nextId++}`;
    this.processes.set(procId, { proc, command, status: "running" });

    proc.exit.then(() => {
      const entry = this.processes.get(procId);
      if (entry) entry.status = "exited";
    });

    return { id: procId, command, status: "running" };
  }

  async kill(processId: string): Promise<void> {
    const entry = this.processes.get(processId);
    if (entry) {
      entry.proc.kill();
      entry.status = "killed";
    }
  }

  async list(): Promise<ProcessInfo[]> {
    return Array.from(this.processes.entries()).map(([id, entry]) => ({
      id,
      command: entry.command,
      status: entry.status,
    }));
  }
}
