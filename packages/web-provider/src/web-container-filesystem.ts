import type { FileInfo, SandboxFileSystem } from "@sandboxxjs/core";
import type { WebContainer } from "@webcontainer/api";

export class WebContainerFileSystem implements SandboxFileSystem {
  constructor(private wc: WebContainer) {}

  async readFile(path: string): Promise<string> {
    return this.wc.fs.readFile(path, "utf-8");
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.wc.fs.writeFile(path, content);
  }

  async listFiles(path: string): Promise<FileInfo[]> {
    const entries = await this.wc.fs.readdir(path, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? ("directory" as const) : ("file" as const),
    }));
  }

  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    if (options?.recursive === false) {
      await this.wc.fs.mkdir(path);
    } else {
      await this.wc.fs.mkdir(path, { recursive: true });
    }
  }

  async deleteFile(path: string): Promise<void> {
    await this.wc.fs.rm(path, { recursive: true, force: true });
  }
}
