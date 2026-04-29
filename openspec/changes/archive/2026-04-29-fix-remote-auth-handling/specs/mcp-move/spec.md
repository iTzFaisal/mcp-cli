## ADDED Requirements

### Requirement: Move preserves remote authorization headers across tools
The system SHALL preserve remote authorization headers when moving an `http` MCP server, including when Cline is the source or destination.

#### Scenario: Move authenticated remote server from Cline to Claude Code
- **WHEN** user runs `mcps move api-server --from-tool cline --from-scope user --tool claude --scope user` and the Cline server has `headers.Authorization: "Bearer API_KEY"`
- **THEN** the destination Claude Code server includes the same `headers.Authorization` value before the source is removed

#### Scenario: Move authenticated remote server from Claude Code to Cline
- **WHEN** user runs `mcps move api-server --from-tool claude --from-scope user --tool cline --scope user` and the Claude Code server has `headers.Authorization: "Bearer API_KEY"`
- **THEN** the destination Cline server includes the same `headers.Authorization` value before the source is removed
