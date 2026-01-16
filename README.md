<div align="center">
  <h1>SandboX</h1>
  <p>
    <strong>Multi-language secure execution sandbox for AI Agents</strong>
  </p>
  <p>AI Agent multi-language secure execution sandbox</p>

  <p>
    <b>Multi-Language</b> · <b>Multi-Isolator</b> · <b>Secure by Default</b>
  </p>

  <p>
    <a href="https://github.com/Deepractice/SandboX"><img src="https://img.shields.io/github/stars/Deepractice/SandboX?style=social" alt="Stars"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/SandboX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/sandboxxjs"><img src="https://img.shields.io/npm/v/sandboxxjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>
</div>

---

## What is SandboX?

**SandboX** provides secure, isolated execution environments for running untrusted code from AI Agents.

- **Multi-Language**: Shell, Node.js, Python
- **Multi-Isolator**: Local (child_process), Cloudflare, E2B (microVM), Docker
- **Pluggable Architecture**: Switch isolators without changing code
- **Mixin-based Extensions**: Compose capabilities as needed

## Installation

```bash
npm install sandboxxjs
# or
bun add sandboxxjs
```

## Quick Start

### Base Sandbox (4 Core APIs)

```typescript
import { createSandbox } from "sandboxxjs";

// Create a base sandbox
const sandbox = createSandbox({ isolator: "local" });

// Execute shell commands
const result = await sandbox.shell("echo 'Hello World'");
console.log(result.stdout); // "Hello World"

// Upload file to sandbox
await sandbox.upload("/data/input.txt", "Hello from outside");

// Download file from sandbox
const content = await sandbox.download("/data/input.txt");

// Cleanup
await sandbox.destroy();
```

### Node.js Sandbox

```typescript
const sandbox = createSandbox({
  isolator: "local",
  runtime: "node",
});

// Execute Node.js code directly
const result = await sandbox.execute("console.log('Hello from Node')");

// File system operations via mixin
await sandbox.fs.write("/app/data.json", '{"key": "value"}');
const content = await sandbox.fs.read("/app/data.json");
const exists = await sandbox.fs.exists("/app/data.json");
const files = await sandbox.fs.list("/app");

await sandbox.destroy();
```

### Python Sandbox

```typescript
const sandbox = createSandbox({
  isolator: "local",
  runtime: "python",
});

// Execute Python code
const result = await sandbox.execute("print('Hello from Python')");

// File operations
await sandbox.fs.write("/data/input.csv", csvData);
await sandbox.execute(`
import pandas as pd
df = pd.read_csv('/data/input.csv')
df.to_csv('/data/output.csv')
`);
const output = await sandbox.download("/data/output.csv");

await sandbox.destroy();
```

## API Reference

### Base Sandbox

| Method               | Description                |
| -------------------- | -------------------------- |
| `shell(command)`     | Execute shell command      |
| `upload(path, data)` | Upload file to sandbox     |
| `download(path)`     | Download file from sandbox |
| `destroy()`          | Cleanup sandbox resources  |

### Node/Python Sandbox (via Mixin)

| Method                 | Description             |
| ---------------------- | ----------------------- |
| `execute(code)`        | Execute code in runtime |
| `fs.read(path)`        | Read file content       |
| `fs.write(path, data)` | Write file content      |
| `fs.list(path)`        | List directory contents |
| `fs.exists(path)`      | Check if file exists    |
| `fs.delete(path)`      | Delete file             |

## Configuration

```typescript
interface SandboxConfig {
  // Isolator type (required)
  isolator: "local" | "cloudflare" | "e2b" | "docker";

  // Runtime type (default: "shell")
  runtime?: "shell" | "node" | "python";

  // Resource limits
  limits?: {
    timeout?: number; // milliseconds
    memory?: number; // bytes
    cpu?: number; // percentage
  };

  // Node-specific config
  node?: {
    packageManager?: "npm" | "yarn" | "pnpm" | "bun";
    version?: string;
  };

  // Python-specific config
  python?: {
    version?: string;
    useVenv?: boolean;
  };
}
```

## Isolators

| Isolator       | Isolation Level       | Startup Time | Use Case        |
| -------------- | --------------------- | ------------ | --------------- |
| **local**      | Process               | 10-50ms      | Development     |
| **cloudflare** | Container             | 100-500ms    | Edge deployment |
| **e2b**        | MicroVM (Firecracker) | 150ms        | Production      |
| **docker**     | Container             | 100-500ms    | Custom images   |

```typescript
// Switch isolator without changing code
const devSandbox = createSandbox({ isolator: "local", runtime: "node" });
const prodSandbox = createSandbox({ isolator: "e2b", runtime: "node" });
```

## Architecture

```
createSandbox({ isolator, runtime? })
         │
         ├── runtime: "shell" (default)
         │   └── BaseSandbox (shell, upload, download, destroy)
         │
         ├── runtime: "node"
         │   └── BaseSandbox + withFS + withNodeExecute
         │
         └── runtime: "python"
             └── BaseSandbox + withFS + withPythonExecute
```

## Packages

| Package                               | Description         |
| ------------------------------------- | ------------------- |
| [`sandboxxjs`](./packages/sandboxjs)  | Main API            |
| [`@sandboxxjs/core`](./packages/core) | Core implementation |
| [`@sandboxxjs/cli`](./packages/cli)   | CLI tool            |

## Ecosystem

Part of the [Deepractice](https://github.com/Deepractice) AI Agent infrastructure:

- **[PromptX](https://github.com/Deepractice/PromptX)** - AI Agent context platform
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent runtime platform
- **[ResourceX](https://github.com/Deepractice/ResourceX)** - Unified resource manager (ARP)
- **[ToolX](https://github.com/Deepractice/ToolX)** - Tool integration (Build System for SandboX)
- **[UIX](https://github.com/Deepractice/UIX)** - AI-to-UI protocol layer

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](./LICENSE)

---

<div align="center">
  <p>
    Built with care by <a href="https://github.com/Deepractice">Deepractice</a>
  </p>
</div>
