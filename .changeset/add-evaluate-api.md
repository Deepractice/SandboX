---
"sandboxxjs": minor
"@sandboxxjs/core": minor
---

Add evaluate() API for REPL-style expression evaluation

- `evaluate(expr)`: Returns expression value (uses `node -p` / Python `eval()`)
- `execute(code)`: Executes script, returns stdout (existing behavior)

This provides clearer semantics:

- Use `evaluate("1 + 1")` when you need the return value
- Use `execute("console.log('hello')")` when running scripts
