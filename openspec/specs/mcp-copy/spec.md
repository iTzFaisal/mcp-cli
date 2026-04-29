## ADDED Requirements

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

### Requirement: Auto-detect server source locations
The system SHALL discover all locations where the named server is currently installed by reading all tool/scope combinations via `readServers()`.

#### Scenario: Server found in single location
- **WHEN** user runs `mcps copy myserver` interactively and the server exists only in Claude Code user scope
- **THEN** system automatically selects that location as the source and prompts for the target

#### Scenario: Server found in multiple locations
- **WHEN** user runs `mcps copy myserver` interactively and the server exists in both Claude Code user scope and OpenCode user scope
- **THEN** system presents a list of all locations and prompts the user to select which one to copy from

#### Scenario: Server not found anywhere
- **WHEN** user runs `mcps copy nonexistent`
- **THEN** system displays an error message "Server 'nonexistent' not found" and exits with code 1

### Requirement: Interactive copy wizard
The system SHALL provide an interactive wizard when no target flags are specified, prompting the user to select target tool and scope after source detection.

#### Scenario: Interactive wizard flow
- **WHEN** user runs `mcps copy brave-search` with no flags and the server is found
- **THEN** system shows detected installations, prompts for target tool (Claude Code, OpenCode, or Both), then prompts for target scope (User or Project)

#### Scenario: Interactive wizard with single source auto-detected
- **WHEN** user runs `mcps copy brave-search` and only one source location exists
- **THEN** system skips source selection, shows the detected location, and proceeds to target prompts

### Requirement: Non-interactive copy with flags
The system SHALL support non-interactive copying when `--tool` and `--scope` flags are provided.

#### Scenario: Non-interactive copy with explicit source
- **WHEN** user runs `mcps copy brave-search --from-tool claude --from-scope user --tool opencode --scope user`
- **THEN** system copies from the specified source to the specified target without any prompts

#### Scenario: Non-interactive copy with auto-detected source
- **WHEN** user runs `mcps copy brave-search --tool opencode --scope user` and the server exists in exactly one location
- **THEN** system auto-detects the source and copies without prompts

#### Scenario: Non-interactive with ambiguous source
- **WHEN** user runs `mcps copy brave-search --tool opencode --scope user` and the server exists in multiple locations without `--from-tool`/`--from-scope`
- **THEN** system displays an error listing all found locations and exits with code 1

### Requirement: Overwrite protection
The system SHALL prevent accidental overwrites when the server already exists at the destination.

#### Scenario: Interactive overwrite confirmation
- **WHEN** user copies a server to a location where it already exists in interactive mode
- **THEN** system prompts "Server 'name' already exists in [tool] [scope]. Overwrite?" and only proceeds on confirmation

#### Scenario: Non-interactive overwrite blocked by default
- **WHEN** user copies a server to a location where it already exists in non-interactive mode without `--force`
- **THEN** system displays an error "Server already exists. Use --force to overwrite." and exits with code 1

#### Scenario: Non-interactive overwrite with force
- **WHEN** user runs `mcps copy brave-search --tool opencode --scope user --force` and the server exists at the destination
- **THEN** system overwrites the existing server configuration without prompting

### Requirement: Copy to "all" tools
The system SHALL support copying a server to Claude Code, OpenCode, and Cline simultaneously.

#### Scenario: Copy to all tools interactively
- **WHEN** user selects "All" as the target tool in interactive mode
- **THEN** system writes the server to all tools at the selected scope

#### Scenario: Copy to all tools non-interactively
- **WHEN** user runs `mcps copy brave-search --tool all --scope user`
- **THEN** system writes to Claude Code, OpenCode, and Cline user-scope configs without prompts

#### Scenario: Copy from Cline to Claude Code
- **WHEN** user runs `mcps copy myserver --from cline --to claude`
- **THEN** system reads the server from Cline config and writes it to Claude Code config

### Requirement: Copy preserves remote authorization headers across tools
The system SHALL preserve remote authorization headers when copying an `http` MCP server, including when Cline is the source or destination.

#### Scenario: Copy authenticated remote server from Cline to Claude Code
- **WHEN** user runs `mcps copy api-server --from-tool cline --from-scope user --tool claude --scope user` and the Cline server has `headers.Authorization: "Bearer API_KEY"`
- **THEN** the copied Claude Code server includes the same `headers.Authorization` value

#### Scenario: Copy authenticated remote server from OpenCode to Cline
- **WHEN** user runs `mcps copy api-server --from-tool opencode --from-scope user --tool cline --scope user` and the OpenCode server has `headers.Authorization: "Bearer API_KEY"`
- **THEN** the copied Cline server includes the same `headers.Authorization` value
