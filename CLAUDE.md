# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SandboX is a multi-language secure execution sandbox for AI Agents. It provides isolated execution environments for running untrusted code from AI agents across multiple languages (Shell, Node.js, Python) and multiple isolation strategies (local, Cloudflare, E2B, Docker).

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

### Core Design Pattern: Base Sandbox + Mixin Extensions

The architecture follows a **Base Sandbox + Mixin** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    sandboxjs Package                         │
│                    createSandbox()                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ BaseSandbox │  │ NodeSandbox │  │PythonSandbox│
│ (4 APIs)    │  │ +withFS     │  │ +withFS     │
│             │  │ +withExecute│  │ +withExecute│
└─────────────┘  └─────────────┘  └─────────────┘
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    Isolator Layer     │
              │  Local / Cloudflare   │
              │    / E2B / Docker     │
              └───────────────────────┘
```

### Base Sandbox (4 Core APIs)

```typescript
interface Sandbox {
  shell(command: string): Promise<ShellResult>;
  upload(path: string, data: string | Buffer): Promise<void>;
  download(path: string): Promise<string | Buffer>;
  destroy(): Promise<void>;
}
```

### Mixin Extensions

- **withFS**: Adds file system operations (read, write, list, exists, delete)
- **withNodeExecute**: Adds `execute(code)` for Node.js
- **withPythonExecute**: Adds `execute(code)` for Python

### Key Abstractions

**1. Isolator (isolation strategy)**

- Abstract base: `packages/core/src/isolators/Isolator.ts`
- Implementations:
  - `LocalIsolator`: Uses execa + child_process (fast, low isolation)
  - `CloudflareContainerIsolator`: Uses Cloudflare Containers API
  - Planned: E2B, Docker isolators
- Responsibilities:
  - Execute shell commands in isolated environment
  - Handle file upload/download
  - Handle cleanup/teardown

**2. Mixins (capability extensions)**

- Location: `packages/core/src/mixins/`
- `withFS.ts`: File system operations
- `withNodeExecute.ts`: Node.js code execution
- `withPythonExecute.ts`: Python code execution

**3. Sandbox (orchestration)**

- Location: `packages/core/src/Sandbox.ts`
- Responsibilities:
  - Create isolator based on config
  - Provide 4 core APIs (shell, upload, download, destroy)
  - Base class for mixin composition

### Package Structure

```
packages/
  core/           # Core implementation (@sandboxxjs/core)
    src/
      Sandbox.ts           # Base sandbox class
      types.ts             # Type definitions
      errors.ts            # Custom error types
      isolators/           # Isolation implementations
        Isolator.ts        # Abstract base
        LocalIsolator.ts   # Child process isolation
        CloudflareContainerIsolator.ts
      mixins/              # Capability extensions
        withFS.ts          # File system mixin
        withNodeExecute.ts # Node.js execute mixin
        withPythonExecute.ts # Python execute mixin

  sandboxjs/      # Public API (sandboxjs npm package)
    src/
      createSandbox.ts     # Factory function (composes mixins)
      SandboxManager.ts    # Multi-sandbox manager

  cli/            # CLI tool (@sandboxxjs/cli)

services/
  cloudflare-isolator/  # Cloudflare Workers service for remote execution
```

### Important Design Decisions

1. **Base Sandbox is minimal**: Only 4 APIs (shell, upload, download, destroy)

2. **Mixins add capabilities**: fs and execute are added via TypeScript mixins based on runtime config

3. **Work directories**: LocalIsolator creates temp directories at `.sandbox/session-{timestamp}`. Always clean up with `sandbox.destroy()`.

4. **Runtime determines mixins**:
   - `runtime: "shell"` → BaseSandbox only
   - `runtime: "node"` → BaseSandbox + withFS + withNodeExecute
   - `runtime: "python"` → BaseSandbox + withFS + withPythonExecute

5. **Error hierarchy**: All errors inherit from `SandboxError`. Specific types: `ExecutionError`, `TimeoutError`, `IsolationError`, `FileSystemError`.

## Key Types

```typescript
interface SandboxConfig {
  isolator: "local" | "cloudflare" | "e2b" | "docker";
  runtime?: "shell" | "node" | "python"; // default: "shell"
  limits?: ResourceLimits;
  node?: NodeConfig;
  python?: PythonConfig;
}

interface ShellResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

interface ExecuteResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

interface FileSystem {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  list(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
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
2. Implement `shell()`, `upload()`, `download()`, and `destroy()` methods
3. Add to switch statement in `BaseSandbox.createIsolator()` (in `Sandbox.ts`)
4. Handle path resolution relative to isolation boundary
5. Consider timeout handling, error mapping, and cleanup in destroy()

## Adding New Mixins

When implementing a new mixin:

1. Create new file in `packages/core/src/mixins/`
2. Export a function that takes a `SandboxConstructor` and returns an extended class
3. Export from `packages/core/src/mixins/index.ts`
4. Update `createSandbox.ts` to compose the mixin based on config

## Common Pitfalls

- **Forgetting cleanup**: Always call `sandbox.destroy()` to clean up work directories and resources
- **Path assumptions**: File paths in LocalIsolator are relative to `.sandbox/session-*`, not project root
- **Timeout defaults**: Default timeout is 30s, configurable via `limits.timeout`
- **Mixin availability**: `execute()` and `fs` are only available for `runtime: "node"` or `runtime: "python"`, not for base shell sandbox
