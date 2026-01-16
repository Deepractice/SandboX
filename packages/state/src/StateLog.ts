/**
 * StateLog - Records state operations for replay and persistence
 */

export interface StateLogEntry {
  op: string;
  args: Record<string, unknown>;
}

export class StateLog {
  private entries: StateLogEntry[] = [];

  /**
   * File system operations
   */
  fs = {
    write: (path: string, data: string): StateLog => {
      this.entries.push({ op: "fs.write", args: { path, data } });
      return this;
    },
    delete: (path: string): StateLog => {
      this.entries.push({ op: "fs.delete", args: { path } });
      return this;
    },
  };

  /**
   * Environment variable operations
   */
  env = {
    set: (key: string, value: string): StateLog => {
      this.entries.push({ op: "env.set", args: { key, value } });
      return this;
    },
    delete: (key: string): StateLog => {
      this.entries.push({ op: "env.delete", args: { key } });
      return this;
    },
  };

  /**
   * Storage operations
   */
  storage = {
    set: (key: string, value: string): StateLog => {
      this.entries.push({ op: "storage.set", args: { key, value } });
      return this;
    },
    delete: (key: string): StateLog => {
      this.entries.push({ op: "storage.delete", args: { key } });
      return this;
    },
    clear: (): StateLog => {
      this.entries.push({ op: "storage.clear", args: {} });
      return this;
    },
  };

  /**
   * Get all entries
   */
  getEntries(): StateLogEntry[] {
    return [...this.entries];
  }

  /**
   * Serialize to JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.entries);
  }

  /**
   * Deserialize from JSON string
   */
  static fromJSON(json: string): StateLog {
    const log = new StateLog();
    log.entries = JSON.parse(json);
    return log;
  }

  /**
   * Compact the log by merging redundant operations
   */
  compact(): StateLog {
    const result = new StateLog();
    const fsState = new Map<string, StateLogEntry>();
    const envState = new Map<string, StateLogEntry>();
    const storageState = new Map<string, StateLogEntry>();
    let storageClear: StateLogEntry | null = null;

    for (const entry of this.entries) {
      const { op, args } = entry;

      if (op === "fs.write") {
        fsState.set(args.path as string, entry);
      } else if (op === "fs.delete") {
        fsState.set(args.path as string, entry);
      } else if (op === "env.set") {
        envState.set(args.key as string, entry);
      } else if (op === "env.delete") {
        envState.set(args.key as string, entry);
      } else if (op === "storage.set") {
        storageState.set(args.key as string, entry);
      } else if (op === "storage.delete") {
        storageState.set(args.key as string, entry);
      } else if (op === "storage.clear") {
        storageClear = entry;
        storageState.clear();
      }
    }

    // Rebuild entries in order: fs, env, storage
    for (const entry of fsState.values()) {
      result.entries.push(entry);
    }
    for (const entry of envState.values()) {
      result.entries.push(entry);
    }
    if (storageClear) {
      result.entries.push(storageClear);
    }
    for (const entry of storageState.values()) {
      result.entries.push(entry);
    }

    return result;
  }
}
