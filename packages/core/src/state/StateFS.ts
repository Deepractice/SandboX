/**
 * StateFS - File system state implementation
 * Operates on sandbox via shell commands
 */

import type { FileSystem, Sandbox } from "../types.js";
import { FileSystemError } from "../errors.js";

export class StateFS implements FileSystem {
  constructor(private sandbox: Sandbox) {}

  async read(path: string): Promise<string> {
    const result = await this.sandbox.shell(`cat "${path}"`);
    if (!result.success) {
      throw new FileSystemError(`Failed to read file: ${path}`);
    }
    return result.stdout;
  }

  async write(path: string, data: string): Promise<void> {
    // Ensure parent directory exists
    const dir = path.substring(0, path.lastIndexOf("/"));
    if (dir) {
      await this.sandbox.shell(`mkdir -p "${dir}"`);
    }

    // Write file using heredoc
    const result = await this.sandbox.shell(
      `cat > "${path}" << 'SANDBOX_EOF'\n${data}\nSANDBOX_EOF`
    );
    if (!result.success) {
      throw new FileSystemError(`Failed to write file: ${path}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    const result = await this.sandbox.shell(`test -e "${path}" && echo "yes" || echo "no"`);
    return result.stdout.trim() === "yes";
  }

  async delete(path: string): Promise<void> {
    await this.sandbox.shell(`rm -rf "${path}"`);
  }

  async list(path: string): Promise<string[]> {
    const result = await this.sandbox.shell(`ls -1 "${path}" 2>/dev/null`);
    if (!result.success || !result.stdout.trim()) {
      return [];
    }
    return result.stdout.trim().split("\n").filter(Boolean);
  }
}
