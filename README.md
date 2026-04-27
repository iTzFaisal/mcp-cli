# mcp-cli

A unified CLI to manage [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers across **Claude Code** and **OpenCode** — from one place.

Instead of manually editing multiple config files with different formats, use `mcp` to add, list, and remove servers across tools with a single command.

## Prerequisites

- **Node.js** 18+ (ES2022 support required)
- **npm** 9+
- **Claude Code** and/or **OpenCode** installed (to actually use the managed servers)

## Install

```bash
npm install -g @itzfaisal/mcp-cli
```

The `mcp` command is now available globally.

### Install from source

```bash
git clone <repo-url> mcp-cli
cd mcp-cli
npm install
npm run build
npm link
```

## Usage

### List servers

```bash
mcp list                              # all servers across all tools and scopes
mcp list --tool claude                # only Claude Code servers
mcp list --scope project             # only project-level servers
mcp ls -t opencode -s user           # short alias + combined filters
```

### Add a server

**Interactive** (prompts for tool, scope, transport, and command/URL):

```bash
mcp add brave-search
```

**Non-interactive** (all flags provided, no prompts):

```bash
mcp add myserver -t claude -s user --transport stdio --command "npx -y my-server"
mcp add notion -t both -s user --transport http --url "https://mcp.notion.com/mcp"
mcp add myserver -t opencode -s project --transport stdio --command "node server.js" -e API_KEY=xxx
```

Options:

| Flag | Description |
|---|---|
| `-t, --tool <tool>` | `claude`, `opencode`, or `both` |
| `-s, --scope <scope>` | `user` (global) or `project` |
| `--transport <type>` | `stdio` (local command) or `http` (remote URL) |
| `--command <cmd>` | Command for stdio transport (e.g. `"npx -y my-server"`) |
| `--url <url>` | URL for http transport |
| `-e, --env <pairs...>` | Environment variables (`KEY=VALUE`) |

### Remove a server

```bash
mcp rm brave-search                  # interactive confirmation
mcp rm brave-search -y               # skip confirmation
mcp rm notion -t claude -s project   # remove from specific tool/scope
mcp rm myserver --tool both --scope user -y
```

## Config files managed

| Tool | User scope | Project scope |
|---|---|---|
| Claude Code | `~/.claude.json` → `mcpServers` | `./.mcp.json` → `mcpServers` |
| OpenCode | `~/.config/opencode/opencode.json` → `mcp` | `./opencode.json` → `mcp` |

Config files are never fully replaced — `mcp` reads, modifies only the relevant section, and writes back atomically, preserving all other fields.

## Development

```bash
npm install          # install dependencies
npm run build        # compile TypeScript to dist/
npm run dev          # watch-mode compilation
npm test             # run all tests
npm run test:watch   # watch-mode tests
npm run test:coverage # coverage report (v8)
```

### Running a single test

```bash
npx vitest run src/config/reader.test.ts
npx vitest run -t "writes stdio server"
```

> CLI integration tests (`src/cli.test.ts`) run `node dist/index.js` via `execSync` — always build first: `npm run build && npm test`.

## Architecture

```
src/
├── index.ts              # CLI entry point, Commander program setup
├── types.ts              # Universal MCP server model (McpServer, Transport, Scope, Tool)
├── commands/
│   ├── list.ts           # `mcp list` / `mcp ls`
│   ├── add.ts            # `mcp add`
│   └── remove.ts         # `mcp rm` / `mcp remove`
├── config/
│   ├── paths.ts          # Resolves config file paths per tool/scope
│   ├── reader.ts         # Reads and parses servers from all tool configs
│   └── writer.ts         # Read-modify-write for config files
└── translators/
    ├── claude-code.ts    # ↔ Claude Code format (command+args split, stdio|http|sse)
    └── opencode.ts       # ↔ OpenCode format (command as array, local|remote, enabled)
```

## License

MIT
