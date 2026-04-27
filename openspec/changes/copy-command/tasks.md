## 1. Command Skeleton

- [ ] 1.1 Create `src/commands/copy.ts` with Commander definition: `new Command("copy").alias("cp")`, positional `<name>` argument, options (`--tool`, `--scope`, `--from-tool`, `--from-scope`, `--force`), help text with examples
- [ ] 1.2 Register `copyCommand` in `src/index.ts` via `program.addCommand(copyCommand)`

## 2. Source Discovery

- [ ] 2.1 Implement source lookup: call `readServers()` without filters to find all `LocatedServer` entries matching the given name
- [ ] 2.2 Handle "not found" case: log error and `process.exit(1)` if no matches
- [ ] 2.3 Handle "ambiguous source" in non-interactive mode: if multiple matches and no `--from-tool`/`--from-scope`, list locations and exit with error

## 3. Non-Interactive Mode

- [ ] 3.1 When `--tool` and `--scope` are provided, resolve source (using `--from-tool`/`--from-scope` if supplied, or auto-detect if single match)
- [ ] 3.2 Build `McpServer` from the source `LocatedServer` and call `writeServer()` for the target tool/scope
- [ ] 3.3 Support `--tool both` to write to both Claude Code and OpenCode
- [ ] 3.4 Implement overwrite protection: check if server exists at destination, block without `--force`, overwrite with `--force`

## 4. Interactive Mode

- [ ] 4.1 When no `--tool`/`--scope` flags are provided, enter interactive wizard using `@clack/prompts`
- [ ] 4.2 If multiple sources found, show a select prompt listing locations; if single source, auto-select and display it
- [ ] 4.3 Prompt for target tool (Claude Code, OpenCode, Both) via clack select
- [ ] 4.4 Prompt for target scope (User, Project) via clack select
- [ ] 4.5 Check for existing server at destination and prompt for overwrite confirmation

## 5. Tests

- [ ] 5.1 Unit tests for source discovery: server found in single location, multiple locations, not found
- [ ] 5.2 CLI integration tests for non-interactive mode: copy across tools, copy across scopes, overwrite with `--force`, error on missing server, error on ambiguous source
- [ ] 5.3 CLI integration tests for overwrite protection: blocked without `--force`, succeeds with `--force`
