## ADDED Requirements

### Requirement: Resolve Cline config path per platform
The system SHALL resolve the Cline MCP settings file path based on the current operating system.

#### Scenario: Resolve path on macOS
- **WHEN** running on macOS (`process.platform === "darwin"`)
- **THEN** Cline config path is `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

#### Scenario: Resolve path on Linux
- **WHEN** running on Linux (`process.platform === "linux"`)
- **THEN** Cline config path is `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

#### Scenario: Resolve path on Windows
- **WHEN** running on Windows (`process.platform === "win32"`)
- **THEN** Cline config path is `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Requirement: Cline is user-scope only
The system SHALL only support user scope for Cline. Project scope SHALL produce an error.

#### Scenario: User scope succeeds
- **WHEN** `configPath("cline", "user")` is called
- **THEN** system returns the platform-appropriate Cline config path

#### Scenario: Project scope is rejected
- **WHEN** `configPath("cline", "project")` is called or a command is run with `-t cline -s project`
- **THEN** system produces an error stating Cline only supports user scope
