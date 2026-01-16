<div align="center">
  <h1>SandboX</h1>
  <p>
    <strong>Multi-language secure execution sandbox for AI Agents</strong>
  </p>
  <p>AI Agent 多语言安全执行沙箱</p>

  <p>
    <b>Multi-Language</b> · <b>Multi-Isolator</b> · <b>State Persistence</b>
  </p>
  <p>
    <b>多语言支持</b> · <b>多隔离策略</b> · <b>状态持久化</b>
  </p>

  <p>
    <a href="https://github.com/Deepractice/SandboX"><img src="https://img.shields.io/github/stars/Deepractice/SandboX?style=social" alt="Stars"/></a>
    <img src="https://visitor-badge.laobi.icu/badge?page_id=Deepractice.SandboX" alt="Views"/>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/SandboX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/sandboxxjs"><img src="https://img.shields.io/npm/v/sandboxxjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>

  <p>
    <a href="README.md"><strong>English</strong></a> |
    <a href="README.zh-CN.md">简体中文</a>
  </p>
</div>

---

## Why SandboX?

AI Agents need to execute code, but running untrusted code is dangerous. Different environments require different isolation strategies:

```typescript
// Development: fast iteration, low isolation
const result = child_process.execSync("node script.js");

// Container: stronger isolation (local Docker)
const container = await dockerClient.run("node script.js");

// Edge: deploy to edge network
const result = await cloudflare.containers.run("node script.js");
```

**SandboX solves this with a unified API**: one interface for all isolators, switch without changing code.

```typescript
import { createSandbox } from "sandboxxjs";

// Same code, different isolators
const sandbox = createSandbox({ isolator: "local", runtime: "node" }); // Fast dev
const sandbox = createSandbox({ isolator: "cloudflare", runtime: "node" }); // Container (local or edge)

// Execute code
const result = await sandbox.execute("console.log('Hello')");
await sandbox.destroy();
```

## Quick Start

```bash
npm install sandboxxjs
```

```typescript
import { createSandbox } from "sandboxxjs";

const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
});

// Execute code
const result = await sandbox.execute("1 + 1");
console.log(result.output); // "2"

// File system
await sandbox.fs.write("config.json", '{"debug": true}');
const content = await sandbox.fs.read("config.json");

// Environment variables
sandbox.env.set("API_KEY", "xxx");
const key = sandbox.env.get("API_KEY");

// Key-value storage
sandbox.storage.setItem("lastRun", Date.now().toString());

// Cleanup
await sandbox.destroy();
```

## Core Features

### Multi-Language Execution

```typescript
// Node.js
const nodeSandbox = createSandbox({ isolator: "local", runtime: "node" });
await nodeSandbox.execute("console.log(process.version)");

// Python
const pythonSandbox = createSandbox({ isolator: "local", runtime: "python" });
await pythonSandbox.execute("import sys; print(sys.version)");

// Shell
const shellSandbox = createSandbox({ isolator: "local" });
await shellSandbox.shell("echo $SHELL");
```

### State Layer (fs, env, storage)

```typescript
const sandbox = createSandbox({ isolator: "local", runtime: "node" });

// File system operations
await sandbox.fs.write("/app/data.json", '{"key": "value"}');
const content = await sandbox.fs.read("/app/data.json");
const exists = await sandbox.fs.exists("/app/data.json");
const files = await sandbox.fs.list("/app");
await sandbox.fs.delete("/app/data.json");

// Environment variables
sandbox.env.set("NODE_ENV", "production");
sandbox.env.get("NODE_ENV"); // "production"
sandbox.env.has("NODE_ENV"); // true
sandbox.env.delete("NODE_ENV");
sandbox.env.all(); // { ... }

// Key-value storage
sandbox.storage.setItem("token", "abc123");
sandbox.storage.getItem("token"); // "abc123"
sandbox.storage.removeItem("token");
sandbox.storage.clear();
```

### State Recording (Binlog Pattern)

Record all state operations for replay and persistence:

