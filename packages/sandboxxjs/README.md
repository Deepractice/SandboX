# @sandboxxjs/sandbox

Multi-language secure execution sandbox for AI Agents.

## Installation

```bash
npm install @sandboxxjs/sandbox
```

## Quick Start

```typescript
import { createSandbox } from "@sandboxxjs/sandbox";

const sandbox = createSandbox({
  runtime: "node",
  isolator: "none",
});

const result = await sandbox.execute({
  code: 'console.log("Hello World")',
});

console.log(result.stdout); // "Hello World"
```

## Multi-Language

```typescript
// Node.js
const sandbox = createSandbox({ runtime: "node", isolator: "none" });

// Python
const sandbox = createSandbox({ runtime: "python", isolator: "none" });

// Bash
const sandbox = createSandbox({ runtime: "bash", isolator: "none" });
```

## Isolators

```typescript
// None (child_process, no isolation)
createSandbox({ isolator: "none" });

// SRT (OS-level sandbox via Seatbelt/bubblewrap)
createSandbox({ isolator: "srt" });

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
  isolator: "none",
  limits: {
    timeout: 30000,
    memory: 128 * 1024 * 1024,
  },
});
```

## License

MIT
