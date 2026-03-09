# @sandboxxjs/node-platform

## 2.4.0

### Minor Changes

- 53a2387: Built-in Client: platform-optional createSandbox() with universal WebSocket client
  - `createSandbox()` now works without a platform — client-only mode for browser/Node.js 22+
  - Built-in `connect()` function using standard WebSocket API (zero dependencies)
  - `export { connect } from "sandboxxjs"` for direct usage

### Patch Changes

- Updated dependencies [53a2387]
  - @sandboxxjs/core@2.4.0

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

### Patch Changes

- Updated dependencies [fdc312f]
  - @sandboxxjs/core@2.3.0
