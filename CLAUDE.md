# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SandboX is a multi-language secure execution sandbox for AI Agents. It provides isolated execution environments for running untrusted code from AI agents across multiple languages (Node.js, Python, Bash) and multiple isolation strategies (local, E2B, Firecracker, Docker, Cloudflare).

## Development Commands

### Setup

```bash
bun install              # Install all dependencies
bun run build           # Build all packages (uses turbo)
```

### Development

```bash
bun run build           # Build all packages in monorepo
bun run lint            # Lint all packages
bun run typecheck       # Type check all packages
bun run format          # Format all files with Prettier
bun run format:check    # Check formatting without modifying
```

### Testing

```bash
bun run test            # Run unit tests in all packages
bun run test:bdd        # Run BDD/Cucumber tests from bdd/ directory
```

### Individual Package Commands

```bash
# Navigate to specific package first
cd packages/core        # or packages/sandboxjs, packages/cli, services/cloudflare-isolator
bun run build          # Build just this package
bun run test           # Test just this package
bun run typecheck      # Type check just this package
```

### Monorepo Management

```bash
bun run clean           # Clean all build artifacts and node_modules
bun run version         # Create version changeset (uses changesets)
bun run release         # Publish packages (uses changesets)
```

## Architecture

### Core Design Pattern: Pluggable Isolation

The architecture follows a **Runtime + Isolator** pattern that separates "what to run" from "how to isolate it":

```
┌─────────────────────────────────────┐
│         sandboxjs Package           │  ← Public API
│   createSandbox(), SandboxManager   │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│         @sandboxjs/core             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Sandbox (main class)       │  │
│  │   - Orchestrates execution   │  │
│  │   - Event system             │  │
│  │   - FileSystem proxy         │  │
│  └──────┬───────────────────┬───┘  │
│         │                   │      │
│    ┌────▼─────┐      ┌──────▼────┐│
│    │ Runtime  │      │ Isolator  ││
│    │ (layer)  │      │ (layer)   ││
│    └──────────┘      └───────────┘│
└─────────────────────────────────────┘
```

### Key Abstractions

**1. Isolator (isolation strategy)**

- Abstract base: `packages/core/src/isolators/Isolator.ts`
- Implementations:
  - `LocalIsolator`: Uses execa + child_process (fast, low isolation)
  - `CloudflareContainerIsolator`: Uses Cloudflare Containers API
  - Planned: E2B, Firecracker, Docker isolators
- Responsibilities:
  - Execute code in isolated environment
  - Provide FileSystem interface for the sandbox
  - Handle cleanup/teardown

**2. Runtime (language-specific execution)**

- Abstract base: `packages/core/src/runtimes/Runtime.ts`
- Current implementation:
  - `GenericRuntime`: Delegates directly to isolator (isolator handles language specifics)
  - `NodeRuntime`: Legacy, not currently used
- Design note: The Runtime layer is minimal because isolators handle language-specific execution (e.g., LocalIsolator builds commands for node/python/bash)

**3. Sandbox (orchestration)**

- Location: `packages/core/src/Sandbox.ts`
- Responsibilities:
  - Create and wire Runtime + Isolator based on config
  - Proxy filesystem operations to isolator's FileSystem
  - Event emission (execute:start, execute:success, execute:error, execute:complete)
  - Lifecycle management (destroy)

### Package Structure

```
packages/
  core/           # Core implementation (@sandboxjs/core)
    src/
      Sandbox.ts           # Main orchestrator
      types.ts             # Core type definitions
      errors.ts            # Custom error types
      isolators/           # Isolation implementations
        Isolator.ts        # Abstract base
        LocalIsolator.ts   # Child process isolation
        CloudflareContainerIsolator.ts
      runtimes/            # Language runtime wrappers
        Runtime.ts         # Abstract base
        GenericRuntime.ts  # Default (delegates to isolator)

  sandboxjs/      # Public API (sandboxjs npm package)
    src/
      createSandbox.ts     # Factory function
      SandboxManager.ts    # Multi-sandbox manager

  cli/            # CLI tool (@sandboxjs/cli)

services/
  cloudflare-isolator/  # Cloudflare Workers service for remote execution
```

