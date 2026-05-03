## MODIFIED Requirements

### Requirement: Remove MCP server from one or more tools
The system SHALL remove an MCP server by name from the specified tool(s) and scope.

#### Scenario: Remove server from a specific tool
- **WHEN** user runs `mcp rm brave-search --tool claude --scope user`
- **THEN** system removes the server from Claude Code's user-scope config (`~/.claude.json` mcpServers)

#### Scenario: Remove server from all tools
- **WHEN** user runs `mcp rm brave-search --tool all --scope user`
- **THEN** system removes the server from Claude Code, OpenCode, Cline, and VS Code user-scope configs

#### Scenario: Remove from Cline
- **WHEN** user runs `mcps remove myserver --tool cline`
- **THEN** system removes the server from Cline config

#### Scenario: Remove from VS Code project scope
- **WHEN** user runs `mcps remove myserver --tool vscode --scope project`
- **THEN** system removes the server from `.vscode/mcp.json` under the `servers` key

#### Scenario: Remove from project scope
- **WHEN** user runs `mcp rm notion --tool opencode --scope project`
- **THEN** system removes the server from `opencode.json` in the project root
