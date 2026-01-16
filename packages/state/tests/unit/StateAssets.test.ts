/**
 * StateAssets unit tests
 */

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { createStateAssets, type StateAssets } from "../../src/StateAssets.js";
import { createStateStore, type StateStore } from "../../src/StateStore.js";

// Mock sandbox with upload/download
function createMockSandbox() {
  const files = new Map<string, Buffer>();

  return {
    upload: mock(async (data: Buffer, remotePath: string) => {
      files.set(remotePath, data);
    }),
    download: mock(async (remotePath: string): Promise<Buffer> => {
      const data = files.get(remotePath);
      if (!data) throw new Error(`File not found: ${remotePath}`);
      return data;
    }),
    _files: files,
  };
}

describe("StateAssets", () => {
  let assets: StateAssets;
  let store: StateStore;
  let sandbox: ReturnType<typeof createMockSandbox>;

  beforeEach(() => {
    store = createStateStore({ type: "memory" });
    sandbox = createMockSandbox();
    assets = createStateAssets({ sandbox, store });
  });

  describe("upload", () => {
    test("should upload buffer to sandbox", async () => {
      const data = Buffer.from("image content");

      await assets.uploadBuffer(data, "/app/image.png");

      expect(sandbox.upload).toHaveBeenCalled();
      expect(sandbox._files.get("/app/image.png")?.toString()).toBe("image content");
    });

    test("should store blob in StateStore", async () => {
      const data = Buffer.from("binary data");

      const ref = await assets.uploadBuffer(data, "/app/file.bin");

      // Blob should be stored with its ref
      const storedBlob = await store.loadBlob(ref);
      expect(storedBlob).not.toBeNull();
      expect(storedBlob!.toString()).toBe("binary data");
    });

    test("should return ref (hash) of the blob", async () => {
      const data = Buffer.from("content");

      const ref = await assets.uploadBuffer(data, "/app/file.txt");

      expect(ref).toMatch(/^sha256-/);
    });
  });

  describe("download", () => {
    test("should download buffer from sandbox", async () => {
      // First upload something
      sandbox._files.set("/app/data.bin", Buffer.from("downloaded content"));

      const data = await assets.downloadBuffer("/app/data.bin");

      expect(sandbox.download).toHaveBeenCalled();
      expect(data.toString()).toBe("downloaded content");
    });

    test("should store downloaded blob in StateStore", async () => {
      sandbox._files.set("/app/result.bin", Buffer.from("result data"));

      const ref = await assets.downloadBuffer("/app/result.bin", { persist: true });

      const storedBlob = await store.loadBlob(ref as string);
      expect(storedBlob).not.toBeNull();
    });
  });

  describe("list", () => {
    test("should list uploaded assets", async () => {
      await assets.uploadBuffer(Buffer.from("a"), "/app/a.txt");
      await assets.uploadBuffer(Buffer.from("b"), "/app/b.txt");

      const list = assets.list();

      expect(list).toContain("/app/a.txt");
      expect(list).toContain("/app/b.txt");
    });
  });

  describe("ref generation", () => {
    test("should generate consistent ref for same content", async () => {
      const data = Buffer.from("same content");

      const ref1 = await assets.uploadBuffer(data, "/app/file1.txt");
      const ref2 = await assets.uploadBuffer(data, "/app/file2.txt");

      expect(ref1).toBe(ref2);
    });

    test("should generate different ref for different content", async () => {
      const ref1 = await assets.uploadBuffer(Buffer.from("content A"), "/app/a.txt");
      const ref2 = await assets.uploadBuffer(Buffer.from("content B"), "/app/b.txt");

      expect(ref1).not.toBe(ref2);
    });
  });
});
