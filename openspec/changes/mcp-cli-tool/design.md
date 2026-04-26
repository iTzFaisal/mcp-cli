## Context

MCP servers are configured differently across tools:
- **Claude Code**: `mcpServers` key, `command`+`args` split, `env`, types `stdio`|`http`|`sse`
- **OpenCode**: `mcp` key, `command` as array, `environment`, types `local`|`remote`, has `enabled` and `timeout`

Config file locations (macOS/Linux):
- Claude Code user scope: `~/.claude.json` (top-level `mcpServers`)
- Claude Code project scope: `./.mcp.json` (`mcpServers`)
- OpenCode user scope: `~/.config/opencode/opencode.json` (`mcp`)
- OpenCode project scope: `./opencode.json` (`mcp`)

Config file locations (Windows):
- Claude Code user scope: `%USERPROFILE%\.claude.json`
- OpenCode user config: `%USERPROFILE%\.config\opencode\opencode.json`

Both tools already have their own `mcp add/list/remove` CLIs. This tool's value is cross-tool unification — one command to manage both.

## Goals / Non-Goals

**Goals:**
- Unified `mcp list`/`mcp add`/`mcp rm` across Claude Code and OpenCode
- Interactive prompts with modern terminal UI (`@clack/prompts`)
- Schema translation between the two tools' config formats
- Support user and project scopes only
- Distribute as npm package with `mcp` binary
- Cross-platform support: macOS, Linux, Windows

**Non-Goals:**
- Full-screen TUI/dashboard
- MCP server health checking or status monitoring
- OAuth flow handling
- Environment variable interpolation/translation (`${VAR}` vs `{env:VAR}`)
- Claude Code's "local" scope (per-project private in `~/.claude.json`)
- OpenCode per-agent tool management
- Managed/enterprise MCP configs

## Decisions

### 1. TypeScript with Commander.js + @clack/prompts
- **Choice**: TypeScript, Commander.js for CLI parsing, `@clack/prompts` for interactive UI
- **Alternatives**: Cliffy (Deno-first), Ink (React-for-terminal, overkill), Go+BubbleTea (different ecosystem)
- **Rationale**: Both target tools are JS-based, JSON handling is native, npm distribution is straightforward. `@clack/prompts` gives the exact aesthetic we want without heavyweight dependencies.

### 2. Internal universal model for MCP servers
- **Choice**: Parse each tool's format into a universal TypeScript type, then write back in the target format
- **Rationale**: Clean separation between reading/writing config and the CLI logic. Makes adding future tools (Cursor, Windsurf, etc.) straightforward — just add a new translator.

### 3. Two scopes only: user and project
- **Choice**: Only support `user` and `project` scopes
- **Rationale**: Simplifies the mental model. Claude Code's "local" scope (private per-project in `~/.claude.json`) is confusing and has no OpenCode equivalent. If users want project-scoped, they use project. If global, they use user.

### 4. Secrets stored as plain text
- **Choice**: User enters API keys directly, stored as plain text in config files
- **Rationale**: Both tools already store secrets as plain text. No need for a secret manager. Users are responsible for their own keys. This matches existing behavior of `claude mcp add --env KEY=value`.

### 5. Remove = delete entirely (no disable toggle)
- **Choice**: `mcp rm` removes the server config completely. No "disable" concept.
- **Rationale**: OpenCode has `enabled: false`, Claude Code doesn't. Supporting both behaviors adds complexity for little gain. Users who want to temporarily disable can re-add.

### 6. Project root detection via `.git`
- **Choice**: Walk up from CWD to find `.git` directory to determine project root
- **Rationale**: Standard convention. Both tools already expect project configs at the repo root.

### 7. Cross-platform path resolution
- **Choice**: Use Node.js `os.homedir()` and `path.join()` for all path construction. Both Claude Code and OpenCode use `~/.claude.json` and `~/.config/opencode/opencode.json` respectively on all platforms (including Windows via `%USERPROFILE%`). Use `path.sep`-aware logic for project root walking.
- **Rationale**: Node's `path` module and `os` module handle platform differences natively. No need for a cross-platform path library. Project-scope paths (`.mcp.json`, `opencode.json`) are the same on all platforms.

## Risks / Trade-offs

- **Corrupting existing configs** → Read full JSON, modify in memory, write back atomically. Backup before write in v1.
- **Claude Code `~/.claude.json` is large and has non-MCP content** → Only read/modify the `mcpServers` top-level key and `projects["path"].mcpServers`. Never touch other fields.
- **Race condition with running tools** → Accept this risk for v1. Config changes require tool restart anyway.
- **`mcp` binary name conflicts** → Could conflict with other tools. Mitigate with clear npm package name (`mcp-cli-manager` or similar). The binary name `mcp` is desirable but may need fallback.
