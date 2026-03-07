# CLAUDE.md

## Overview

SandboX is a sandbox abstraction framework for AI agents. It provides a unified lifecycle for cloud and browser sandbox environments through the Provider pattern.

## Development Commands

```bash
bun install              # Install all dependencies
bun run build           # Build all packages (uses turbo)
bun run check           # Lint + format check (biome)
bun run check:fix       # Auto-fix lint + format issues
bun run typecheck       # Type check all packages
bun run clean           # Clean all build artifacts
bun run version         # Create version changeset
bun run release         # Publish packages (changesets)
```

## Architecture

### Provider-based Unified Sandbox Lifecycle

The architecture follows a **5-step lifecycle** with platform differences injected via `SandboxProvider`:

```
1. Allocate  → Allocator provisions a new sandbox environment
2. Prepare   → sandbox-client initializes inside the sandbox
3. Register  → sandbox-client connects to Registry via WebSocket
4. Ready     → Registry marks sandbox as available
5. Command   → Router dispatches RPC methods to sandbox-client
```

### Core Components (file = component)

```
packages/core/src/
├── allocator.ts     # Step 1: Allocate — provisions sandbox environments
├── client.ts        # Step 2-3: Prepare + Register — sandbox-client interface
├── create-client.ts # createSandboxClient() factory
├── registry.ts      # Step 3-4: Register + Ready — connection registry
├── router.ts        # Step 5: Command — RPC method dispatch
├── sandbox.ts       # Sandbox consumer interface + data types
├── protocol.ts      # WebSocket message protocol
├── provider.ts      # SandboxProvider + component interfaces
└── index.ts         # Unified exports
```

### Package Structure

```
packages/
  core/              # @sandboxxjs/core — interfaces, protocol, lifecycle
  node-provider/     # @sandboxxjs/node-provider — child_process + node:fs
  web-provider/      # @sandboxxjs/web-provider — @webcontainer/api (browser)
  sandboxxjs/        # sandboxxjs — public API entry (re-exports core)
```

### Key Abstractions

**SandboxProvider** — platform injection point:
- `@sandboxxjs/node-provider`: Node.js child_process + fs (cloud containers)
- `@sandboxxjs/web-provider`: WebContainer API (browser)
- Future: Docker, SSH, WASM, etc.

**Sandbox** — consumer-facing handle with RPC methods (execute, filesystem, process)

**SandboxClient** — runs inside the sandbox, connects back to Registry via WebSocket

## Toolchain

- **Runtime**: Bun
- **Build**: TypeScript + Turborepo
- **Lint/Format**: Biome
- **Versioning**: Changesets
- **Git hooks**: Lefthook
- **Commit format**: Conventional Commits (commitlint)

## Git Workflow

- Conventional Commits enforced via commitlint
- Pre-commit: biome check --write on staged files
- Pre-push: biome check on entire project
