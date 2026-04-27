## Why

Users often run multiple AI coding agents (Claude Code, OpenCode) and need the same MCP server configured in each. Currently they must manually re-enter server details or manually edit JSON config files. A `copy` command lets users replicate an existing MCP server configuration from one agent/scope to another in a single step.

## What Changes

- Add a new `copy` (alias `cp`) CLI command that accepts a server name as a positional argument
- Detect where the named server is currently installed (which tool + scope combinations)
- Interactive mode: show detected installations, prompt user to select target tool and scope
- Non-interactive mode: accept `--tool`, `--scope`, `--from-tool`, `--from-scope` flags for scripting/CI use
- Support copying from one tool to another (e.g., claude → opencode) with automatic schema translation
- Support copying across scopes (user → project, project → user)
- Handle conflicts when the server already exists at the destination (prompt or `--force`/`--yes` to overwrite)

## Capabilities

### New Capabilities
- `mcp-copy`: Server configuration copy/duplication across tools and scopes, with both interactive wizard and non-interactive flag-driven modes

### Modified Capabilities

## Impact

- New file: `src/commands/copy.ts` — command handler
- Modified file: `src/index.ts` — register the new command
- Existing infrastructure reused: `readServers()` for discovery, `writeServer()` for writing, translators for cross-tool conversion
- No breaking changes to existing commands or config file formats
