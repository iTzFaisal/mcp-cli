## ADDED Requirements

### Requirement: Resolve VS Code user MCP config path per platform
The system SHALL resolve the default local VS Code user MCP config path based on the current operating system.

#### Scenario: Resolve path on macOS
- **WHEN** running on macOS (`process.platform === "darwin"`)
- **THEN** the VS Code user MCP config path is `~/Library/Application Support/Code/User/mcp.json`

#### Scenario: Resolve path on Linux
- **WHEN** running on Linux (`process.platform === "linux"`)
- **THEN** the VS Code user MCP config path is `~/.config/Code/User/mcp.json`

#### Scenario: Resolve path on Windows
- **WHEN** running on Windows (`process.platform === "win32"`)
- **THEN** the VS Code user MCP config path is `%APPDATA%/Code/User/mcp.json`

### Requirement: Resolve VS Code workspace MCP config path
The system SHALL resolve the VS Code workspace MCP config path from the detected project root.

#### Scenario: Resolve workspace path
- **WHEN** the project root is `/tmp/myproject`
- **THEN** the VS Code workspace MCP config path is `/tmp/myproject/.vscode/mcp.json`
