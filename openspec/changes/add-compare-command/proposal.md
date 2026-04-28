## Why

Users who manage the same MCP server across Claude Code, OpenCode, and Cline need a quick way to see where a server is already configured and where it is missing. Today they have to inspect `list` output or check config files manually, which makes it harder to keep tool configurations aligned and know which `copy` command to run next.

## What Changes

- Add a new `compare` command that accepts an MCP server name and reports every supported tool/scope location where that server is configured or missing
- Show actionable copy hints for each missing location so users can fill gaps with a follow-up `copy` command
- Support an interactive mode that guides the user through selecting a server name and reviewing missing targets
- Support a non-interactive mode for direct CLI usage and scripting with positional/flag-driven input
- Reuse the existing universal model and configuration readers so compare results stay consistent across tools

## Capabilities

### New Capabilities
- `mcp-compare`: Compare a named MCP server across all supported tool and scope locations, highlight missing configurations, and suggest copy commands in both interactive and non-interactive flows

### Modified Capabilities

## Impact

- New file: `src/commands/compare.ts` for command behavior and output formatting
- Modified file: `src/index.ts` to register the new command
- Existing infrastructure reused: `readServers()` for discovery, config path resolution for human-readable locations, and the `copy` command contract for generated hint commands
- New tests for compare discovery, rendering, interactive prompts, and non-interactive output
