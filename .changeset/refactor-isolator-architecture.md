---
"sandboxxjs": minor
"@sandboxxjs/core": minor
"@sandboxxjs/cloudflare-isolator": minor
---

Refactor Isolator architecture: Runtime/Isolator separation

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
