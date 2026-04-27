# AGENTS.md

## Package

- Published as **`@itzfaisal/mcp-cli`** on npm
- Install: `npm install -g @itzfaisal/mcp-cli`
- Binary: `mcps`

## Commands

- `npm run build` — compile TS (`tsc`), output to `dist/`
- `npm test` — run all tests once (`vitest run`)
- `npm run test:watch` — watch mode
- `npm run test:coverage` — coverage report (v8)
- `npm run dev` — watch-mode TS compilation
- `npm publish --access public` — publish to npm (requires auth)

Always build before testing CLI integration tests: `npm run build && npm test`.

## Running a single test

```
npx vitest run src/config/reader.test.ts
npx vitest run -t "writes stdio server"
```

## Architecture

- `src/index.ts` — CLI entry point, Commander program setup, `mcp` binary
- `src/types.ts` — universal MCP server model (`McpServer`, `Transport`, `Scope`, `Tool`, `disabled`)
- `src/translators/` — bidirectional translation between universal model and tool-native formats
  - `claude-code.ts` ↔ `mcpServers` key, `command`+`args` split, types `stdio`|`http`|`sse`
  - `opencode.ts` ↔ `mcp` key, `command` as array, types `local`|`remote`, has `enabled`
  - `cline.ts` ↔ `mcpServers` key, `command`+`args` split, types `streamableHttp`|`sse`, has `disabled`
- `src/config/paths.ts` — resolves config file paths per tool/scope, detects project root via `.git`
- `src/config/reader.ts` — reads and parses servers from all tool configs
- `src/config/writer.ts` — reads full JSON, modifies relevant section, writes back atomically
- `src/commands/` — Commander subcommands: `list.ts`, `add.ts`, `remove.ts`, `copy.ts`

## Key conventions

- ESM only (`"type": "module"`), Node16 module resolution — imports must use `.js` extensions
- Tests are co-located with source (`src/**/*.test.ts`), run via Vitest
- Config files are never fully replaced — always read-modify-write to preserve unrelated fields
- Two scopes only: `user` and `project` (no Claude Code "local" scope)

## Config file paths the tool manages

| Tool        | User scope                                                                                                                     | Project scope                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Claude Code | `~/.claude.json` → `mcpServers`                                                                                                | `./.mcp.json` → `mcpServers` |
| OpenCode    | `~/.config/opencode/opencode.json` → `mcp`                                                                                     | `./opencode.json` → `mcp`    |
| Cline       | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` → `mcpServers` | N/A (user-scope only)        |

## Testing notes

- CLI integration tests in `src/cli.test.ts` run `node dist/index.js` via `execSync` — requires a prior build
- Unit tests mock `configPath` via `vi.spyOn(pathsModule, "configPath")` to isolate filesystem
- Error cases in commands log and return (exit 0) rather than throwing, except `rm` uses `process.exit(1)` when server not found
