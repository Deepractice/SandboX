---
"@sandboxxjs/core": minor
"@sandboxxjs/state": minor
"sandboxxjs": minor
---

feat: auto-persist state with AOF pattern

- Add unique ID to all sandbox instances (sandbox-{nanoid})
- Auto-persist operations to disk when enableRecord: true
- Use JSON Lines (.jsonl) format for true append-only operations
- Add memory store option for testing
- Storage location: ~/.agentvm/sandbox/{sandbox-id}/state.jsonl