```typescript
// Enable recording
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: { enableRecord: true },
});

// Operations are recorded automatically
await sandbox.fs.write("config.json", "{}");
sandbox.env.set("DEBUG", "true");
sandbox.storage.setItem("version", "1.0.0");

// Get recorded operations
const log = sandbox.getStateLog();
console.log(log.toJSON());
// [
//   { op: "fs.write", args: { path: "config.json", data: "{}" } },
//   { op: "env.set", args: { key: "DEBUG", value: "true" } },
//   { op: "storage.set", args: { key: "version", value: "1.0.0" } }
// ]
```

### State Initialization (Replay)

Pre-configure sandbox from a StateLog:

```typescript
import { buildStateLog, createSandbox } from "sandboxxjs";

// Build initialization log
const initLog = buildStateLog()
  .fs.write("config.json", '{"env": "prod"}')
  .env.set("NODE_ENV", "production")
  .storage.set("initialized", "true");

// Create sandbox with pre-configured state
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: { initializeLog: initLog },
});

// State is already set up
const config = await sandbox.fs.read("config.json"); // '{"env": "prod"}'
sandbox.env.get("NODE_ENV"); // "production"
```

### State Persistence

State operations are automatically persisted using **AOF (Append-Only File)** pattern:

```typescript
import { loadStateLog } from "sandboxxjs";

// Enable recording (auto-persist)
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: { enableRecord: true }, // Auto-persists to disk
});

console.log(sandbox.id); // "sandbox-V1StGXR8_Z5jdHi"

// Operations are automatically appended to:
// ~/.agentvm/sandbox/sandbox-{id}/state.jsonl
await sandbox.fs.write("config.json", "{}");
sandbox.env.set("KEY", "value");

// Export state as JSON (optional - already persisted)
const log = sandbox.getStateLog();
const json = log.toJSON();

// Restore from JSON
const restoredLog = loadStateLog(json);
const newSandbox = createSandbox({
  isolator: "local",
  runtime: "node",
  state: { initializeLog: restoredLog },
});
```

**Storage:**

- Format: JSON Lines (`.jsonl`) for true append-only operations
- Location: `~/.agentvm/sandbox/{sandbox-id}/state.jsonl`
- Testing: Use `store: "memory"` to disable file persistence

## How it Works

### Architecture

```
createSandbox({ isolator, runtime, state? })
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌────────┐    ┌──────────┐    ┌────────────┐
│ Shell  │    │  Node.js │    │   Python   │
│Sandbox │    │  Sandbox │    │  Sandbox   │
└────────┘    └──────────┘    └────────────┘
    │               │               │
    │         ┌─────┴─────┐         │
    │         │   State   │         │
    │         │  Layer    │         │
    │         ├───────────┤         │
    │         │ fs        │         │
    │         │ env       │         │
    │         │ storage   │         │
    │         │ (record)  │         │
    │         └─────┬─────┘         │
    │               │               │
    └───────────────┼───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │        Isolator Layer         │
    ├───────────────┬───────────────┤
    │     Local     │  Cloudflare   │
    │   (process)   │  (container)  │
    └───────────────┴───────────────┘
```

### Isolators

| Isolator       | Status | Isolation Level | Startup Time | Requirements   | Best For             |
| -------------- | ------ | --------------- | ------------ | -------------- | -------------------- |
| **local**      | ✅     | Process         | ~10ms        | None           | Development          |
| **cloudflare** | ✅     | Container       | ~100ms       | Docker (local) | Local + Edge deploy  |
| **e2b**        | 🚧     | MicroVM         | ~150ms       | E2B account    | Production (Planned) |
| **docker**     | 🚧     | Container       | ~500ms       | Docker         | Custom (Planned)     |

**Cloudflare Isolator:**

- Can run **locally** using Docker containers (same API as cloud deployment)
- Can deploy to **Cloudflare Workers** for edge execution
- Requires Docker daemon when running locally

```typescript
// Switch isolator without changing code
const dev = createSandbox({ isolator: "local", runtime: "node" });
const cloudflare = createSandbox({ isolator: "cloudflare", runtime: "node" }); // Needs Docker
// Same API: execute(), fs, env, storage
```

