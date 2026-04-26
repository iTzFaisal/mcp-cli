## Why

MCP server configurations are scattered across multiple tools (Claude Code, OpenCode) with different file locations, JSON schemas, and no unified way to manage them. Adding the same MCP server to both tools requires editing separate config files in different formats — a tedious and error-prone process. A single CLI tool that manages MCP servers across all tools from one place solves this.

## What Changes

- New interactive CLI tool (`mcp-cli`) built in TypeScript
- `mcp list` — display all MCP servers across Claude Code and OpenCode in a unified view
- `mcp add <name>` — interactively add an MCP server to one or both tools, at user or project scope
- `mcp rm <name>` — remove an MCP server from one or both tools
- Automatic translation between Claude Code and OpenCode JSON schemas
- Pretty, modern terminal UI using `@clack/prompts`

## Capabilities

### New Capabilities
- `mcp-list`: List all configured MCP servers across tools and scopes
- `mcp-add`: Interactively add an MCP server to one or both tools
- `mcp-remove`: Remove an MCP server from one or both tools
- `config-io`: Read and write MCP configs for Claude Code and OpenCode formats
- `schema-translate`: Translate between Claude Code and OpenCode MCP JSON schemas

### Modified Capabilities

## Impact

- New npm package with `mcp` binary
- Reads/writes to `~/.claude.json`, `~/.config/opencode/opencode.json`, `./.mcp.json`, `./opencode.json`
- Dependencies: TypeScript, Commander.js, `@clack/prompts`
- No changes to Claude Code or OpenCode themselves — this is a standalone config management tool
