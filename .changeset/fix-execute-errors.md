---
"sandboxxjs": patch
"@sandboxxjs/core": patch
"@sandboxxjs/state": patch
---

Fix execute() error handling and state restore issues

- execute() now throws ExecutionError on failure (Node.js and Python)
- Fix buildStateLog().storage.set() not restoring correctly
  - Added replayStateLogSync() for synchronous replay in constructors
- Fix stateLog.toJSON() to return array instead of string
  - loadStateLog() now accepts both string and array