### Important Design Decisions

1. **Isolators own filesystem**: Each isolator implements its own FileSystem interface. The Sandbox class proxies fs operations to the active isolator.

2. **Work directories**: LocalIsolator creates temp directories at `.sandbox/session-{timestamp}` for each execution. Always clean up with `sandbox.destroy()`.

3. **Runtime configuration**: The `SandboxConfig` requires both `runtime` ("node" | "python" | "bash" | "docker") and `isolator` ("local" | "cloudflare" | "e2b" | "firecracker" | "docker"). These are independent choices.

4. **Error hierarchy**: All errors inherit from `SandboxError`. Specific types: `ExecutionError`, `TimeoutError`, `IsolationError`, `FileSystemError`.

5. **Event system**: Sandbox emits events at execution boundaries. Use `sandbox.on(event, handler)` to observe.

## Key Types

```typescript
interface SandboxConfig {
  runtime: "bash" | "node" | "python" | "docker";
  isolator: "local" | "cloudflare" | "e2b" | "firecracker" | "docker";
  limits?: ResourceLimits;
  isolation?: IsolationConfig;
}

interface ExecuteOptions {
  code: string;
  env?: Record<string, string>;
  timeout?: number;
}

interface ExecuteResult {
  success: boolean;
  data?: unknown; // Return value (if runtime supports it)
  stdout?: string;
  stderr?: string;
  error?: string;
  exitCode?: number;
  metadata: {
    executionTime: number;
    timestamp: string;
  };
}

interface FileSystem {
  write(path: string, data: string): Promise<void>;
  read(path: string): Promise<string>;
  list(path: string): Promise<string[]>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}
```

## Testing Strategy

- **Unit tests**: Each package has its own `bun test` suite
- **BDD tests**: Located in `bdd/` directory, use Cucumber.js
  - Features: `execute.feature`, `filesystem.feature`, `cloudflare.feature`
  - Run with: `bun run test:bdd` or `cd bdd && bun run test`
- **Test tags**: Use `bun run test:tags "@tagname"` to run specific BDD scenarios

## Git Workflow

- **Commit format**: Conventional Commits enforced via commitlint
  - `feat:` for features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `refactor:`, `test:`, `chore:` for other changes
- **Git hooks**: Managed by lefthook (`.lefthook.yml`)
  - `pre-commit`: Auto-formats and lints staged files
  - `commit-msg`: Validates commit message format
  - `pre-push`: Checks format, lint, and lockfile freshness
- **Package management**: Uses Bun with workspaces. Lockfile must stay in sync.

## Runtime & Package Manager

- **Required**: Node.js >=22.0.0, Bun >=1.3.0
- **Package manager**: Bun (specified in `package.json` as `packageManager: "bun@1.3.5"`)
- **Build system**: Turborepo for monorepo task orchestration

## Adding New Isolators

When implementing a new isolator:

1. Create new class in `packages/core/src/isolators/` extending `Isolator`
2. Implement `execute()`, `getFileSystem()`, and `destroy()` methods
3. Add to switch statement in `Sandbox.createIsolator()` (in `Sandbox.ts`)
4. FileSystem implementation should handle path resolution relative to isolation boundary
5. Consider timeout handling, error mapping, and cleanup in destroy()

## Common Pitfalls

- **Forgetting cleanup**: Always call `sandbox.destroy()` to clean up work directories and resources
- **Path assumptions**: FileSystem paths in LocalIsolator are relative to `.sandbox/session-*`, not project root
- **Timeout defaults**: Default timeout is 30s, configurable per-execution or per-sandbox
- **Isolator vs Runtime confusion**: Runtime is mostly a pass-through to Isolator. Language-specific logic lives in the Isolator.
