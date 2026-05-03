## MODIFIED Requirements

### Requirement: List all MCP servers across tools
The system SHALL display all configured MCP servers from Claude Code, OpenCode, Cline, and VS Code in a single unified view.

#### Scenario: List with no servers configured
- **WHEN** user runs `mcp list` and no servers exist in any tool
- **THEN** system displays "No MCP servers configured" message

#### Scenario: List shows servers from both tools
- **WHEN** user runs `mcp list` with servers configured in both Claude Code and OpenCode
- **THEN** system displays each server with its name, tool(s), scope, and transport type

#### Scenario: List shows scope for each server
- **WHEN** a server exists in user-scope config
- **THEN** list output includes "user" label for that server

#### Scenario: List shows scope for project servers
- **WHEN** a server exists in project-scope config (.mcp.json, opencode.json, or `.vscode/mcp.json` in project root)
- **THEN** list output includes "project" label for that server

### Requirement: Filter list by tool
The system SHALL allow filtering the list to a specific tool.

#### Scenario: Filter to Claude Code only
- **WHEN** user runs `mcp list --tool claude`
- **THEN** system displays only servers configured in Claude Code

#### Scenario: Filter to OpenCode only
- **WHEN** user runs `mcp list --tool opencode`
- **THEN** system displays only servers configured in OpenCode

#### Scenario: Filter to Cline only
- **WHEN** user runs `mcps list --tool cline`
- **THEN** system displays only servers configured in Cline

#### Scenario: Filter to VS Code only
- **WHEN** user runs `mcps list --tool vscode`
- **THEN** system displays only servers configured in VS Code
