## MODIFIED Requirements

### Requirement: Copy MCP server to another tool or scope
The system SHALL provide a `copy` command (alias `cp`) that duplicates an existing MCP server configuration to a different tool, scope, or both, preserving all server properties (command/url, env, headers) via the universal model.

#### Scenario: Copy from Claude Code user to OpenCode user
- **WHEN** user runs `mcps copy brave-search --tool opencode --scope user` and the server exists in Claude Code user scope
- **THEN** system reads the server from `~/.claude.json` (mcpServers), translates it via the universal model, and writes it to `~/.config/opencode/opencode.json` (mcp)

#### Scenario: Copy from OpenCode project to Claude Code project
- **WHEN** user runs `mcps cp notion --tool claude --scope project` and the server exists in OpenCode project scope
- **THEN** system reads the server from `./opencode.json` (mcp), translates it, and writes it to `./.mcp.json` (mcpServers)

#### Scenario: Copy across both tool and scope
- **WHEN** user runs `mcps copy myserver --tool opencode --scope project` and the server exists in Claude Code user scope
- **THEN** system reads from `~/.claude.json` and writes to `./opencode.json`

#### Scenario: Copy from VS Code project to Claude Code user
- **WHEN** user runs `mcps copy github --from-tool vscode --from-scope project --tool claude --scope user`
- **THEN** system reads the server from `.vscode/mcp.json` and writes it to `~/.claude.json`

### Requirement: Interactive copy wizard
The system SHALL provide an interactive wizard when no target flags are specified, prompting the user to select target tool and scope after source detection.

#### Scenario: Interactive wizard flow
- **WHEN** user runs `mcps copy brave-search` with no flags and the server is found
- **THEN** system shows detected installations, prompts for target tool (Claude Code, OpenCode, Cline, VS Code, or All), then prompts for target scope (User or Project)

#### Scenario: Interactive wizard with single source auto-detected
- **WHEN** user runs `mcps copy brave-search` and only one source location exists
- **THEN** system skips source selection, shows the detected location, and proceeds to target prompts

### Requirement: Copy to "all" tools
The system SHALL support copying a server to Claude Code, OpenCode, Cline, and VS Code simultaneously.

#### Scenario: Copy to all tools interactively
- **WHEN** user selects "All" as the target tool in interactive mode
- **THEN** system writes the server to all tools at the selected scope

#### Scenario: Copy to all tools non-interactively
- **WHEN** user runs `mcps copy brave-search --tool all --scope user`
- **THEN** system writes to Claude Code, OpenCode, Cline, and VS Code user-scope configs without prompts
