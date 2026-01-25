# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SandboX is a multi-language secure execution sandbox for AI Agents. It provides isolated execution environments for running untrusted code from AI agents across multiple languages (Shell, Node.js, Python) and multiple isolation strategies (none, srt, Cloudflare, E2B).

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
cd packages/core        # or packages/sandboxxjs, packages/cli, services/cloudflare-isolator
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

### Core Design Pattern: Base Sandbox + State Layer + Mixin Extensions

The architecture follows a **Base Sandbox + State + Mixin** pattern:

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
│ id (unique) │  │ +withState  │  │ +withState  │
│ shell       │  │ +withExecute│  │ +withExecute│
│ destroy     │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  State.fs    │ │  State.env   │ │State.storage │
│  (files)     │ │  (env vars)  │ │  (KV store)  │
└──────────────┘ └──────────────┘ └──────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    Isolator Layer     │
              │  Local / Cloudflare   │
              │    / E2B / Docker     │
              └───────────────────────┘
```

### Base Sandbox (ID + Core APIs)

```typescript
interface Sandbox {
  readonly id: string; // Unique sandbox ID (sandbox-{nanoid})
  shell(command: string): Promise<ShellResult>;
  upload(data: Buffer, remotePath: string): Promise<void>;
  download(remotePath: string): Promise<Buffer>;
  destroy(): Promise<void>;
}
```

### State Layer (via withState mixin)

```typescript
interface WithState {
  fs: FileSystem; // File operations
  env: Environment; // Environment variables
  storage: Storage; // Key-value storage
}
```

### Mixin Extensions

- **withState**: Adds state capabilities (fs, env, storage)
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
  - Handle cleanup/teardown

**2. State (state layer - @sandboxxjs/state package)**

- Location: `packages/state/src/`
- `StateFS.ts`: File system operations (via shell commands)
- `StateEnv.ts`: Environment variables (in-memory)
- `StateStorage.ts`: Key-value storage (in-memory)
- `StateLog.ts`: Operation recording (binlog pattern)
- `StateStore.ts`: Persistence with AOF pattern (JSON Lines format)
  - ResourceX implementation: Persists to `~/.agentvm/sandbox/state-logs/{id}.jsonl`
  - Memory implementation: For testing
- `StateAssets.ts`: Binary file upload/download
- `opRegistry.ts`: Unified op definitions for replay/record
- `createState.ts`: Factory with Proxy-based recording and auto-persist

**3. Mixins (capability extensions)**

- Location: `packages/core/src/mixins/`
- `withState.ts`: Adds fs, env, storage
- `withNodeExecute.ts`: Node.js code execution
- `withPythonExecute.ts`: Python code execution

**4. Sandbox (orchestration)**

- Location: `packages/core/src/Sandbox.ts`
- Responsibilities:
  - Create isolator based on config
  - Provide 2 core APIs (shell, destroy)
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
        withState.ts       # State mixin (fs, env, storage)
        withNodeExecute.ts # Node.js execute mixin
        withPythonExecute.ts # Python execute mixin

  state/          # State management (@sandboxxjs/state)
    src/
      StateFS.ts           # File system state
      StateEnv.ts          # Environment state
      StateStorage.ts      # KV storage state
      StateLog.ts          # Operation recording
      StateStore.ts        # Persistence (ResourceX)
      StateAssets.ts       # Binary file handling
      opRegistry.ts        # Unified op definitions
      createState.ts       # Factory with Proxy recording
      replayStateLog.ts    # Replay operations
      types.ts             # Type definitions

  sandboxjs/      # Public API (sandboxjs npm package)
    src/
      createSandbox.ts     # Factory function (composes mixins)
      SandboxManager.ts    # Multi-sandbox manager

  cli/            # CLI tool (@sandboxxjs/cli)

services/
  cloudflare-isolator/  # Cloudflare Workers service for remote execution
```

### Important Design Decisions

1. **Sandbox ID**: Every sandbox instance has a unique ID (`sandbox-{nanoid}`) generated automatically

2. **Base Sandbox is minimal**: Core APIs (shell, upload, download, destroy) + unique ID

