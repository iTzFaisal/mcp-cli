## ADDED Requirements

### Requirement: Copy preserves remote authorization headers across tools
The system SHALL preserve remote authorization headers when copying an `http` MCP server, including when Cline is the source or destination.

#### Scenario: Copy authenticated remote server from Cline to Claude Code
- **WHEN** user runs `mcps copy api-server --from-tool cline --from-scope user --tool claude --scope user` and the Cline server has `headers.Authorization: "Bearer API_KEY"`
- **THEN** the copied Claude Code server includes the same `headers.Authorization` value

#### Scenario: Copy authenticated remote server from OpenCode to Cline
- **WHEN** user runs `mcps copy api-server --from-tool opencode --from-scope user --tool cline --scope user` and the OpenCode server has `headers.Authorization: "Bearer API_KEY"`
- **THEN** the copied Cline server includes the same `headers.Authorization` value
