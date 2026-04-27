## 1. Universal Model

- [ ] 1.1 Add `"cline"` to the `Tool` union type in `src/types.ts`
- [ ] 1.2 Add `disabled?: boolean` to the `McpServer` interface in `src/types.ts`

## 2. Cline Translator

- [ ] 2.1 Create `src/translators/cline.ts` with `ClineServer` interface, `fromCline()`, and `toCline()` functions
- [ ] 2.2 Create `src/translators/cline.test.ts` with tests for all translation scenarios (stdio, http/streamableHttp, sse, disabled, autoApprove/timeout omission, env, headers)

## 3. Existing Translators — Disabled Field

- [ ] 3.1 Update `src/translators/claude-code.ts` to omit `disabled` on write, leave `undefined` on read
- [ ] 3.2 Update `src/translators/opencode.ts` to map `enabled` ↔ `disabled` (inverted) on read and write
- [ ] 3.3 Update `src/translators/claude-code.test.ts` for disabled handling
- [ ] 3.4 Update `src/translators/opencode.test.ts` for disabled/enabled mapping

## 4. Config Paths

- [ ] 4.1 Add `clineUserPath()` to `src/config/paths.ts` with platform detection (macOS/Linux/Windows)
- [ ] 4.2 Update `configPath()` to handle `"cline"` tool — user scope resolves to `clineUserPath()`, project scope throws an error

## 5. Config Reader & Writer

- [ ] 5.1 Add `readClineServers()` to `src/config/reader.ts` using `fromCline()` translator
- [ ] 5.2 Update `readServers()` dispatch to include `"cline"` tool
- [ ] 5.3 Update `writeServer()` in `src/config/writer.ts` to handle `"cline"` branch (write to `mcpServers` key)
- [ ] 5.4 Update `removeServer()` in `src/config/writer.ts` to handle `"cline"` branch

## 6. CLI Commands — Tool Selection

- [ ] 6.1 Update `src/commands/add.ts`: change tool options to `claude|opencode|cline|all`, reject `both`, reject `cline` with project scope
- [ ] 6.2 Update `src/commands/list.ts`: add `cline` as filter option
- [ ] 6.3 Update `src/commands/remove.ts`: add `cline` as tool option
- [ ] 6.4 Update `src/commands/copy.ts`: add `cline` as source/destination option
- [ ] 6.5 Update `src/commands/move.ts`: add `cline` as source/destination option

## 7. Entry Point & Docs

- [ ] 7.1 Update `src/index.ts` description to mention Cline
- [ ] 7.2 Update `AGENTS.md` config file paths table with Cline row

## 8. Build & Test

- [ ] 8.1 Run `npm run build && npm test` — fix any failures
- [ ] 8.2 Verify CLI integration: `node dist/index.js list --tool cline`
