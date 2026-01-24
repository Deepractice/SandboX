---
"sandboxxjs": minor
"@sandboxxjs/core": minor
"@sandboxxjs/state": minor
---

Add init() method for async state initialization

- Add `sandbox.init()` method to complete async fs operations from initializeLog
- Sync operations (env, storage) are applied immediately in constructor
- Add `replayStateLogFs()` for replaying only fs operations
- Update BDD tests to use init() instead of setTimeout hack
- Add BDD tests for evaluate() API
