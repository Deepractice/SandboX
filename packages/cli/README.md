# @sandboxjs/cli

CLI tool for SandboX.

## Installation

```bash
npm install -g @sandboxjs/cli
```

## Usage

```bash
# Run code
sandbox run node -c "console.log('hello')"

# Run file
sandbox run python ./script.py

# List sandboxes
sandbox list

# Help
sandbox --help
```

## Commands

| Command                           | Description            |
| --------------------------------- | ---------------------- |
| `sandbox run <runtime> <file>`    | Run code file          |
| `sandbox run <runtime> -c <code>` | Run code string        |
| `sandbox list`                    | List running sandboxes |
| `sandbox destroy <id>`            | Destroy a sandbox      |

## Options

| Option              | Description                            |
| ------------------- | -------------------------------------- |
| `--isolator <type>` | Isolator type (local, cloudflare, e2b) |
| `--timeout <ms>`    | Execution timeout                      |
| `--env <json>`      | Environment variables                  |

## License

MIT
