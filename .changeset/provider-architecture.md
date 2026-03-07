---
"sandboxxjs": major
"@sandboxxjs/core": major
"@sandboxxjs/node-provider": major
"@sandboxxjs/web-provider": major
---

Complete architecture rewrite: Provider-based unified sandbox lifecycle.

Breaking changes:

- Removed old Isolator + Mixin + State architecture
- Removed @sandboxxjs/state, @sandboxxjs/cli, @sandboxxjs/cloudflare-isolator packages
- New unified lifecycle: Allocate → Prepare → Register → Ready → Command
- New SandboxProvider interface with pluggable components (Executor, FileSystem, ProcessManager)
- New @sandboxxjs/node-provider for cloud containers (child_process + node:fs)
- New @sandboxxjs/web-provider for browser WebContainer (@webcontainer/api)
- createSandboxClient(provider) replaces createSandbox()
