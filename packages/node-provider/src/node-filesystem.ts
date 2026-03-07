import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FileInfo, SandboxFileSystem } from "@sandboxxjs/core";

export class NodeFileSystem implements SandboxFileSystem {
  async readFile(path: string): Promise<string> {
    return readFile(path, "utf-8");
  }

  async writeFile(path: string, content: string): Promise<void> {
    await writeFile(path, content, "utf-8");
  }

  async listFiles(path: string): Promise<FileInfo[]> {
    const entries = await readdir(path, { withFileTypes: true });
    return Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(path, entry.name);
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
    await mkdir(path, { recursive: options?.recursive ?? true });
  }

  async deleteFile(path: string): Promise<void> {
    await rm(path, { recursive: true, force: true });
  }
}
