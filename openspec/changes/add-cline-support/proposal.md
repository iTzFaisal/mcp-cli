## Why

Cline (VSCode extension `saoudrizwan.claude-dev`) is a popular coding agent that uses MCP servers, but this CLI tool only supports Claude Code and OpenCode. Adding Cline support makes this a true unified MCP manager across three major coding agents.

## What Changes

- Add `cline` as a new tool alongside `claude` and `opencode`
- New Cline translator (`src/translators/cline.ts`) for bidirectional conversion between the universal model and Cline's JSON format
- Cline config path resolution with platform detection (macOS/Windows/Linux)
- Cline is **user-scope only** — project scope is not supported (Cline stores config in VSCode's global extension storage)
- **BREAKING**: Replace `--tool both` with `--tool all` across all commands. `both` will no longer be accepted.
- Add `disabled?: boolean` to the universal `McpServer` model, mapping to Cline's `disabled` and OpenCode's `enabled` (inverted)
- `mcps list` will show disabled state for servers across all tools

## Capabilities

### New Capabilities
- `cline-translator`: Bidirectional translation between universal McpServer model and Cline's `cline_mcp_settings.json` format
- `cline-paths`: Platform-aware config file path resolution for Cline

### Modified Capabilities
- `tool-selection`: CLI tool option changes from `claude|opencode|both` to `claude|opencode|cline|all` (**BREAKING**)
- `universal-model`: Add optional `disabled` field to `McpServer` type

## Impact

- `src/types.ts` — `Tool` union type, `McpServer` interface
- `src/config/paths.ts` — new `clineUserPath()`, updated `configPath()`
- `src/config/reader.ts` — new `readClineServers()`, updated dispatch
- `src/config/writer.ts` — updated `writeServer()` and `removeServer()` for Cline branch
- `src/translators/cline.ts` — new file
- `src/translators/cline.test.ts` — new file
- `src/translators/claude-code.ts` — handle `disabled` field
- `src/translators/opencode.ts` — map `enabled` → `disabled`
- `src/commands/*.ts` — all commands: `both` → `all`, add `cline` option
- `src/index.ts` — updated description
- Existing tests for translators and commands need updates
