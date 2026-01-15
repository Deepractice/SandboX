# sandboxjs

Multi-language secure execution sandbox for AI Agents.

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
  code: 'console.log("Hello World")',
});

console.log(result.stdout); // "Hello World"
```

## Multi-Language

```typescript
// Node.js
const sandbox = createSandbox({ runtime: "node", isolator: "local" });

// Python
const sandbox = createSandbox({ runtime: "python", isolator: "local" });

// Bash
const sandbox = createSandbox({ runtime: "bash", isolator: "local" });
```

## Isolators

```typescript
// Local (child_process)
createSandbox({ isolator: "local" });

// Cloudflare (Docker via binary)
createSandbox({ isolator: "cloudflare" });

// E2B (microVM in cloud)
createSandbox({ isolator: "e2b" });
```

## File System

```typescript
await sandbox.writeFile("/tmp/file.txt", "data");
const content = await sandbox.readFile("/tmp/file.txt");
const files = await sandbox.fs.list("/tmp");
```

## Resource Limits

```typescript
const sandbox = createSandbox({
  runtime: "node",
  isolator: "local",
  limits: {
    timeout: 30000,
    memory: 128 * 1024 * 1024,
  },
});
```

## License

MIT
