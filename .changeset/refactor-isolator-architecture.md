---
"sandboxxjs": minor
"@sandboxxjs/core": minor
---

Refactor Isolator architecture: Runtime/Isolator separation

Breaking changes:

- Rename `local` isolator to `noop`
- Remove `shell` runtime type (use `shell()` method instead)
- Remove `docker` isolator type

New features:

- Add `SrtIsolator` for OS-level isolation via sandbox-runtime
- Isolator now has `execute()` and `evaluate()` methods
- Each Isolator handles runtime-specific execution internally

API changes:

- `IsolatorType`: "noop" | "srt" | "cloudflare" | "e2b"
- `RuntimeType`: "node" | "python"
- `sandbox.shell()` available for all runtimes
- `sandbox.execute()` and `sandbox.evaluate()` based on runtime
