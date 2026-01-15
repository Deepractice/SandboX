<div align="center">
  <h1>SandboX</h1>
  <p>
    <strong>Multi-language secure execution sandbox for AI Agents</strong>
  </p>
  <p>AI Agent 多语言安全执行沙箱</p>

  <p>
    <b>Multi-Language</b> · <b>Multi-Isolator</b> · <b>Secure by Default</b>
  </p>
  <p>
    <b>多语言</b> · <b>多隔离器</b> · <b>默认安全</b>
  </p>

  <p>
    <a href="https://github.com/Deepractice/SandboX"><img src="https://img.shields.io/github/stars/Deepractice/SandboX?style=social" alt="Stars"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/SandboX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/sandboxjs"><img src="https://img.shields.io/npm/v/sandboxjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>
</div>

---

## What is SandboX?

**SandboX** provides secure, isolated execution environments for running untrusted code from AI Agents.

- **Multi-Language**: Node.js, Python, Bash, Docker
- **Multi-Isolator**: Local (child_process), E2B (microVM), Firecracker, Docker
- **Pluggable Architecture**: Switch isolators without changing code

## Installation

```bash
npm install sandboxjs
```

## Quick Start

```typescript
import { createSandbox } from "sandboxjs";

const sandbox = createSandbox({
  runtime: "node",
  isolator: "local",
});

const result = await sandbox.execute({
  code: 'console.log("Hello World"); return 42;',
});

console.log(result.stdout); // "Hello World"
console.log(result.data); // 42
```

## Multi-Language Support

```typescript
// Node.js
const sandbox = createSandbox({ runtime: "node", isolator: "local" });
await sandbox.execute({ code: 'console.log("Hello from Node")' });

// Python
const sandbox = createSandbox({ runtime: "python", isolator: "local" });
await sandbox.execute({ code: 'print("Hello from Python")' });

// Bash
const sandbox = createSandbox({ runtime: "bash", isolator: "local" });
await sandbox.execute({ code: 'echo "Hello from Bash"' });
```

## File System Operations

```typescript
// Write file
await sandbox.writeFile("/tmp/input.txt", "data");

// Read file
const content = await sandbox.readFile("/tmp/input.txt");

// fs namespace (E2B-style)
await sandbox.fs.write("/tmp/file.txt", "data");
const content = await sandbox.fs.read("/tmp/file.txt");
const files = await sandbox.fs.list("/tmp");
const exists = await sandbox.fs.exists("/tmp/file.txt");
```

## Environment Variables

```typescript
const result = await sandbox.execute({
  code: "console.log(process.env.API_KEY)",
  env: { API_KEY: "secret" },
});
```

## Resource Limits

```typescript
const sandbox = createSandbox({
  runtime: "node",
  isolator: "local",
  limits: {
    timeout: 30000, // 30s execution timeout
    memory: 128 * 1024 * 1024, // 128MB memory limit
  },
});
```

## Isolators

| Isolator        | Isolation Level       | Startup Time | Use Case      |
| --------------- | --------------------- | ------------ | ------------- |
| **local**       | Process               | 10-50ms      | Development   |
| **e2b**         | MicroVM (Firecracker) | 150ms        | Production    |
| **firecracker** | MicroVM               | 150ms        | Self-hosted   |
| **docker**      | Container             | 100-500ms    | Custom images |

```typescript
// Switch isolator without changing code
const devSandbox = createSandbox({ runtime: "node", isolator: "local" });
const prodSandbox = createSandbox({ runtime: "node", isolator: "e2b" });
```

## Packages

| Package                              | Description         |
| ------------------------------------ | ------------------- |
| [`sandboxjs`](./packages/sandboxjs)  | Main API            |
| [`@sandboxjs/core`](./packages/core) | Core implementation |
| [`@sandboxjs/cli`](./packages/cli)   | CLI tool            |

## CLI

```bash
npm install -g @sandboxjs/cli

# Run code
sandbox run node -c "console.log('hello')"

# Run file
sandbox run python ./script.py

# List sandboxes
sandbox list
```

## Ecosystem

Part of the [Deepractice](https://github.com/Deepractice) AI Agent infrastructure:

- **[PromptX](https://github.com/Deepractice/PromptX)** - AI Agent context platform
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent runtime platform
- **[ResourceX](https://github.com/Deepractice/ResourceX)** - Unified resource manager (ARP)
- **[ToolX](https://github.com/Deepractice/ToolX)** - Tool integration
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
