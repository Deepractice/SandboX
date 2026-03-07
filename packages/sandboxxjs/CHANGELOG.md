# sandboxxjs

## 2.0.1

### Patch Changes

- ce352d9: Add `sandboxxjs/protocol` subpath export for WebSocket message types.
  - @sandboxxjs/core@2.0.1

## 2.0.0

### Major Changes

- 9c7ae4c: Complete architecture rewrite: Provider-based unified sandbox lifecycle.

  Breaking changes:

  - Removed old Isolator + Mixin + State architecture
  - Removed @sandboxxjs/state, @sandboxxjs/cli, @sandboxxjs/cloudflare-isolator packages
  - New unified lifecycle: Allocate → Prepare → Register → Ready → Command
  - New SandboxProvider interface with pluggable components (Executor, FileSystem, ProcessManager)
  - New @sandboxxjs/node-provider for cloud containers (child_process + node:fs)
  - New @sandboxxjs/web-provider for browser WebContainer (@webcontainer/api)
  - createSandboxClient(provider) replaces createSandbox()

### Patch Changes

- Updated dependencies [9c7ae4c]
  - @sandboxxjs/core@2.0.0
