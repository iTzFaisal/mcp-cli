## Why

`mcp-cli` currently manages Claude Code, OpenCode, and Cline MCP server configurations, but it cannot manage the `mcp.json` files used by VS Code. VS Code now has a first-party MCP workflow, so adding local user and workspace support expands the tool's portability without changing its cross-tool, common-subset design.

## What Changes

- Add `vscode` as a supported tool name throughout the CLI.
- Support VS Code local user-scope MCP config and workspace-scope `.vscode/mcp.json` config.
- Add translation between the universal MCP server model and VS Code's `servers` schema for `stdio` and `http`/`sse` style servers.
- Extend read/write/remove/list/copy/move/compare flows to include VS Code wherever the destination or source is supported.
- Keep VS Code-only advanced fields such as top-level `inputs`, `envFile`, sandbox settings, dev mode, remote user configs, and non-default profiles out of scope for this change.

## Capabilities

### New Capabilities
- `vscode-paths`: Resolve the default local VS Code user MCP config path and the workspace `.vscode/mcp.json` path.
- `vscode-translator`: Translate MCP server definitions between the universal model and VS Code's native `servers` schema.

### Modified Capabilities
- `config-io`: Read, write, and remove servers from VS Code MCP config files while preserving unrelated JSON fields.
- `mcp-add`: Allow adding servers to VS Code in interactive and non-interactive flows.
- `mcp-list`: Include VS Code locations in unified server listings and tool filters.
- `mcp-copy`: Allow copying servers to and from VS Code using the universal model.
- `mcp-move`: Allow moving servers to and from VS Code using the universal model.
- `mcp-compare`: Include VS Code user and project locations in comparison output and generated copy hints.
- `mcp-remove`: Allow removing servers from VS Code user and project configs.

## Impact

- Affected code: `src/types.ts`, `src/config/*`, `src/translators/*`, `src/commands/*`, `src/index.ts`, and related tests.
- Affected behavior: all CLI commands that enumerate supported tools or supported tool/scope destinations.
- Constraints: support only the default local VS Code user config plus `.vscode/mcp.json`; preserve `${input:...}` values as literal strings in `env` and `headers` without managing top-level `inputs`.
