## Purpose

Define how the system resolves Hermes MCP configuration file paths.

## Requirements

### Requirement: Resolve Hermes config path per platform
The system SHALL resolve the Hermes MCP config file path based on the current operating system.

#### Scenario: Resolve path on macOS
- **WHEN** running on macOS (`process.platform === "darwin"`)
- **THEN** Hermes config path is `~/.hermes/config.yaml`

#### Scenario: Resolve path on Linux
- **WHEN** running on Linux (`process.platform === "linux"`)
- **THEN** Hermes config path is `~/.hermes/config.yaml`

#### Scenario: Resolve path on Windows
- **WHEN** running on Windows (`process.platform === "win32"`)
- **THEN** Hermes config path is `%USERPROFILE%\.hermes\config.yaml`

### Requirement: Hermes is user-scope only
The system SHALL only support user scope for Hermes. Project scope SHALL produce an error or be skipped consistently with the command flow being executed.

#### Scenario: User scope succeeds
- **WHEN** `configPath("hermes", "user")` is called
- **THEN** system returns the platform-appropriate Hermes config path

#### Scenario: Project scope is rejected
- **WHEN** `configPath("hermes", "project")` is called or a command is run with `--tool hermes --scope project`
- **THEN** system produces an error stating Hermes only supports user scope
