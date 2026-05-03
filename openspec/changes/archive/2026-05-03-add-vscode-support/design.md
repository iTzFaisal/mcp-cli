## Context

`mcp-cli` normalizes MCP server definitions through a small universal model and translates them into tool-specific config files. That approach already works for Claude Code, OpenCode, and Cline. VS Code fits the same broad pattern, but its MCP support introduces two constraints that matter for this change: the JSON container key is `servers` instead of `mcp` or `mcpServers`, and some VS Code-only features such as top-level `inputs`, `envFile`, sandbox settings, dev mode, profile-specific files, and remote user configs are outside the current universal model.

The user explicitly wants `vscode` as the tool name, local user and workspace support only, `${input:...}` preserved as strings in `env` and `headers`, and `.code-workspace` support deferred.

## Goals / Non-Goals

**Goals:**
- Add `vscode` as a supported tool across the CLI's read/write/list/copy/move/compare/remove flows.
- Support the default local VS Code user `mcp.json` path and workspace `.vscode/mcp.json` path.
- Translate `stdio` and remote `http`/`sse`-style server configs between VS Code and the existing universal model.
- Preserve unrelated top-level JSON fields while modifying VS Code config files.

**Non-Goals:**
- Managing VS Code top-level `inputs` entries.
- Managing `envFile`, sandbox settings, dev mode, or tool enable/disable state stored outside `mcp.json`.
- Supporting VS Code remote user configs, profile-specific user configs, or `.code-workspace` MCP configuration.
- Expanding the universal model beyond the current common subset.

## Decisions

### Decision: Treat VS Code as another common-subset translator target
The CLI will add a dedicated `vscode` translator that maps only the fields already supported by the universal model: `command`, `args`, `env`, `url`, and `headers`.

Rationale:
- This matches the existing architecture and keeps the change small.
- It preserves cross-tool portability as the primary product goal.
- It avoids broadening `McpServer` just to represent one tool's advanced features.

Alternatives considered:
- Expand the universal model to include `inputs`, `envFile`, sandbox, and dev settings. Rejected because it would force a larger redesign and add semantics that the other tools cannot round-trip.

### Decision: Support only default local user config plus workspace config
The path layer will resolve the default local user config path for the current OS and the project-level `.vscode/mcp.json` path.

Rationale:
- This aligns with the requested scope.
- It preserves the existing `user` and `project` scope model without introducing a new remote or profile axis.

Alternatives considered:
- Add profile-aware or remote-user-aware path resolution. Rejected for this change because the repo currently models only two scopes and no profile selection.

### Decision: Ignore VS Code-only enablement metadata and top-level inputs
When reading VS Code config, the universal `disabled` field will remain `undefined`. When writing VS Code config, no enable/disable property will be emitted because VS Code stores that state separately. `${input:...}` values will be passed through as literal strings in `env` or `headers`, but the CLI will not create or update top-level `inputs`.

Rationale:
- This mirrors how Claude Code omits unsupported disabled-state semantics.
- Literal pass-through allows interoperable configs without claiming support for the full VS Code secret-prompting workflow.

Alternatives considered:
- Synthesize top-level `inputs` automatically. Rejected because that requires new CLI UX and cross-file reasoning not present in the current commands.

### Decision: Update supported-destination logic command by command
Commands that enumerate tool/scope combinations will explicitly add VS Code user/project locations while preserving existing unsupported combinations such as Cline project scope.

Rationale:
- The repo already handles tool/scope support in command logic.
- This keeps behavior predictable for list, compare, copy, and move flows.

## Risks / Trade-offs

- [Users expect full VS Code parity] → Document that `inputs`, `envFile`, sandbox settings, dev mode, profiles, remote configs, and `.code-workspace` are out of scope.
- [Literal `${input:...}` strings may not be sufficient by themselves] → Preserve them without modification and document that matching top-level `inputs` must be managed manually.
- [Tool enumeration becomes more repetitive across commands] → Reuse existing patterns and keep VS Code support aligned with current command-specific validation.
- [Path assumptions may drift if VS Code changes user config storage again] → Limit scope to the documented default local path and cover it with path tests.

## Migration Plan

No data migration is required. This is an additive CLI capability. Existing Claude Code, OpenCode, and Cline behavior remains unchanged.

Implementation rollout can follow the current test structure:
1. Add VS Code path and translator coverage.
2. Extend config reader/writer behavior.
3. Extend command behavior and integration tests.

Rollback strategy: remove `vscode` from the supported tool list and revert the added translator/path/config command changes.

## Open Questions

- None for this proposal scope. Future work can revisit `.code-workspace`, remote user config support, and VS Code `inputs` management as separate changes.
