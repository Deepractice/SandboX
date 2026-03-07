import type { ExecOptions, ExecResult, SandboxExecutor } from "@sandboxxjs/core";
import type { WebContainer } from "./types";

export class WebContainerExecutor implements SandboxExecutor {
  constructor(private wc: WebContainer) {}

  async exec(command: string, options?: ExecOptions): Promise<ExecResult> {
    try {
      const args = ["-c", command];
      const proc = await this.wc.spawn("jsh", args, {
        cwd: options?.cwd,
      });

      let stdout = "";
      const reader = proc.output.getReader();

      const readOutput = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          stdout += value;
        }
      };

      const timeout = options?.timeout ?? 60_000;
      const exitCode = await Promise.race([
        readOutput().then(() => proc.exit),
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            proc.kill();
            reject(new Error("Timeout"));
          }, timeout)
        ),
      ]);

      return {
        stdout: stdout.trim(),
        stderr: "",
        exitCode,
        success: exitCode === 0,
      };
    } catch (err) {
      return {
        stdout: "",
        stderr: err instanceof Error ? err.message : "Command failed",
        exitCode: 1,
        success: false,
      };
    }
  }
}
