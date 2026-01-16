/**
 * File System mixin - adds fs capability to sandbox
 */

import type { Sandbox, SandboxConfig, SandboxConstructor, WithFS, FileSystem } from "../types.js";

/**
 * Add file system capability to sandbox
 */
export function withFS<T extends Sandbox>(
  Base: SandboxConstructor<T>
): SandboxConstructor<T & WithFS> {
  return class extends (Base as any) {
    fs: FileSystem;

    constructor(config: SandboxConfig) {
      super(config);

      // Build fs API using upload/download
      this.fs = {
        read: async (path: string): Promise<string> => {
          const data = await this.download(path);
          return typeof data === "string" ? data : data.toString("utf-8");
        },

        write: async (path: string, data: string): Promise<void> => {
          await this.upload(path, data);
        },

        list: async (path: string): Promise<string[]> => {
          const result = await this.shell(`ls -1 "${path}"`);
          if (!result.success) {
            return [];
          }
          return result.stdout.trim().split("\n").filter(Boolean);
        },

        exists: async (path: string): Promise<boolean> => {
          const result = await this.shell(`test -e "${path}" && echo "yes" || echo "no"`);
          return result.stdout.trim() === "yes";
        },

        delete: async (path: string): Promise<void> => {
          await this.shell(`rm -rf "${path}"`);
        },
      };
    }
  } as SandboxConstructor<T & WithFS>;
}
