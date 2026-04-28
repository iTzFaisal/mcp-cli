# mcps

**`npx skills` for MCP servers.** A unified CLI to manage [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) servers across **Claude Code**, **OpenCode**, and **Cline** — from one place.

## Vision

[`npx skills`](https://github.com/vercel-labs/skills) made it trivial to discover and install agent skills from GitHub repos into any AI coding tool. `mcps` does the same for MCP servers — one command to find, add, and configure MCP servers across Claude Code, OpenCode, Cline, and beyond. No more manually hunting down config files and copy-pasting JSON. Just `mcps add <server>` and you're done.

## Prerequisites

- **Node.js** 18+ (ES2022 support required)
- **npm** 9+
- **Claude Code**, **OpenCode**, and/or **Cline** installed (to actually use the managed servers)

## Install

```bash
npm install -g @itzfaisal/mcp-cli
```

The `mcps` command is now available globally.

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
mcps list                              # all servers across all tools and scopes
mcps list --tool claude                # only Claude Code servers
mcps list --scope project             # only project-level servers
mcps ls -t opencode -s user           # short alias + combined filters
```

### Add a server

**Interactive** (prompts for tool, scope, transport, and command/URL):

```bash
mcps add brave-search
```

**Non-interactive** (all flags provided, no prompts):

```bash
mcps add myserver -t claude -s user --transport stdio --command "npx -y my-server"
mcps add notion -t all -s user --transport http --url "https://mcp.notion.com/mcp"
mcps add myserver -t opencode -s project --transport stdio --command "node server.js" -e API_KEY=xxx
```

Options:

| Flag                   | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `-t, --tool <tool>`    | `claude`, `opencode`, `cline`, or `all`                 |
| `-s, --scope <scope>`  | `user` (global) or `project`                            |
| `--transport <type>`   | `stdio` (local command) or `http` (remote URL)          |
| `--command <cmd>`      | Command for stdio transport (e.g. `"npx -y my-server"`) |
| `--url <url>`          | URL for http transport                                  |
| `-e, --env <pairs...>` | Environment variables (`KEY=VALUE`)                     |

### Copy a server

```bash
mcps copy brave-search                           # interactive wizard
mcps cp brave-search --tool opencode --scope user
mcps copy notion --tool claude --scope project --from-tool opencode --from-scope user
mcps cp myserver --tool all --scope user --force
```

Options:

| Flag                   | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `-t, --tool <tool>`    | Target tool: `claude`, `opencode`, `cline`, or `all`       |
| `-s, --scope <scope>`  | Target scope: `user` or `project`                          |
| `--from-tool <tool>`   | Source tool (disambiguate when server exists in multiple)  |
| `--from-scope <scope>` | Source scope (disambiguate when server exists in multiple) |
| `-f, --force`          | Overwrite if server already exists at destination          |

### Move a server

```bash
mcps move brave-search                           # interactive wizard
mcps mv brave-search --tool opencode --scope user
mcps move notion --tool claude --scope project --from-tool opencode --from-scope user
mcps mv myserver --tool all --scope user --force
```

Options:

| Flag                   | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `-t, --tool <tool>`    | Target tool: `claude`, `opencode`, `cline`, or `all`       |
| `-s, --scope <scope>`  | Target scope: `user` or `project`                          |
| `--from-tool <tool>`   | Source tool (disambiguate when server exists in multiple)  |
| `--from-scope <scope>` | Source scope (disambiguate when server exists in multiple) |
| `-f, --force`          | Overwrite if server already exists at destination          |

### Compare a server

```bash
mcps compare brave-search             # show where it is already configured
mcps compare                          # interactive selection in a TTY
```

`compare` checks the supported locations for one MCP server across Claude Code, OpenCode, and Cline, then shows:

- where the server is already configured
- which supported tool/scope locations are still missing
- ready-to-run `mcps copy ...` commands to fill in the missing locations

### Remove a server

```bash
mcps rm brave-search                  # interactive confirmation
mcps rm brave-search -y               # skip confirmation
mcps rm notion -t claude -s project   # remove from specific tool/scope
mcps rm myserver --tool all --scope user -y
```

## Config files managed

| Tool        | User scope                                                                                                                     | Project scope                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Claude Code | `~/.claude.json` → `mcpServers`                                                                                                | `./.mcp.json` → `mcpServers` |
| OpenCode    | `~/.config/opencode/opencode.json` → `mcp`                                                                                     | `./opencode.json` → `mcp`    |
| Cline       | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` → `mcpServers` | N/A (user-scope only)        |

Config files are never fully replaced — `mcps` reads, modifies only the relevant section, and writes back atomically, preserving all other fields.

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
│   ├── list.ts           # `mcps list` / `mcps ls`
│   ├── add.ts            # `mcps add`
│   ├── copy.ts           # `mcps copy` / `mcps cp`
│   ├── move.ts           # `mcps move` / `mcps mv`
│   ├── compare.ts        # `mcps compare`
│   └── remove.ts         # `mcps rm` / `mcps remove`
├── config/
│   ├── paths.ts          # Resolves config file paths per tool/scope
│   ├── reader.ts         # Reads and parses servers from all tool configs
│   └── writer.ts         # Read-modify-write for config files
└── translators/
    ├── claude-code.ts    # ↔ Claude Code format (command+args split, stdio|http|sse)
    ├── opencode.ts       # ↔ OpenCode format (command as array, local|remote, enabled)
    └── cline.ts          # ↔ Cline format (command+args split, streamableHttp|sse, disabled)
```

## License

MIT
