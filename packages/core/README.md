# @sandboxjs/core

Core implementation for SandboX - secure code execution engine.

## Features

- Multiple isolators (Local, Cloudflare, E2B, Firecracker)
- Multiple runtimes (Node.js, Python, Bash, Docker)
- File system operations
- Resource limits
- Event-driven architecture

## Installation

```bash
npm install @sandboxjs/core
```

## Usage

```typescript
import { Sandbox, LocalIsolator } from "@sandboxjs/core";

const isolator = new LocalIsolator("node");
const sandbox = new Sandbox({
  runtime: "node",
  isolator: "local",
});

const result = await sandbox.execute({
  code: 'console.log("Hello")',
});

console.log(result.stdout); // "Hello"
```

## API

### Sandbox

```typescript
class Sandbox {
  execute(options: ExecuteOptions): Promise<ExecuteResult>;
  writeFile(path: string, data: string): Promise<void>;
  readFile(path: string): Promise<string>;
  destroy(): Promise<void>;
  on(event: string, handler: Function): void;
  fs: FileSystem;
}
```

### Isolators

- `LocalIsolator` - Process isolation via execa
- `CloudflareContainerIsolator` - Docker via Bun binary
- `E2BIsolator` - E2B microVM (not yet implemented)

## License

MIT
