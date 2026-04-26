## ADDED Requirements

### Requirement: Remove MCP server from one or both tools
The system SHALL remove an MCP server by name from the specified tool(s) and scope.

#### Scenario: Remove server from a specific tool
- **WHEN** user runs `mcp rm brave-search --tool claude --scope user`
- **THEN** system removes the server from Claude Code's user-scope config (`~/.claude.json` mcpServers)

#### Scenario: Remove server from both tools
- **WHEN** user runs `mcp rm brave-search --tool both --scope user`
- **THEN** system removes the server from both Claude Code and OpenCode user-scope configs

#### Scenario: Remove from project scope
- **WHEN** user runs `mcp rm notion --tool opencode --scope project`
- **THEN** system removes the server from `opencode.json` in the project root

### Requirement: Confirm before removal
The system SHALL prompt for confirmation before removing a server.

#### Scenario: Interactive confirmation
- **WHEN** user runs `mcp rm brave-search` without `--yes` flag
- **THEN** system shows which tools/scopes the server will be removed from and asks for confirmation

#### Scenario: Skip confirmation with flag
- **WHEN** user runs `mcp rm brave-search --yes`
- **THEN** system removes immediately without confirmation prompt

### Requirement: Error on non-existent server
The system SHALL report an error when attempting to remove a server that does not exist.

#### Scenario: Server not found
- **WHEN** user runs `mcp rm nonexistent --tool claude --scope user`
- **THEN** system displays "Server 'nonexistent' not found in Claude Code user scope" and exits with error
