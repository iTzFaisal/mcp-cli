## 1. Add Command UX

- [x] 1.1 Update `src/commands/add.ts` so `stdio` and `http` transports collect different follow-up inputs, with `http` prompting for headers instead of environment variables using the same comma-separated `KEY=VALUE` entry style.
- [x] 1.2 Add non-interactive remote-header input for `mcps add` and validate that header-oriented flags are used only with `http` transport while `--env` remains for `stdio`.
- [x] 1.3 Update add command help text, prompts, and examples to show authenticated remote MCP usage, including the interactive placeholder `Authorization=Bearer API_KEY,OTHER=val`.

## 2. Remote Header Translation

- [x] 2.1 Extend the Cline translator types and conversion logic to preserve remote `headers`, including `Authorization`, when translating to and from the universal model.
- [x] 2.2 Verify the existing read/write path continues to preserve unrelated config fields while writing authenticated remote servers for Claude Code, OpenCode, and Cline.

## 3. Cross-Command Verification

- [x] 3.1 Add translator tests covering Cline remote header round-tripping.
- [x] 3.2 Add command/config tests covering interactive and non-interactive `mcps add` flows for authenticated remote servers.
- [x] 3.3 Add copy and move regression tests proving remote `Authorization` headers survive cross-tool operations when Cline is a source or destination.
- [x] 3.4 Run `npm run build && npm test` and fix any failures before marking the change complete.
