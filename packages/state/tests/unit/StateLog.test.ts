/**
 * StateLog unit tests
 */

import { describe, test, expect } from "bun:test";
import { StateLog } from "../../src/StateLog.js";

describe("StateLog", () => {
  describe("constructor", () => {
    test("should create empty StateLog", () => {
      const log = new StateLog();
      expect(log.getEntries()).toEqual([]);
    });
  });

  describe("fs operations", () => {
    test("should record fs.write operation", () => {
      const log = new StateLog();
      log.fs.write("/app/config.json", '{"env":"prod"}');

      const entries = log.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "fs.write",
        args: { path: "/app/config.json", data: '{"env":"prod"}' },
      });
    });

    test("should record fs.delete operation", () => {
      const log = new StateLog();
      log.fs.delete("/tmp/cache");

      const entries = log.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "fs.delete",
        args: { path: "/tmp/cache" },
      });
    });
  });

  describe("env operations", () => {
    test("should record env.set operation", () => {
      const log = new StateLog();
      log.env.set("NODE_ENV", "production");

      const entries = log.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "env.set",
        args: { key: "NODE_ENV", value: "production" },
      });
    });

    test("should record env.delete operation", () => {
      const log = new StateLog();
      log.env.delete("TEMP_VAR");

      const entries = log.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "env.delete",
        args: { key: "TEMP_VAR" },
      });
    });
  });

  describe("storage operations", () => {
    test("should record storage.set operation", () => {
      const log = new StateLog();
      log.storage.set("version", "1.0.0");

      const entries = log.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "storage.set",
        args: { key: "version", value: "1.0.0" },
      });
    });

    test("should record storage.delete operation", () => {
      const log = new StateLog();
      log.storage.delete("temp");

      const entries = log.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "storage.delete",
        args: { key: "temp" },
      });
    });

    test("should record storage.clear operation", () => {
      const log = new StateLog();
      log.storage.clear();

      const entries = log.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "storage.clear",
        args: {},
      });
    });
  });

  describe("chaining", () => {
    test("should support method chaining", () => {
      const log = new StateLog().fs
        .write("/app/config.json", "{}")
        .env.set("NODE_ENV", "production")
        .storage.set("version", "1.0.0");

      const entries = log.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].op).toBe("fs.write");
      expect(entries[1].op).toBe("env.set");
      expect(entries[2].op).toBe("storage.set");
    });
  });

  describe("serialization", () => {
    test("should serialize to JSON", () => {
      const log = new StateLog().fs.write("/a.txt", "hello").env.set("KEY", "value");

      const json = log.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].op).toBe("fs.write");
      expect(parsed[1].op).toBe("env.set");
    });

    test("should deserialize from JSON", () => {
      const json = JSON.stringify([
        { op: "fs.write", args: { path: "/a.txt", data: "hello" } },
        { op: "env.set", args: { key: "KEY", value: "value" } },
      ]);

      const log = StateLog.fromJSON(json);
      const entries = log.getEntries();

      expect(entries).toHaveLength(2);
      expect(entries[0].op).toBe("fs.write");
      expect(entries[1].op).toBe("env.set");
    });
  });

  describe("compact", () => {
    test("should merge multiple writes to same path", () => {
      const log = new StateLog().fs
        .write("/a.txt", "v1")
        .fs.write("/a.txt", "v2")
        .fs.write("/a.txt", "v3");

      const compacted = log.compact();
      const entries = compacted.getEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "fs.write",
        args: { path: "/a.txt", data: "v3" },
      });
    });

    test("should remove write if followed by delete", () => {
      const log = new StateLog().fs.write("/a.txt", "hello").fs.delete("/a.txt");

      const compacted = log.compact();
      const entries = compacted.getEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0].op).toBe("fs.delete");
    });

    test("should merge multiple env.set to same key", () => {
      const log = new StateLog().env.set("KEY", "v1").env.set("KEY", "v2").env.set("KEY", "v3");

      const compacted = log.compact();
      const entries = compacted.getEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        op: "env.set",
        args: { key: "KEY", value: "v3" },
      });
    });
  });
});
