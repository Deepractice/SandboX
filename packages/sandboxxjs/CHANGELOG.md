# sandboxxjs

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
