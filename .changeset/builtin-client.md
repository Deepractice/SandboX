---
"sandboxxjs": minor
"@sandboxxjs/core": minor
"@sandboxxjs/node-platform": minor
---

Built-in Client: platform-optional createSandbox() with universal WebSocket client

- `createSandbox()` now works without a platform — client-only mode for browser/Node.js 22+
- Built-in `connect()` function using standard WebSocket API (zero dependencies)
- `export { connect } from "sandboxxjs"` for direct usage
