# @sandboxxjs/core

## 2.4.0

### Minor Changes

- 53a2387: Built-in Client: platform-optional createSandbox() with universal WebSocket client
  - `createSandbox()` now works without a platform — client-only mode for browser/Node.js 22+
  - Built-in `connect()` function using standard WebSocket API (zero dependencies)
  - `export { connect } from "sandboxxjs"` for direct usage

## 2.3.0

### Minor Changes

- fdc312f: Rewrite architecture: Client/Worker/Broker three-role model
  - **Core**: Sandbox, Client, Worker, Broker interfaces with JSON-RPC 2.0 protocol
  - **Platform SPI**: `@sandboxxjs/core/platform` as dedicated provider integration entry point
  - **Fluent API**: `createSandbox(platform).connect() / .serve() / .run() / .broker()`
  - **Node Platform**: New `@sandboxxjs/node-platform` package (spawn + fs + WebSocket)
  - **Broker**: Renamed from Bridge — registry + router + discovery + proxy
  - **Sandbox dir**: Default working directory at `~/.deepractice/sandbox/<sandboxId>/`
  - **Removed**: Provider, Allocator, Registry, Router, Bootstrap concepts

## 2.2.1

## 2.2.0

## 2.1.1

### Patch Changes

- 47837db: Add optional `metadata` field to `SandboxContainer` for platform-specific extension data

## 2.1.0

### Minor Changes

- 5c1c1a9: Add SandboxBootstrap component to Provider — Step 2: Prepare.
  - SandboxProvider now requires createBootstrap() method
  - web-provider: bootstrap boots WebContainer internally, no need to import @webcontainer/api
  - node-provider: bootstrap is no-op (container already running)
  - createSandboxClient calls bootstrap.boot() before creating other components
  - Removed custom WebContainer type definitions, using @webcontainer/api directly

## 2.0.1

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
