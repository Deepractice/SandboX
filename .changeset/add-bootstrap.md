---
"@sandboxxjs/core": minor
"@sandboxxjs/web-provider": minor
"@sandboxxjs/node-provider": minor
"sandboxxjs": minor
---

Add SandboxBootstrap component to Provider — Step 2: Prepare.

- SandboxProvider now requires createBootstrap() method
- web-provider: bootstrap boots WebContainer internally, no need to import @webcontainer/api
- node-provider: bootstrap is no-op (container already running)
- createSandboxClient calls bootstrap.boot() before creating other components
- Removed custom WebContainer type definitions, using @webcontainer/api directly
