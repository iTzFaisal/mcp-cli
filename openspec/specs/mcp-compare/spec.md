## Purpose

Define how `mcps compare` reports MCP server presence across supported tools and scopes and generates copy hints for missing destinations.

## Requirements

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

### Requirement: Non-interactive compare by name
The compare command SHALL support non-interactive usage when the server name is provided as an argument.

#### Scenario: Direct compare with positional argument
- **WHEN** user runs `mcps compare brave-search`
- **THEN** the system performs the comparison without prompting for additional input unless interactive hint-source selection is required by the terminal flow

#### Scenario: Stable hint source in non-interactive mode
- **WHEN** user runs `mcps compare brave-search` and the server exists in multiple configured locations
- **THEN** the system selects a stable preferred source location for generated hints
- **THEN** each generated hint includes `--from-tool` and `--from-scope` so the suggested `mcps copy` command is unambiguous

### Requirement: Interactive compare flow
The compare command SHALL support an interactive flow for users who do not provide the server name directly.

#### Scenario: Prompt for server name selection
- **WHEN** user runs `mcps compare` in an interactive terminal
- **THEN** the system prompts the user to choose from discovered MCP server names
- **THEN** the system runs the comparison for the selected server

#### Scenario: Prompt for hint source when multiple configured locations exist
- **WHEN** the interactive compare flow runs for a server that exists in multiple locations
- **THEN** the system prompts the user to choose which configured location should be used as the source for generated copy hints

### Requirement: Missing locations include copy hints
The compare command SHALL generate a suggested `mcps copy` command for every missing supported location whenever the server exists in at least one configured location.

#### Scenario: Hint for a single missing destination
- **WHEN** user runs `mcps compare brave-search` and the server exists in Claude Code user scope but is missing in OpenCode user scope
- **THEN** the output includes a hint command equivalent to `mcps copy brave-search --from-tool claude --from-scope user --tool opencode --scope user`

#### Scenario: Hint for Cline user destination
- **WHEN** user runs `mcps compare brave-search` and the server is missing in Cline user scope but exists in another supported location
- **THEN** the output includes a hint command targeting `--tool cline --scope user`

#### Scenario: Hint for VS Code project destination
- **WHEN** user runs `mcps compare brave-search` and the server is missing in VS Code project scope but exists in another supported location
- **THEN** the output includes a hint command targeting `--tool vscode --scope project`

### Requirement: Interactive cancellation is safe
The compare command SHALL abort without changes if the user cancels an interactive prompt.

#### Scenario: User cancels during server selection
- **WHEN** user starts `mcps compare` interactively and cancels the server selection prompt
- **THEN** the command exits without modifying any configuration files

#### Scenario: User cancels during hint source selection
- **WHEN** user starts interactive compare for a server with multiple configured locations and cancels the source-selection prompt
- **THEN** the command exits without modifying any configuration files
