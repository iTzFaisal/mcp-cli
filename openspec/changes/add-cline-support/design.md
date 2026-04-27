## Context

The CLI (`mcps`) currently manages MCP server configs for two coding agents: Claude Code and OpenCode. Each agent has a translator module (`src/translators/`) that converts between a universal `McpServer` model and the agent's native JSON format. Config paths are resolved per tool/scope in `src/config/paths.ts`.

Cline is a third coding agent (VSCode extension) that stores MCP config in a single user-scoped JSON file at a platform-dependent path inside VSCode's extension storage.

## Goals / Non-Goals

**Goals:**
- Add Cline as a first-class supported tool alongside Claude Code and OpenCode
- Extend the universal model with a `disabled` field to represent enabled/disabled state across tools
- Update CLI tool selection from `claude|opencode|both` to `claude|opencode|cline|all`
- Keep the implementation pattern consistent with existing translators

**Non-Goals:**
- Supporting Cline project-scope config (Cline doesn't have one)
- Managing Cline-specific fields like `autoApprove` or `timeout` in the universal model
- Preserving `autoApprove` or `timeout` during copy/move operations (these are omitted)
- Backward compatibility with `--tool both` (clean break)

## Decisions

### D1: Cline is user-scope only
Cline stores its config inside VSCode's global extension storage (`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` on macOS). There is no project-level config file. If a user runs `mcps add foo -t cline -s project`, the system SHALL reject it with an error.

**Alternative considered**: Silently fall back to user scope. Rejected — explicit is better than implicit for a scope mismatch.

### D2: Add `disabled?: boolean` to the universal model
Two of three tools (Cline, OpenCode) have an enable/disable concept. Adding it to `McpServer` allows `mcps list` to show disabled state and `mcps copy` to preserve it across tools.

Mapping:
- Cline: `disabled: false` → `disabled: false` (direct)
- OpenCode: `enabled: true` → `disabled: false` (inverted)
- Claude Code: no field → `disabled: undefined` (omitted on read, omitted on write)

**Alternative considered**: Keep `disabled` as a Cline-specific detail. Rejected — it's a cross-cutting concern and the cost of one optional field is minimal.

### D3: Replace `both` with `all`
With three supported tools, `both` is semantically wrong. `all` means claude + opencode + cline. This is a breaking change — `--tool both` will produce an error.

### D4: Cline translator mirrors Claude Code structure
Cline's JSON format is very similar to Claude Code's: same `mcpServers` top-level key, same `command`+`args` split. The translator will follow the same pattern as `claude-code.ts` but with Cline-specific field handling (`disabled`, `timeout` default).

### D5: Cline-specific fields not in universal model
`autoApprove` and `timeout` are Cline-specific and not represented in the universal model. On write, `timeout` defaults to 60 seconds. `autoApprove` is omitted (empty array).

### D6: Platform-aware path resolution
Cline's config path differs per OS. `paths.ts` will use `process.platform` to select the correct base directory:
- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/`
- Windows: `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/`

## Risks / Trade-offs

**[Breaking change: `both` → `all`]** → Mitigation: clear error message: `"both" is not supported. Use "all" for all tools, or specify claude, opencode, or cline.`

**[Cline path depends on VSCode being installed]** → Mitigation: just resolve the path. If the file doesn't exist, `readOrInit` creates it. If the directory doesn't exist, `ensureDir` creates it. No VSCode installation check needed.

**[Cline config format may change]** → Mitigation: translators are isolated. Format changes only require updating `cline.ts`.
