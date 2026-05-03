## Purpose

Define how MCP configuration files are located, read, and written across supported tools and scopes.

## Requirements

### Requirement: Cross-platform config paths
The system SHALL resolve config file paths correctly on macOS, Linux, and Windows.

#### Scenario: Resolve Claude Code user config path on macOS/Linux
- **WHEN** running on macOS or Linux
- **THEN** Claude Code user config path is `~/.claude.json`

#### Scenario: Resolve Claude Code user config path on Windows
- **WHEN** running on Windows
- **THEN** Claude Code user config path is `%USERPROFILE%\.claude.json`

#### Scenario: Resolve OpenCode user config path on macOS/Linux
- **WHEN** running on macOS or Linux
- **THEN** OpenCode user config path is `~/.config/opencode/opencode.json`

#### Scenario: Resolve OpenCode user config path on Windows
- **WHEN** running on Windows
- **THEN** OpenCode user config path is `%USERPROFILE%\.config\opencode\opencode.json`

#### Scenario: Resolve VS Code user config path on macOS
- **WHEN** running on macOS
- **THEN** VS Code user config path is `~/Library/Application Support/Code/User/mcp.json`

#### Scenario: Resolve VS Code user config path on Linux
- **WHEN** running on Linux
- **THEN** VS Code user config path is `~/.config/Code/User/mcp.json`

#### Scenario: Resolve VS Code user config path on Windows
- **WHEN** running on Windows
- **THEN** VS Code user config path is `%APPDATA%/Code/User/mcp.json`

### Requirement: Read Claude Code user-scope config
The system SHALL read the `mcpServers` key from the Claude Code user config path and parse each server entry.

#### Scenario: Parse stdio server
- **WHEN** reading a server with `command` and `args` fields
- **THEN** system converts `command` string + `args` array into a universal command array

#### Scenario: Parse http server
- **WHEN** reading a server with `type: "http"` and `url` fields
- **THEN** system extracts URL, headers, and marks transport as http

### Requirement: Read Claude Code project-scope config
The system SHALL read the `mcpServers` key from `.mcp.json` in the project root.

#### Scenario: Read project config
- **WHEN** `.mcp.json` exists in the detected project root
- **THEN** system parses and returns all servers from the `mcpServers` key

#### Scenario: No project config exists
- **WHEN** `.mcp.json` does not exist in the project root
- **THEN** system returns an empty server list for project scope

### Requirement: Read OpenCode user-scope config
The system SHALL read the `mcp` key from the OpenCode user config path.

#### Scenario: Parse local server
- **WHEN** reading a server with `type: "local"` and `command` array
- **THEN** system extracts command array and environment variables into universal format

#### Scenario: Parse remote server
- **WHEN** reading a server with `type: "remote"` and `url`
- **THEN** system extracts URL, headers, and marks transport as http

### Requirement: Read OpenCode project-scope config
The system SHALL read the `mcp` key from `opencode.json` in the project root.

#### Scenario: Read project config
- **WHEN** `opencode.json` exists in the detected project root
- **THEN** system parses and returns all servers from the `mcp` key

### Requirement: Read VS Code user-scope config
The system SHALL read the `servers` key from the default local VS Code user MCP config path.

#### Scenario: Parse VS Code user config
- **WHEN** the VS Code user `mcp.json` file contains `servers.github` with `type: "http"` and `url`
- **THEN** system parses and returns the `github` server through the universal model

### Requirement: Read VS Code project-scope config
The system SHALL read the `servers` key from `.vscode/mcp.json` in the project root.

#### Scenario: Read workspace MCP config
- **WHEN** `.vscode/mcp.json` exists in the detected project root
- **THEN** system parses and returns all servers from the `servers` key

#### Scenario: No VS Code project config exists
- **WHEN** `.vscode/mcp.json` does not exist in the project root
- **THEN** system returns an empty server list for VS Code project scope

### Requirement: Write configs atomically
The system SHALL read the full JSON file, modify the relevant section, and write back the complete file without altering unrelated fields.

#### Scenario: Write to Claude Code user config
- **WHEN** adding/removing a server from `~/.claude.json`
- **THEN** system preserves all other fields in the file (projects, settings, etc.) and only modifies `mcpServers`

#### Scenario: Write to OpenCode user config
- **WHEN** adding/removing a server from `~/.config/opencode/opencode.json`
- **THEN** system preserves all other fields and only modifies the `mcp` key

#### Scenario: Write to VS Code user config
- **WHEN** adding/removing a server from the VS Code user `mcp.json`
- **THEN** system preserves all other fields and only modifies the `servers` key

#### Scenario: Create project config if missing
- **WHEN** writing to project scope and the config file does not exist
- **THEN** system creates a new file with the correct structure

### Requirement: Detect project root
The system SHALL detect the project root by walking up from the current working directory to find a `.git` directory.

#### Scenario: Inside a git repo
- **WHEN** CWD is inside a git repository
- **THEN** system identifies the repo root as the project root

#### Scenario: Outside a git repo
- **WHEN** CWD is not inside any git repository
- **THEN** system uses CWD as the project root with a warning
