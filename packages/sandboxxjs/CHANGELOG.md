# sandboxxjs

## 0.2.0

### Minor Changes

- Add state persistence and binary file transfer

  **New Features:**
  - **State Persistence**: StateStore for persisting StateLog to `~/.deepractice/sandbox/` via ResourceX
  - **Binary File Transfer**: Added `upload()` and `download()` APIs to Sandbox (4 core APIs)
  - **State Recording**: Automatic operation recording with Proxy pattern
  - **opRegistry**: Unified operation definitions for replay and record

  **Breaking Changes:**
  - Sandbox now has 4 APIs (was 2): `shell`, `upload`, `download`, `destroy`
  - Package directory renamed: `packages/sandboxjs` → `packages/sandboxxjs`

  **Improvements:**
  - withState simplified from 130 lines to 59 lines
  - All README examples covered by BDD tests (29 scenarios, 128 steps)
  - Storage location: `~/.deepractice/sandbox/state-logs/` and `blobs/`
  - Integration with ResourceX 0.4.0 (deepractice:// transport, @ alias)

  **Documentation:**
  - Comprehensive README rewrite with architecture diagrams
  - Added visitor badge and bilingual subtitles
  - Clarified Isolators implementation status

### Patch Changes

- Updated dependencies
  - @sandboxxjs/core@0.2.0

## 0.1.0

### Minor Changes

- e5aa626: Initial release of SandboX
  - Multi-language support (Node.js, Python, Bash)
  - LocalIsolator using execa for process isolation
  - CloudflareContainerIsolator with Bun binary
  - File system operations (read/write/list/delete/exists)
  - Complete BDD test coverage

### Patch Changes

- Updated dependencies [e5aa626]
  - @sandboxxjs/core@0.1.0
