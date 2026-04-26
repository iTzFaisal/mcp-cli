## 1. Project Setup

- [ ] 1.1 Initialize npm project with TypeScript, configure `tsconfig.json`, set up `bin` entry in `package.json`
- [ ] 1.2 Install dependencies: `commander`, `@clack/prompts`, `picocolors`
- [ ] 1.3 Create entry point `src/index.ts` with Commander program setup and `mcp` binary

## 2. Universal Model & Schema Translation

- [ ] 2.1 Define TypeScript types for the universal MCP server model (`McpServer`, `Transport`, `Scope`, `Tool`)
- [ ] 2.2 Implement `src/translators/claude-code.ts` — translate universal model to/from Claude Code format
- [ ] 2.3 Implement `src/translators/opencode.ts` — translate universal model to/from OpenCode format

## 3. Config I/O

- [ ] 3.1 Implement `src/config/paths.ts` — resolve config file paths for each tool and scope using `os.homedir()`/`path.join()`, handle Windows (`%APPDATA%`) vs macOS/Linux (`~/.config`), detect project root via `.git`
- [ ] 3.2 Implement `src/config/reader.ts` — read and parse MCP configs from Claude Code and OpenCode files
- [ ] 3.3 Implement `src/config/writer.ts` — read full JSON, modify relevant section, write back atomically (create file if missing)

## 4. List Command

- [ ] 4.1 Implement `src/commands/list.ts` — gather servers from all tools/scopes using reader, render unified table with `@clack/prompts` styling
- [ ] 4.2 Add `--tool` and `--scope` filter flags to the list command

## 5. Add Command

- [ ] 5.1 Implement interactive wizard in `src/commands/add.ts` — prompt for tool, scope, transport, command/URL, env vars using `@clack/prompts`
- [ ] 5.2 Implement non-interactive mode with flags (`--tool`, `--scope`, `--transport`, `--command`, `--url`, `--env`)
- [ ] 5.3 Add overwrite confirmation when server already exists in target config
- [ ] 5.4 Write server to target config(s) using writer + translator

## 6. Remove Command

- [ ] 6.1 Implement `src/commands/remove.ts` — find and remove server from target tool/scope config
- [ ] 6.2 Add confirmation prompt before removal (skip with `--yes` flag)
- [ ] 6.3 Handle error when server not found in specified tool/scope

## 7. Polish & Distribution

- [ ] 7.1 Add ASCII logo/banner to CLI help output
- [ ] 7.2 Add `--help` examples and descriptions to all commands
- [ ] 7.3 Build and test the CLI as a global npm package (`npm link` / `npx`)
