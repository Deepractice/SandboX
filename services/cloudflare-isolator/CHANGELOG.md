# @sandboxxjs/cloudflare-isolator

## 0.5.0

### Minor Changes

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

## 0.4.0

## 0.3.0

## 0.2.0

## 0.1.0

### Minor Changes

- e5aa626: Initial release of SandboX
  - Multi-language support (Node.js, Python, Bash)
  - LocalIsolator using execa for process isolation
  - CloudflareContainerIsolator with Bun binary
  - File system operations (read/write/list/delete/exists)
  - Complete BDD test coverage
