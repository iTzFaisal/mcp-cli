## Context

The CLI tool (`mcps`) manages MCP server configurations across multiple coding agents (Claude Code, OpenCode) and scopes (user, project). Existing commands include `add`, `remove`, `copy`, and `list`. The `copy` command (`copy.ts`) already implements the pattern of reading a server from one location and writing it to another, but leaves the original intact. The `move` command builds on this same infrastructure — `readServers`, `writeServer`, `removeServer` — to provide atomic relocation.

The codebase uses Commander.js for CLI, `@clack/prompts` for interactive flows, and `picocolors` for terminal colors. All commands follow the same dual-mode pattern: non-interactive when required flags are present, interactive wizard otherwise.

## Goals / Non-Goals

**Goals:**
- Provide a `move` (alias `mv`) command that relocates an MCP server from one tool/scope to another
- Auto-detect the server's current location and present it to the user
- Support both interactive (wizard) and non-interactive (CLI flags) modes
- Ensure atomic semantics: only remove from source after successful destination write
- Reuse existing config layer functions (`readServers`, `writeServer`, `removeServer`)

**Non-Goals:**
- Moving multiple servers at once (batch move)
- Moving servers between scopes within the same tool only (no partial moves)
- Modifying the translator or config path infrastructure
- Changing the `copy` command behavior

## Decisions

### 1. Command structure mirrors `copy`
The `move` command accepts the same flags as `copy` (`--tool`, `--scope`, `--from-tool`, `--from-scope`, `--force`) and follows the same dual-mode dispatch pattern. This keeps the CLI consistent and predictable.

### 2. Move = write + remove (not a rename)
The implementation calls `writeServer` to the destination, then `removeServer` from the source. This is simpler and more robust than trying to manipulate config files directly, and reuses battle-tested functions. The remove step only executes after the write succeeds.

### 3. Source auto-detection with disambiguation
When a server exists in only one location, it's used automatically. When it exists in multiple locations, the interactive mode prompts the user to pick; the non-interactive mode requires `--from-tool`/`--from-scope` flags or exits with an error listing the matches.

### 4. Same-source/same-destination guard
If the destination matches the source (same tool and scope), the command exits with an error — there's nothing to move.

### 5. Overwrite handling
- Interactive: prompt with confirmation dialog
- Non-interactive: requires `--force` flag, otherwise error

## Risks / Trade-offs

- **Partial failure (write succeeds, remove fails)**: Extremely unlikely since both are simple file operations, but if it happens the server exists in both locations — functionally equivalent to a `copy`. No rollback needed since the server is not lost. → Accept this risk; document in help text that move is copy-then-remove.
- **Concurrent config modification**: If another process edits the config between read and write, data could be lost. → Same risk exists for all commands; the read-modify-write pattern already handles this.
- **No transaction guarantees**: The two-step (write + remove) is not atomic at the filesystem level. → Acceptable trade-off for a CLI tool.
