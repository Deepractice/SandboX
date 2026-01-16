---
"@sandboxxjs/state": patch
---

chore: upgrade resourcexjs to 0.5.0 and sync agentvm naming

- Upgrade resourcexjs dependency from 0.4.0 to 0.5.0
- Update `deepracticeHandler` → `agentvmHandler`
- Update storage paths: `~/.deepractice/` → `~/.agentvm/`
- Update protocol scheme: `deepractice://` → `agentvm://`
- Update all documentation and tests

This change aligns with ResourceX v0.5.0 renaming (PR #11) to reserve "deepractice" for future cloud platform transport.
