---
"@sandboxxjs/core": minor
"@sandboxxjs/state": minor
"sandboxxjs": minor
---

feat: Auto-persist state with AOF pattern

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
