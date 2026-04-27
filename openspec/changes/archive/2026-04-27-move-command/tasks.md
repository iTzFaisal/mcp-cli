## 1. Command Registration

- [x] 1.1 Create `src/commands/move.ts` with Commander `move` command definition, alias `mv`, required `<name>` argument, and options (`--tool`, `--scope`, `--from-tool`, `--from-scope`, `--force`)
- [x] 1.2 Register the move command in `src/index.ts`
- [x] 1.3 Add help text with interactive and non-interactive usage examples

## 2. Non-Interactive Mode

- [x] 2.1 Implement `runNonInteractive` function: validate flags, resolve source server, check same-source/destination guard
- [x] 2.2 Add overwrite guard (error without `--force`, overwrite with `--force`)
- [x] 2.3 Implement write-to-destination then remove-from-source logic with proper success/error messages
- [x] 2.4 Handle `--tool both` to write to both claude and opencode before removing source
- [x] 2.5 Handle ambiguous source error (multiple matches without `--from-tool`/`--from-scope`)

## 3. Interactive Mode

- [x] 3.1 Implement `runInteractive` function with `@clack/prompts` wizard: source auto-detection or selection prompt
- [x] 3.2 Add destination tool selection prompt (Claude Code / OpenCode / Both)
- [x] 3.3 Add destination scope selection prompt (User / Project)
- [x] 3.4 Add overwrite confirmation prompt when destination already exists
- [x] 3.5 Handle cancel (user aborts any prompt) — exit cleanly with no changes
- [x] 3.6 Implement write-then-remove logic in interactive flow with success messages and outro

## 4. Tests

- [x] 4.1 Create `src/commands/move.test.ts` with unit tests for non-interactive mode (happy path, same source/destination, overwrite guard, server not found, ambiguous source)
- [x] 4.2 Add unit tests for interactive mode (single source auto-detect, multiple source selection, overwrite confirmation, cancel handling)
- [x] 4.3 Add test for `--tool both` target expansion
- [x] 4.4 Verify build passes (`npm run build`) and all tests pass (`npm test`)