3. **State is separate layer**: fs, env, storage are part of State, not base Sandbox

4. **Mixins add capabilities**: State and execute are added via TypeScript mixins based on runtime config

5. **Auto-persist by default**: When `enableRecord: true`, operations are automatically persisted to disk using AOF (Append-Only File) pattern with JSON Lines format
   - Default: `store: "resourcex"` → persists to `~/.agentvm/sandbox/state-logs/{id}.jsonl`
   - Testing: `store: "memory"` → in-memory only

6. **Work directories**: LocalIsolator creates temp directories at `.sandbox/session-{timestamp}`. Always clean up with `sandbox.destroy()`.

7. **Runtime determines mixins**:
   - `runtime: "shell"` → BaseSandbox only
   - `runtime: "node"` → BaseSandbox + withState + withNodeExecute
   - `runtime: "python"` → BaseSandbox + withState + withPythonExecute

8. **Error hierarchy**: All errors inherit from `SandboxError`. Specific types: `ExecutionError`, `TimeoutError`, `IsolationError`, `FileSystemError`.

## Key Types

```typescript
interface SandboxConfig {
  isolator: "local" | "cloudflare" | "e2b" | "docker";
  runtime?: "shell" | "node" | "python"; // default: "shell"
  state?: StateConfig;
  limits?: ResourceLimits;
  node?: NodeConfig;
  python?: PythonConfig;
}

interface StateConfig {
  env?: Record<string, string>; // initial environment variables
  initializeLog?: StateLog; // restore from StateLog
  enableRecord?: boolean; // enable recording (= auto-persist)
  store?: "resourcex" | "memory"; // default: "resourcex"
}

interface ShellResult {
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

interface Environment {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  has(key: string): boolean;
  delete(key: string): void;
  keys(): string[];
  all(): Record<string, string>;
}

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  keys(): string[];
}

// Persistence (StateStore)
interface StateStore {
  saveLog(key: string, data: string): Promise<void>;
  loadLog(key: string): Promise<string | null>;
  deleteLog(key: string): Promise<void>;
  saveBlob(ref: string, data: Buffer): Promise<void>;
  loadBlob(ref: string): Promise<Buffer | null>;
  deleteBlob(ref: string): Promise<void>;
}

// Binary files (StateAssets)
interface StateAssets {
  uploadBuffer(data: Buffer, remotePath: string): Promise<string>;
  downloadBuffer(remotePath: string): Promise<Buffer>;
  list(): string[];
}
```

## State Persistence

State can be persisted via ResourceX using the `deepractice://` transport:

```typescript
import { createStateStore, buildStateLog, loadStateLog } from "@sandboxxjs/state";

// Create store (persists to ~/.agentvm/sandbox/)
const store = createStateStore({ type: "resourcex" });

// Save StateLog
const log = sandbox.getStateLog();
await store.saveLog("session-123", log.toJSON());

// Load and restore
const json = await store.loadLog("session-123");
const log = loadStateLog(json);
createSandbox({ state: { initializeLog: log } });
```

**Storage location:** `~/.agentvm/sandbox/`

- State Logs: `~/.agentvm/sandbox/state-logs/{key}.json`
- Blobs: `~/.agentvm/sandbox/blobs/{ref}`

## Testing Strategy

- **Unit tests**: Each package has its own `bun test` suite
- **BDD tests**: Located in `bdd/` directory, use Cucumber.js
  - Features: `execute.feature`, `filesystem.feature`, `state.feature`, `cloudflare.feature`
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
2. Implement `shell()` and `destroy()` methods
3. Add to switch statement in `BaseSandbox.createIsolator()` (in `Sandbox.ts`)
4. Handle path resolution relative to isolation boundary
5. Consider timeout handling, error mapping, and cleanup in destroy()

## Adding New State Implementations

When implementing a new state backend (e.g., Redis storage):

1. Create new class in `packages/core/src/state/`
2. Implement the corresponding interface (Storage, Environment, etc.)
3. Update `withState.ts` mixin to use the new implementation based on config

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
- **State availability**: `fs`, `env`, `storage`, and `execute()` are only available for `runtime: "node"` or `runtime: "python"`, not for base shell sandbox
