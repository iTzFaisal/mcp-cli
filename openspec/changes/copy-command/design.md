## Context

The mcp-cli tool currently supports `list`, `add`, and `remove` commands for managing MCP server configurations across Claude Code and OpenCode. Users who run multiple coding agents need to duplicate server configurations manually. The codebase already has the building blocks: `readServers()` discovers servers across tools/scopes, `writeServer()` writes to any tool/scope, and translators handle cross-tool schema conversion.

## Goals / Non-Goals

**Goals:**
- Enable copying an existing MCP server config from one tool/scope to another via a `copy` command
- Support both interactive wizard and non-interactive (flag-driven) modes, consistent with the `add` command pattern
- Auto-detect where a server is installed to minimize user input
- Handle cross-tool schema translation transparently (e.g., claude stdio → opencode local)

**Non-Goals:**
- Copying multiple servers at once (batch operations)
- Renaming a server during copy (the name stays the same)
- Copying between different scopes of the same tool only (must also support cross-tool)
- Modifying server properties during copy (no `--rename`, `--set-url`, etc.)

## Decisions

### 1. Command name: `copy` with alias `cp`
Consistent with Unix convention and the existing `rm` alias pattern. `copy` is the primary name for discoverability.

### 2. Single positional argument: server name
The user provides the server name, and the system auto-discovers where it's installed via `readServers()`. This is simpler than requiring `--from-tool`/`--from-scope` for basic usage.

### 3. Interactive mode is the default
When no target flags are provided, the command enters interactive mode: shows detected installations, lets user pick which source to copy from, then prompts for target tool and scope. This matches the `add` command's UX pattern.

### 4. Non-interactive mode via flags
`--tool` and `--scope` specify the target. `--from-tool` and `--from-scope` narrow the source when a server exists in multiple locations. If source is ambiguous and `--from-*` flags aren't provided in non-interactive mode, exit with an error listing the matches.

### 5. Reuse existing infrastructure
- `readServers()` for source discovery
- `writeServer()` for destination writing
- Translators are implicitly used via the universal model — `readServers()` returns `McpServer` in universal format, and `writeServer()` translates to the target tool's native format
- No new modules needed beyond `src/commands/copy.ts`

### 6. Conflict handling: overwrite with confirmation
If the server already exists at the destination, prompt for confirmation in interactive mode. In non-interactive mode, require `--force` to overwrite. This mirrors the `add` command's overwrite behavior.

## Risks / Trade-offs

- **Server exists in multiple locations** → Interactive mode lets user pick which source; non-interactive mode requires `--from-tool`/`--from-scope` to disambiguate
- **Cross-tool translation edge cases** → The universal model already handles this via translators, so no additional translation logic is needed. Any edge cases (e.g., OpenCode's `enabled` field) are handled by existing `toOpenCode()` which always sets `enabled: true`
- **No project root in non-interactive CI context** → If copying to project scope and no `.git` is found, the existing fallback (CWD with warning) from `configPath` applies
