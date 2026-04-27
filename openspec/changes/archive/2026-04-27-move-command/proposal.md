## Why

Users who work with multiple coding agents (Claude Code, OpenCode) need to relocate MCP servers between tools and scopes without manual config editing. While `copy` duplicates a server, it leaves the original behind — forcing a manual `remove` step. A dedicated `move` command combines copy + remove into a single atomic operation with both interactive and non-interactive modes.

## What Changes

- Add a new `move` CLI command (alias `mv`) that relocates an MCP server from one tool/scope to another
- Command accepts a server name, auto-detects where it's installed, then either interactively prompts or accepts CLI flags for the destination
- Interactive mode: detect source location → show it → prompt for target tool and scope → confirm overwrite if exists → write to destination → remove from source
- Non-interactive mode: `--tool`, `--scope`, `--from-tool`, `--from-scope`, `--force` flags for scripting use
- Supports `--tool both` to move to both agents simultaneously
- Atomic semantics: server is only removed from source after successful write to destination

## Capabilities

### New Capabilities
- `mcp-move`: Interactive and non-interactive MCP server relocation between tools and scopes, combining copy + remove into a single operation with auto-detection of source location

### Modified Capabilities
<!-- No existing spec-level behavior changes required -->

## Impact

- New file: `src/commands/move.ts` and `src/commands/move.test.ts`
- `src/index.ts`: register the new `move` subcommand
- Reuses existing `readServers`, `writeServer`, `removeServer` from config layer
- No changes to translators, config paths, or types
