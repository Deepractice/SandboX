# @sandboxjs/cloudflare-isolator

Docker-based code execution server for SandboX.

## What is this?

A standalone HTTP server (compiled to binary) that executes code in Docker containers.

Used by `CloudflareContainerIsolator` in `sandboxjs`.

## Usage

### As a binary

```bash
npm install @sandboxjs/cloudflare-isolator

# Start server
cloudflare-isolator

# Or with custom port
PORT=9000 cloudflare-isolator
```

### Programmatic

```typescript
import { createSandbox } from "sandboxjs";

const sandbox = createSandbox({
  runtime: "node",
  isolator: "cloudflare", // Automatically starts cloudflare-isolator
});
```

## API

### POST /execute

Execute code in Docker container.

**Request:**

```json
{
  "code": "console.log('hello')",
  "runtime": "node",
  "env": { "NODE_ENV": "production" },
  "timeout": 30000
}
```

**Response:**

```json
{
  "success": true,
  "stdout": "hello",
  "stderr": "",
  "exitCode": 0,
  "metadata": {
    "executionTime": 450,
    "timestamp": "2026-01-15T19:00:00.000Z"
  }
}
```

### GET /health

Health check.

**Response:**

```json
{
  "status": "ok",
  "runtime": "bun"
}
```

## Deployment to Cloudflare

```bash
# Deploy to Cloudflare Workers + Containers
cd services/cloudflare-isolator
bun run deploy
```

## Supported Runtimes

- `node` - Node.js 22
- `python` - Python 3.11
- `bash` - Alpine Linux

## Requirements

- Docker (for local execution)
- Cloudflare account (for cloud deployment)

## License

MIT
