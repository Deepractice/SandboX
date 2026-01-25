# sandboxxjs

## 0.5.1

### Patch Changes

- fix: add @sandboxxjs/state to fixed version group and sync versions
- Updated dependencies
  - @sandboxxjs/core@0.5.1

## 0.5.0

### Minor Changes

- c374b9e: Add evaluate() API for REPL-style expression evaluation
  - `evaluate(expr)`: Returns expression value (uses `node -p` / Python `eval()`)
  - `execute(code)`: Executes script, returns stdout (existing behavior)

  This provides clearer semantics:
  - Use `evaluate("1 + 1")` when you need the return value
  - Use `execute("console.log('hello')")` when running scripts

- b1ed09d: Add init() method for async state initialization
  - Add `sandbox.init()` method to complete async fs operations from initializeLog
  - Sync operations (env, storage) are applied immediately in constructor
  - Add `replayStateLogFs()` for replaying only fs operations
  - Update BDD tests to use init() instead of setTimeout hack
  - Add BDD tests for evaluate() API

- 95ee754: Refactor Isolator architecture: Runtime/Isolator separation

  Breaking changes:
  - Rename `local` isolator to `none`
  - Remove `shell` runtime type (use `shell()` method instead)
  - Remove `docker` isolator type
  - CloudflareIsolator API: add `mode` parameter ("shell" | "execute" | "evaluate")

  New features:
  - Add `SrtIsolator` for OS-level isolation via @anthropic-ai/sandbox-runtime
  - Isolator now has `execute()` and `evaluate()` methods
  - Each Isolator handles runtime-specific execution internally
  - SRT features: network blocking, filesystem restrictions, dependency checks

  API changes:
  - `IsolatorType`: "none" | "srt" | "cloudflare" | "e2b"
  - `RuntimeType`: "node" | "python"
  - `sandbox.shell()` available for all runtimes
  - `sandbox.execute()` and `sandbox.evaluate()` based on runtime

  Dependencies:
  - SRT requires: ripgrep (brew install ripgrep on macOS)
  - CloudflareIsolator requires: Docker

### Patch Changes

- 1b8b144: Fix execute() error handling and state restore issues
  - execute() now throws ExecutionError on failure (Node.js and Python)
  - Fix buildStateLog().storage.set() not restoring correctly
    - Added replayStateLogSync() for synchronous replay in constructors
  - Fix stateLog.toJSON() to return array instead of string
    - loadStateLog() now accepts both string and array

- Updated dependencies [c374b9e]
- Updated dependencies [b1ed09d]
- Updated dependencies [1b8b144]
- Updated dependencies [95ee754]
  - @sandboxxjs/core@0.5.0

## 0.4.0

### Minor Changes

- ddc7413: feat: auto-persist state with AOF pattern
  - Add unique ID to all sandbox instances (sandbox-{nanoid})
  - Auto-persist operations to disk when enableRecord: true
  - Use JSON Lines (.jsonl) format for true append-only operations
  - Add memory store option for testing
  - Storage location: ~/.agentvm/sandbox/{sandbox-id}/state.jsonl

### Patch Changes

- Updated dependencies [ddc7413]
  - @sandboxxjs/core@0.4.0

## 0.3.0

### Minor Changes

- 851e57e: feat: Auto-persist state with AOF pattern

  ## Features
  - **Sandbox ID**: All sandbox instances now have a unique ID (`sandbox-{nanoid}`)
  - **Auto-persist**: `enableRecord: true` automatically persists operations to disk using AOF (Append-Only File) pattern
  - **JSON Lines format**: State logs saved as `.jsonl` files for true append-only operations
  - **Memory store**: Add `store: "memory"` for testing without file persistence

  ## Breaking Changes
  - `Sandbox` interface now includes `readonly id: string` property
  - `StateConfig` adds new optional field `store?: "resourcex" | "memory"`
  - `CreateStateOptions` now requires `sandboxId: string` parameter
  - `StateStore` interface adds `appendEntry(sandboxId: string, entry: StateLogEntry): Promise<void>`

  ## Usage

  ```typescript
  import { createSandbox } from "sandboxxjs";

  // Auto-persist enabled by default with enableRecord
  const sandbox = createSandbox({
    isolator: "local",
    runtime: "node",
    state: { enableRecord: true }, // Auto-persists to ~/.deepractice/sandbox/state-logs/{id}.jsonl
  });

  console.log(sandbox.id); // "sandbox-V1StGXR8_Z5jdHi"

  // Operations automatically appended to disk
  await sandbox.fs.write("config.json", "{}");
  sandbox.env.set("KEY", "value");

  // For testing: use memory store
  const testSandbox = createSandbox({
    runtime: "node",
    state: { enableRecord: true, store: "memory" },
  });
  ```

  ## Technical Details
  - Uses `nanoid` for unique ID generation
  - JSON Lines (`.jsonl`) format for efficient append operations
  - Native `fs.appendFile` for true AOF without read-modify-write
  - Async persistence doesn't block operations
  - Storage location: `~/.deepractice/sandbox/state-logs/{id}.jsonl`

### Patch Changes

- Updated dependencies [851e57e]
  - @sandboxxjs/core@0.3.0

## 0.2.0

### Minor Changes

- Add state persistence and binary file transfer

  **New Features:**
  - **State Persistence**: StateStore for persisting StateLog to `~/.deepractice/sandbox/` via ResourceX
  - **Binary File Transfer**: Added `upload()` and `download()` APIs to Sandbox (4 core APIs)
  - **State Recording**: Automatic operation recording with Proxy pattern
  - **opRegistry**: Unified operation definitions for replay and record

  **Breaking Changes:**
  - Sandbox now has 4 APIs (was 2): `shell`, `upload`, `download`, `destroy`
  - Package directory renamed: `packages/sandboxjs` → `packages/sandboxxjs`

  **Improvements:**
  - withState simplified from 130 lines to 59 lines
  - All README examples covered by BDD tests (29 scenarios, 128 steps)
  - Storage location: `~/.deepractice/sandbox/state-logs/` and `blobs/`
  - Integration with ResourceX 0.4.0 (deepractice:// transport, @ alias)

  **Documentation:**
  - Comprehensive README rewrite with architecture diagrams
  - Added visitor badge and bilingual subtitles
  - Clarified Isolators implementation status

### Patch Changes

- Updated dependencies
  - @sandboxxjs/core@0.2.0

## 0.1.0

### Minor Changes

- e5aa626: Initial release of SandboX
  - Multi-language support (Node.js, Python, Bash)
  - LocalIsolator using execa for process isolation
  - CloudflareContainerIsolator with Bun binary
  - File system operations (read/write/list/delete/exists)
  - Complete BDD test coverage

### Patch Changes

- Updated dependencies [e5aa626]
  - @sandboxxjs/core@0.1.0
