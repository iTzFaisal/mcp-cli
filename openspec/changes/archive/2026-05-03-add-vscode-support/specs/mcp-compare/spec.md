## MODIFIED Requirements

### Requirement: Compare a named MCP server across supported locations
The system SHALL provide a `compare` command that evaluates one MCP server name across every supported tool/scope location and reports whether that server is configured or missing in each location.

#### Scenario: Server configured in some locations
- **WHEN** user runs `mcps compare brave-search` and the server exists in Claude Code user scope and OpenCode project scope
- **THEN** the system reports Claude Code user and OpenCode project as configured
- **THEN** the system reports Claude Code project, OpenCode user, Cline user, VS Code user, and VS Code project as missing

#### Scenario: Server missing everywhere
- **WHEN** user runs `mcps compare nonexistent-server` and the server does not exist in any supported location
- **THEN** the system reports every supported location as missing
- **THEN** the system includes a message that no copy hints are available until the server is configured somewhere

### Requirement: Compare only supported destinations
The compare command SHALL only include supported tool/scope destinations in its output.

#### Scenario: Unsupported destination omitted
- **WHEN** user runs `mcps compare brave-search`
- **THEN** the system includes Claude Code user/project, OpenCode user/project, Cline user, and VS Code user/project in the comparison
- **THEN** the system does not report Cline project as a missing destination

### Requirement: Missing locations include copy hints
The compare command SHALL generate a suggested `mcps copy` command for every missing supported location whenever the server exists in at least one configured location.

#### Scenario: Hint for a single missing destination
- **WHEN** user runs `mcps compare brave-search` and the server exists in Claude Code user scope but is missing in OpenCode user scope
- **THEN** the output includes a hint command equivalent to `mcps copy brave-search --from-tool claude --from-scope user --tool opencode --scope user`

#### Scenario: Hint for VS Code project destination
- **WHEN** user runs `mcps compare brave-search` and the server is missing in VS Code project scope but exists in another supported location
- **THEN** the output includes a hint command targeting `--tool vscode --scope project`
