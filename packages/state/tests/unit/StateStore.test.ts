/**
 * StateStore unit tests
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createStateStore, type StateStore } from "../../src/StateStore.js";
import { buildStateLog } from "../../src/StateLog.js";

describe("StateStore (memory)", () => {
  let store: StateStore;

  beforeEach(() => {
    // Use memory store for testing
    store = createStateStore({ type: "memory" });
  });

  describe("Log operations", () => {
    test("should save and load StateLog", async () => {
      const log = buildStateLog()
        .fs.write("/app/config.json", '{"env":"prod"}')
        .env.set("NODE_ENV", "production");

      await store.saveLog("sandbox-123", log.toJSON());

      const loaded = await store.loadLog("sandbox-123");
      expect(loaded).not.toBeNull();
      expect(JSON.parse(loaded!)).toHaveLength(2);
    });

    test("should return null for non-existent log", async () => {
      const loaded = await store.loadLog("non-existent");
      expect(loaded).toBeNull();
    });

    test("should delete log", async () => {
      const log = buildStateLog().env.set("KEY", "value");
      await store.saveLog("to-delete", log.toJSON());

      await store.deleteLog("to-delete");

      const loaded = await store.loadLog("to-delete");
      expect(loaded).toBeNull();
    });

    test("should list all log keys", async () => {
      await store.saveLog("log-1", "{}");
      await store.saveLog("log-2", "{}");
      await store.saveLog("log-3", "{}");

      const keys = await store.listLogs();
      expect(keys).toContain("log-1");
      expect(keys).toContain("log-2");
      expect(keys).toContain("log-3");
    });
  });

  describe("Blob operations", () => {
    test("should save and load blob", async () => {
      const data = Buffer.from("binary content");
      const ref = "sha256-abc123";

      await store.saveBlob(ref, data);

      const loaded = await store.loadBlob(ref);
      expect(loaded).not.toBeNull();
      expect(loaded!.toString()).toBe("binary content");
    });

    test("should return null for non-existent blob", async () => {
      const loaded = await store.loadBlob("non-existent");
      expect(loaded).toBeNull();
    });

    test("should delete blob", async () => {
      const data = Buffer.from("to delete");
      await store.saveBlob("to-delete", data);

      await store.deleteBlob("to-delete");

      const loaded = await store.loadBlob("to-delete");
      expect(loaded).toBeNull();
    });
  });

  describe("Integration", () => {
    test("should store log with blob references", async () => {
      // Simulate storing a StateLog with asset references
      const blobData = Buffer.from("image content");
      const blobRef = "sha256-image123";

      // Save blob first
      await store.saveBlob(blobRef, blobData);

      // Save log with reference
      // Note: assets.upload will be added to opRegistry later
      const logData = JSON.stringify([
        { op: "assets.upload", args: { remotePath: "/app/image.png", ref: blobRef } },
      ]);
      await store.saveLog("sandbox-with-assets", logData);

      // Verify both can be loaded
      const loadedLog = await store.loadLog("sandbox-with-assets");
      const loadedBlob = await store.loadBlob(blobRef);

      expect(loadedLog).not.toBeNull();
      expect(loadedBlob).not.toBeNull();
    });
  });
});

describe("StateStore (resourcex)", () => {
  let store: StateStore;

  beforeEach(async () => {
    // Use resourcex store with deepractice:// transport
    store = createStateStore({ type: "resourcex" });
  });

  afterEach(async () => {
    // Cleanup test data from ~/.deepractice/sandbox/
    await store.deleteLog("sandbox-123");
    await store.deleteLog("to-delete");
    await store.deleteLog("persistent-key");
    await store.deleteBlob("sha256-abc123");
    await store.deleteBlob("to-delete");
    await store.deleteBlob("persistent-blob");
  });

  describe("Log operations", () => {
    test("should save and load StateLog to file", async () => {
      const log = buildStateLog()
        .fs.write("/app/config.json", '{"env":"prod"}')
        .env.set("NODE_ENV", "production");

      await store.saveLog("sandbox-123", log.toJSON());

      const loaded = await store.loadLog("sandbox-123");
      expect(loaded).not.toBeNull();
      expect(JSON.parse(loaded!)).toHaveLength(2);
    });

    test("should return null for non-existent log", async () => {
      const loaded = await store.loadLog("non-existent");
      expect(loaded).toBeNull();
    });

    test("should delete log file", async () => {
      const log = buildStateLog().env.set("KEY", "value");
      await store.saveLog("to-delete", log.toJSON());

      await store.deleteLog("to-delete");

      const loaded = await store.loadLog("to-delete");
      expect(loaded).toBeNull();
    });
  });

  describe("Blob operations", () => {
    test("should save and load blob to file", async () => {
      const data = Buffer.from("binary content");
      const ref = "sha256-abc123";

      await store.saveBlob(ref, data);

      const loaded = await store.loadBlob(ref);
      expect(loaded).not.toBeNull();
      expect(loaded!.toString()).toBe("binary content");
    });

    test("should return null for non-existent blob", async () => {
      const loaded = await store.loadBlob("non-existent");
      expect(loaded).toBeNull();
    });

    test("should delete blob file", async () => {
      const data = Buffer.from("to delete");
      await store.saveBlob("to-delete", data);

      await store.deleteBlob("to-delete");

      const loaded = await store.loadBlob("to-delete");
      expect(loaded).toBeNull();
    });
  });

  describe("Persistence", () => {
    test("should persist data across store instances", async () => {
      // Save with first store instance
      await store.saveLog("persistent-key", '{"test":true}');
      await store.saveBlob("persistent-blob", Buffer.from("persistent data"));

      // Create new store instance (same deepractice:// location)
      const store2 = createStateStore({ type: "resourcex" });

      // Verify data is accessible
      const loadedLog = await store2.loadLog("persistent-key");
      const loadedBlob = await store2.loadBlob("persistent-blob");

      expect(loadedLog).toBe('{"test":true}');
      expect(loadedBlob?.toString()).toBe("persistent data");
    });
  });
});