### State Layer

| Component      | Description             | Persistence       |
| -------------- | ----------------------- | ----------------- |
| **fs**         | File system (via shell) | StateLog + Store  |
| **env**        | Environment variables   | StateLog          |
| **storage**    | Key-value storage       | StateLog          |
| **StateLog**   | Operation recording     | JSON serializable |
| **StateStore** | Persistence backend     | ~/.agentvm/       |

## Configuration

```typescript
interface SandboxConfig {
  // Isolator (required)
  isolator: "local" | "cloudflare" | "e2b" | "docker";

  // Runtime (default: "shell")
  runtime?: "shell" | "node" | "python";

  // State configuration
  state?: {
    env?: Record<string, string>; // Initial env vars
    initializeLog?: StateLog; // Pre-configure from log
    enableRecord?: boolean; // Enable recording (= auto-persist)
    store?: "resourcex" | "memory"; // Storage backend (default: "resourcex")
  };

  // Resource limits
  limits?: {
    timeout?: number; // ms (default: 30000)
    memory?: number; // bytes
    cpu?: number; // percentage
  };

  // Runtime-specific
  node?: { packageManager?: "npm" | "yarn" | "pnpm" | "bun" };
  python?: { version?: string; useVenv?: boolean };
}
```

## API Reference

### Base Sandbox

| Method           | Description               |
| ---------------- | ------------------------- |
| `shell(command)` | Execute shell command     |
| `destroy()`      | Cleanup sandbox resources |

### Node/Python Sandbox

| Method                        | Description             |
| ----------------------------- | ----------------------- |
| `execute(code)`               | Execute code in runtime |
| `fs.read(path)`               | Read file content       |
| `fs.write(path, data)`        | Write file content      |
| `fs.list(path)`               | List directory          |
| `fs.exists(path)`             | Check file exists       |
| `fs.delete(path)`             | Delete file             |
| `env.get(key)`                | Get env variable        |
| `env.set(key, value)`         | Set env variable        |
| `env.has(key)`                | Check env exists        |
| `env.delete(key)`             | Delete env variable     |
| `env.all()`                   | Get all env variables   |
| `storage.getItem(key)`        | Get storage value       |
| `storage.setItem(key, value)` | Set storage value       |
| `storage.removeItem(key)`     | Remove storage value    |
| `storage.clear()`             | Clear all storage       |
| `getStateLog()`               | Get recorded operations |

### StateLog

| Method                        | Description                |
| ----------------------------- | -------------------------- |
| `buildStateLog()`             | Create new StateLog        |
| `loadStateLog(json)`          | Load from JSON             |
| `log.fs.write(path, data)`    | Record fs.write            |
| `log.env.set(key, value)`     | Record env.set             |
| `log.storage.set(key, value)` | Record storage.set         |
| `log.toJSON()`                | Serialize to JSON          |
| `log.compact()`               | Merge redundant operations |

## Packages

| Package                                 | Description         |
| --------------------------------------- | ------------------- |
| [`sandboxxjs`](./packages/sandboxxjs)   | Main API            |
| [`@sandboxxjs/core`](./packages/core)   | Core implementation |
| [`@sandboxxjs/state`](./packages/state) | State management    |
| [`@sandboxxjs/cli`](./packages/cli)     | CLI tool            |

## Ecosystem

Part of the [Deepractice](https://github.com/Deepractice) AI Agent infrastructure:

- **[PromptX](https://github.com/Deepractice/PromptX)** - AI Agent prompt engineering platform
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent runtime platform
- **[ResourceX](https://github.com/Deepractice/ResourceX)** - Unified resource manager (ARP protocol)
- **[ToolX](https://github.com/Deepractice/ToolX)** - Tool integration (Build System for SandboX)
- **[UIX](https://github.com/Deepractice/UIX)** - AI-to-UI protocol layer

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE)

---

<div align="center">
  <p>
    Built with ❤️ by <a href="https://github.com/Deepractice">Deepractice</a>
  </p>
</div>
